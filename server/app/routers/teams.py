from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import select, Session
from app.models.teams import (
    DBTeam,
    PublicTeam,
    AdminTeam,
    ModifyTeam,
    CreateTeam,
)
from app.models.users import DBUser

from app.schemas.base import DeleteResponse

from app.core.db import get_session
from app.deps import require_user

AdventureId = Annotated[int, Path(..., description="ID of the adventure")]
TeamId = Annotated[int, Path(..., description="ID of the team")]

UserDep = Annotated[DBUser, Depends(require_user)]
SessionDep = Annotated[Session, Depends(get_session)]


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
    session.exec(select(DBTeam)).all()

    return []

    # query = select(DBTeam).where(
    #     and_(DBTeam.adventure_id == adventure_id, DBTeam.active)
    # )
    # teams: list[DBTeam] = session.exec(query).all()
    # return teams


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
    db_team: TeamDep,
) -> PublicTeam:
    return db_team


@router.post(
    "/",
    response_model=PublicTeam,
    operation_id="createTeam",
    summary="Create a team",
    description="Creates a new team specified by *request body*",
    status_code=201,
    responses={
        201: {"description": "Team created"},
    },
)
def create_team(
    team: CreateTeam,
    adventure_id: AdventureId,
    session: SessionDep,
    user: UserDep,
) -> PublicTeam:
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
    session.refresh(db_team)

    return db_team


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
    responses={
        200: {"description": "Team fetched succesfully"},
    },
)
def list_admin_teams(
    adventure_id: AdventureId,
    session: SessionDep,
    user: UserDep,
) -> list[AdminTeam]:
    query = select(DBTeam).where(DBTeam.adventure_id == adventure_id)
    return session.exec(query).all()


@admin_router.get(
    "/{team_id}",
    response_model=AdminTeam,
    operation_id="fetchAdminTeam",
    summary="Fetch a single team in an adventure",
    description="Fetches a team in an adventure specified by it's id",
    responses={
        200: {"description": "Team fetched succesfully"},
        404: {"description": "Team could not be found"},
    },
)
def fetch_admin_team(
    db_team: TeamDep,
    user: UserDep,
) -> AdminTeam:
    return db_team


router.include_router(admin_router)
