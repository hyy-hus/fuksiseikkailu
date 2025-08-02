from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import select, Session
from sqlalchemy import and_
from app.models.teams import (
    DBTeam,
    PublicTeam,
    AdminTeam,
    ModifyTeam,
    CreateTeam,
)
from app.models.users import DBUser

from app.core.db import get_session
from app.deps import require_user

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
)
def list_teams(
    adventure_id: int = Path(..., description="Adventure ID"),
    session: Session = Depends(get_session),
):
    query = select(DBTeam).where(
        and_(DBTeam.adventure_id == adventure_id, DBTeam.active)
    )
    return session.exec(query).all()


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
    team_id: int = Path(..., description="ID of the team"),
    adventure_id: int = Path(..., description="ID of the adventure"),
    session: Session = Depends(get_session),
):
    query = select(DBTeam).where(
        and_(DBTeam.id == team_id, DBTeam.adventure_id == adventure_id, DBTeam.active)
    )
    db_team = session.exec(query).one_or_none()

    if not db_team:
        raise HTTPException(
            status_code=404, detail=f"Team with id '{team_id}' not found"
        )

    return db_team


@router.get(
    "/admin/",
    response_model=list[AdminTeam],
    operation_id="listAdminTeams",
    summary="List all teams in an adventure",
    description="Returns admin level list of all active teams for the specified adventure.",
    responses={
        200: {"description": "Team fetched succesfully"},
    },
    tags=["admin"],
)
def list_admin_teams(
    adventure_id: int = Path(..., description="ID of the adventure"),
    session: Session = Depends(get_session),
    user: DBUser = Depends(require_user),
):
    query = select(DBTeam).where(DBTeam.adventure_id == adventure_id)
    return session.exec(query).all()


@router.get(
    "/admin/{team_id}",
    response_model=AdminTeam,
    operation_id="fetchAdminTeam",
    summary="Fetch a single team in an adventure",
    description="Fetches a team in an adventure specified by it's id",
    responses={
        200: {"description": "Team fetched succesfully"},
        404: {"description": "Team could not be found"},
    },
    tags=["admin"],
)
def fetch_admin_team(
    adventure_id: int = Path(..., description="ID of the adventure"),
    team_id: int = Path(..., description="ID of the team"),
    session: Session = Depends(get_session),
    user: DBUser = Depends(require_user),
):
    query = select(DBTeam).where(
        and_(DBTeam.id == team_id, DBTeam.adventure_id == adventure_id)
    )
    db_team = session.exec(query).one_or_none()

    if not db_team:
        raise HTTPException(
            status_code=404, detail=f"Team with id '{team_id}' not found"
        )

    return db_team


@router.post(
    "/",
    response_model=PublicTeam,
    operation_id="createTeam",
    summary="Create a team",
    description="Creates a new team specified by *request body*",
)
def create_team(
    team: CreateTeam,
    adventure_id: int = Path(..., description="ID of the adventure"),
    session: Session = Depends(get_session),
    user: DBUser = Depends(require_user),
):
    db_team = DBTeam.model_validate(team)
    db_team.adventure_id = adventure_id

    session.add(db_team)
    session.commit()
    session.refresh(db_team)

    return db_team


@router.patch(
    "/{team_id}",
    response_model=PublicTeam,
    operation_id="patchTeam",
    summary="Update a team",
    description="Update team specified by *team_id* and *adventure_id*",
    responses={
        200: {"description": "Team updated succesfully"},
        404: {"description": "Team could not be found"},
    },
)
def update_team(
    team: ModifyTeam,
    team_id: int = Path(..., description="ID of the team"),
    adventure_id: int = Path(..., description="ID of the adventure"),
    session: Session = Depends(get_session),
    user: DBUser = Depends(require_user),
):
    query = select(DBTeam).where(
        and_(DBTeam.id == team_id, DBTeam.adventure_id == adventure_id, DBTeam.active)
    )
    db_team = session.exec(query).one_or_none()

    if not db_team:
        raise HTTPException(
            status_code=404, detail=f"Team with id '{team_id}' not found"
        )

    team_data = team.model_dump(exclude_unset=True)
    team_data.adventure_id = adventure_id
    db_team.sqlmodel_update(team_data)

    session.add(db_team)
    session.commit()
    session.refresh(db_team)

    return db_team


@router.delete(
    "/{team_id}",
    operation_id="deleteTeam",
    summary="Delete a team",
    description="Delete team specified by *team_id* and *adventure_id*",
    responses={
        200: {"description": "Team deleted succesfully"},
        404: {"description": "Team could not be found"},
    },
)
def delete_team(
    team_id: int,
    adventure_id: int,
    session: Session = Depends(get_session),
    user: DBUser = Depends(require_user),
):
    db_team = session.exec(
        select(DBTeam).where(
            (DBTeam.id == team_id, DBTeam.adventure_id == adventure_id, DBTeam.active)
        )
    ).one_or_none()

    if not db_team:
        raise HTTPException(
            status_code=404, detail=f"Team with id '{team_id}' not found"
        )

    db_team.active = False
    session.add(db_team)
    session.commit()

    return {"ok": True}
