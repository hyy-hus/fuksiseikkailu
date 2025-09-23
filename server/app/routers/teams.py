from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlmodel import Session

from app.schemas.base import DeleteResponse
from app.deps import SessionDep, UserDep

from app.models.teams import (
    DBTeam,
    PublicTeam,
    AdminTeam,
    ModifyTeam,
    CreateTeam,
)
from app.models.players import DBPlayer


# ------------------------
# Shared helpers
# ------------------------

def _counts_subquery():
    """COUNT(DBPlayer.id) per team_id."""
    return (
        select(
            DBPlayer.team_id.label("team_id"),
            func.count(DBPlayer.id).label("player_count"),
        )
        .group_by(DBPlayer.team_id)
        .subquery()
    )


def _team_stmt_with_count(
    *,
    adventure_id: Optional[int] = None,
    team_id: Optional[int] = None,
    active_only: bool | None = None,
    load_adventure: bool = True,
    load_players: bool = False,
):
    """
    Build a SELECT that returns (DBTeam, player_count) with optional filters.
    """
    counts_sq = _counts_subquery()

    stmt = (
        select(
            DBTeam,
            func.coalesce(counts_sq.c.player_count, 0).label("player_count"),
        )
        .join(counts_sq, counts_sq.c.team_id == DBTeam.id, isouter=True)
    )

    # Eager-load what the response models need
    opts = []
    if load_adventure:
        opts.append(selectinload(DBTeam.adventure))
    if load_players:
        opts.append(selectinload(DBTeam.players))
    if opts:
        stmt = stmt.options(*opts)

    # Filters
    conds = []
    if adventure_id is not None:
        conds.append(DBTeam.adventure_id == adventure_id)
    if team_id is not None:
        conds.append(DBTeam.id == team_id)
    if active_only:
        conds.append(DBTeam.active)
    if conds:
        stmt = stmt.where(*conds)

    # Stable ordering for lists
    if team_id is None:
        stmt = stmt.order_by(DBTeam.number.nulls_last(), DBTeam.id)

    return stmt


def _public_team_from_row(team: DBTeam, player_count: int) -> PublicTeam:
    data = {
        "id": team.id,
        "name": team.name,
        "number": team.number,
        "player_count": int(player_count or 0),
        "adventure": team.adventure,
    }
    return PublicTeam.model_validate(data, from_attributes=True)


def _admin_team_from_row(team: DBTeam, player_count: int) -> AdminTeam:
    # If AdminTeam includes fields like adventure_id/adventure/players/active,
    # model_validate(from_attributes=True) will pull them from the ORM object.
    data = {
        "id": team.id,
        "name": team.name,
        "number": team.number,
        "player_count": int(player_count or 0),
        "adventure_id": team.adventure_id,
        "adventure": team.adventure,
        "players": getattr(team, "players", None),  # loaded when load_players=True
        "active": team.active,
    }
    # Let Pydantic ignore Nones that aren't in the schema
    return AdminTeam.model_validate(data, from_attributes=True)


# ------------------------
# Params & dependencies
# ------------------------

AdventureId = Annotated[int, Path(..., description="ID of the adventure")]
TeamId = Annotated[int, Path(..., description="ID of the team")]

def get_team(
    adventure_id: AdventureId,
    team_id: TeamId,
    session: SessionDep,
) -> DBTeam:
    query = select(DBTeam).where(
        DBTeam.adventure_id == adventure_id, DBTeam.id == team_id, DBTeam.active
    )
    db_team = session.exec(query).one_or_none()
    if not db_team:
        raise HTTPException(
            status_code=404,
            detail=f"Team with id '{team_id}' not found in adventure '{adventure_id}'",
        )
    return db_team

TeamDep = Annotated[DBTeam, Depends(get_team)]


# ------------------------
# Routers
# ------------------------

router = APIRouter(
    prefix="/adventures/{adventure_id}/teams",
    tags=["teams"],
)

