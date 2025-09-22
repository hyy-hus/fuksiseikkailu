from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import select

from app.schemas.base import DeleteResponse
from app.deps import SessionDep, UserDep

from app.models.players import (
    DBPlayer,
    AdminPlayer,
    ModifyPlayer,
    CreatePlayer,
)

PlayerId = Annotated[int, Path(..., description="ID of the player")]
TeamId = Annotated[int, Path(..., description="ID of the team")]


def get_player(
    player_id: PlayerId,
    session: SessionDep,
    user: UserDep,
) -> DBPlayer:
    query = select(DBPlayer).where(
        DBPlayer.id == player_id, DBPlayer.active
    )

    db_player = session.exec(query).one_or_none()

    if not db_player:
        raise HTTPException(
            status_code=404,
            detail=f"Player with id '{player_id}' not found in",
        )

    return db_player


PlayerDep = Annotated[DBPlayer, Depends(get_player)]


router = APIRouter(
    prefix="/players",
    tags=["players", "admin"],
)


@router.post(
    "/",
    response_model=AdminPlayer,
    operation_id="createPlayer",
    summary="Create a player",
    description="Creates a new player specified by *request body*",
    status_code=201,
    responses={
        201: {"description": "Player created"},
    },
)
def create_player(
    player: CreatePlayer,
    team_id: TeamId,
    session: SessionDep,
    user: UserDep,
) -> AdminPlayer:
    db_player = DBPlayer.model_validate(player)
    db_player.adventure_id = adventure_id

    session.add(db_player)
    session.commit()
    session.refresh(db_player)

    return db_player


@router.patch(
    "/{player_id}",
    response_model=AdminPlayer,
    operation_id="patchPlayer",
    summary="Update a player",
    description="Update player specified by *player_id* and *adventure_id*",
    status_code=200,
    responses={
        200: {"description": "Player updated succesfully"},
        404: {"description": "Player could not be found"},
    },
)
def update_player(
    player: ModifyPlayer,
    db_player: PlayerDep,
    user: UserDep,
    session: SessionDep,
) -> AdminPlayer:
    player_data = player.model_dump(exclude_unset=True)
    db_player.sqlmodel_update(player_data)

    session.add(db_player)
    session.commit()
    session.refresh(db_player)

    return db_player


@router.delete(
    "/{player_id}",
    response_model=DeleteResponse,
    operation_id="deletePlayer",
    summary="Delete a player",
    description="Delete player specified by *player_id* and *adventure_id*",
    responses={
        200: {"description": "Player deleted succesfully"},
        404: {"description": "Player could not be found"},
    },
)
def delete_player(
    db_player: PlayerDep,
    user: UserDep,
    session: SessionDep,
) -> DeleteResponse:
    db_player.active = False
    session.add(db_player)
    session.commit()

    return DeleteResponse(ok=True)

@router.get(
    "/",
    response_model=list[AdminPlayer],
    operation_id="listPlayers",
    summary="List all players in a team",
    description="Returns admin level list of all active players for the specified adventure.",
    responses={
        200: {"description": "Player fetched succesfully"},
    },
)
def list_players(
    team_id: TeamId,
    session: SessionDep,
    user: UserDep,
) -> list[AdminPlayer]:
    query = select(DBPlayer).where(DBPlayer.team_id == team_id)
    return session.exec(query).all()


@router.get(
    "/{player_id}",
    response_model=AdminPlayer,
    operation_id="fetchPlayer",
    summary="Fetch a single player in an adventure",
    description="Fetches a player in an adventure specified by it's id",
    responses={
        200: {"description": "Player fetched succesfully"},
        404: {"description": "Player could not be found"},
    },
)
def fetch_player(
    db_player: PlayerDep,
    user: UserDep,
) -> AdminPlayer:
    return db_player