@router.get(
    "/",
    response_model=list[PublicTeam],
    operation_id="listTeams",
    summary="List all teams in an adventure",
    description="Returns all active teams for the specified adventure.",
    responses={200: {"description": "Teams fetched succesfully"}},
)
def list_teams(
    adventure_id: AdventureId,
    session: SessionDep,
) -> list[PublicTeam]:
    stmt = _team_stmt_with_count(
        adventure_id=adventure_id,
        active_only=True,
        load_adventure=True,
        load_players=False,  # public list doesn't need players loaded
    )
    rows = session.exec(stmt).all()
    return [_public_team_from_row(team, pc) for team, pc in rows]


@router.get(
    "/{team_id}",
    response_model=PublicTeam,
    operation_id="fetchTeam",
    summary="Fetch a team in an adventure",
    description="Returns publicly available information about the team specified by *team_id*.",
    responses={
        200: {"description": "Team fetched succesfully"},
        404: {"description": "Team could not be found"},
    },
)
def fetch_team(
    adventure_id: AdventureId,
    team_id: TeamId,
    session: SessionDep,
) -> PublicTeam:
    stmt = _team_stmt_with_count(
        adventure_id=adventure_id,
        team_id=team_id,
        active_only=True,
        load_adventure=True,
    )
    row = session.exec(stmt).first()
    if not row:
        raise HTTPException(status_code=404, detail="Team not found")
    team_obj, player_count = row
    return _public_team_from_row(team_obj, player_count)


@router.post(
    "/",
    response_model=PublicTeam,
    operation_id="createTeam",
    summary="Create a team",
    description="Creates a new team specified by *request body*",
    status_code=201,
    responses={201: {"description": "Team created"}},
)
def create_team(
    team: CreateTeam,
    adventure_id: AdventureId,
    session: SessionDep,
    user: UserDep,
) -> PublicTeam:
    db_team = DBTeam(name=team.name, adventure_id=adventure_id)
    for p in team.players:
        db_team.players.append(DBPlayer(name=p.name, phone=p.phone))

    session.add(db_team)
    session.commit()  # persists team + players (cascade)

    stmt = _team_stmt_with_count(team_id=db_team.id, load_adventure=True)
    team_row = session.exec(stmt).one()
    team_obj, player_count = team_row
    return _public_team_from_row(team_obj, player_count)

@router.post(
    "/bulk",
    response_model=List[PublicTeam],
    operation_id="bulkCreateTeams",
    summary="Bulk create teams",
    description="Creates multiple teams from a JSON list. Each item matches CreateTeam.",
    status_code=201,
    responses={201: {"description": "Teams created"}},
)
def bulk_create_teams(
    teams: List[CreateTeam],
    adventure_id: AdventureId,
    session: SessionDep,
    user: UserDep,
) -> List[PublicTeam]:
    if not teams:
        return []

    created: List[DBTeam] = []
    for payload in teams:
        team = DBTeam(name=payload.name, adventure_id=adventure_id)
        for p in payload.players:
            team.players.append(DBPlayer(name=p.name, phone=p.phone))
        session.add(team)
        created.append(team)

    session.commit()  # flushes and assigns IDs

    ids = [t.id for t in created if t.id is not None]
    if not ids:
        return []

    # Re-select all created teams with counts, in a single query
    stmt = _team_stmt_with_count(load_adventure=True).where(DBTeam.id.in_(ids))
    rows = session.exec(stmt).all()

    # Map by id and return in the same order as input
    by_id = {team.id: _public_team_from_row(team, pc) for team, pc in rows}
    return [by_id[i] for i in ids if i in by_id]


@router.patch(
    "/{team_id}",
    response_model=PublicTeam,
    operation_id="patchTeam",
    summary="Update a team",
    description="Update team specified by *team_id* and *adventure_id*",
    status_code=200,
    responses={
        200: {"description": "Team updated succesfully"},
        404: {"description": "Team could not be found"},
    },
)
def update_team(
    team: ModifyTeam,
    db_team: TeamDep,
    user: UserDep,
    session: SessionDep,
) -> PublicTeam:
    team_data = team.model_dump(exclude_unset=True)
    db_team.sqlmodel_update(team_data)

    session.add(db_team)
    session.commit()

    stmt = _team_stmt_with_count(team_id=db_team.id, load_adventure=True)
    team_row = session.exec(stmt).one()
    team_obj, player_count = team_row
    return _public_team_from_row(team_obj, player_count)


@router.delete(
    "/{team_id}",
    response_model=DeleteResponse,
    operation_id="deleteTeam",
    summary="Delete a team",
    description="Delete team specified by *team_id* and *adventure_id*",
    responses={
        200: {"description": "Team deleted succesfully"},
        404: {"description": "Team could not be found"},
    },
)
def delete_team(
    db_team: TeamDep,
    user: UserDep,
    session: SessionDep,
) -> DeleteResponse:
    db_team.active = False
    session.add(db_team)
    session.commit()
    return DeleteResponse(ok=True)


# ------------------------
# Admin router (with counts)
# ------------------------

admin_router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)

@admin_router.get(
    "/",
    response_model=list[AdminTeam],
    operation_id="listAdminTeams",
    summary="List all teams in an adventure",
    description="Returns admin level list of all active teams for the specified adventure.",
    responses={200: {"description": "Team fetched succesfully"}},
)
def list_admin_teams(
    adventure_id: AdventureId,
    session: SessionDep,
    user: UserDep,
) -> list[AdminTeam]:
    stmt = _team_stmt_with_count(
        adventure_id=adventure_id,
        active_only=True,
        load_adventure=True,
        load_players=False,  # flip to True if AdminTeam needs players materialized
    )
    rows = session.exec(stmt).all()
    return [_admin_team_from_row(team, pc) for team, pc in rows]


@admin_router.get(
    "/{team_id}",
    response_model=AdminTeam,
    operation_id="fetchAdminTeam",
    summary="Fetch a single team in an adventure",
    description="Fetches a team in an adventure specified by its id",
    responses={
        200: {"description": "Team fetched succesfully"},
        404: {"description": "Team could not be found"},
    },
)
def fetch_admin_team(
    adventure_id: AdventureId,
    team_id: TeamId,
    session: SessionDep,
    user: UserDep,
) -> AdminTeam:
    stmt = _team_stmt_with_count(
        adventure_id=adventure_id,
        team_id=team_id,
        active_only=True,
        load_adventure=True,
        load_players=True,  # load players if AdminTeam schema includes them
    )
    row = session.exec(stmt).first()
    if not row:
        raise HTTPException(status_code=404, detail="Team not found")
    team_obj, player_count = row
    return _admin_team_from_row(team_obj, player_count)


@admin_router.post(
    "/assign_numbers",
    response_model=None,
    operation_id="postAssignTeamNumbers",
    summary="Assign numbers for teams",
    description="Assign numbers for all teams in the adventure that don't have a number",
    responses={200: {"description": "Numbers assigned succesfully"}},
)
def assign_numbers(session: SessionDep, adventure_id: AdventureId, user: UserDep) -> None:
    teams_query = (
        select(DBTeam)
        .where(DBTeam.adventure_id == adventure_id)
        .with_for_update()
    )
    teams: list[DBTeam] = session.exec(teams_query).scalars().all()  # <-- unwrap

    used = {t.number for t in teams if t.number is not None}
    to_fill = [t for t in teams if t.number is None]
    if not to_fill:
        return

    next_n = 1
    for team in to_fill:
        while next_n in used:
            next_n += 1
        team.number = next_n
        used.add(next_n)
        next_n += 1

    session.commit()


router.include_router(admin_router)
