from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import select, Session

from app.schemas.base import DeleteResponse
from app.deps import SessionDep, UserDep

from app.models.checkpoints import (
    DBCheckpoint,
    PublicCheckpoint,
    AdminCheckpoint,
    ModifyCheckpoint,
    CreateCheckpoint,
)

AdventureId = Annotated[
    int, Path(..., description="ID of the adventure")
]  # to-do: Move this to a common place
CheckpointId = Annotated[int, Path(..., description="ID of the checkpoint")]


def get_checkpoint(
    adventure_id: AdventureId,
    checkpoint_id: CheckpointId,
    session: SessionDep,
) -> DBCheckpoint:
    query = select(DBCheckpoint).where(
        DBCheckpoint.adventure_id == adventure_id,
        DBCheckpoint.id == checkpoint_id,
        DBCheckpoint.active,
    )

    db_checkpoint = session.exec(query).one_or_none()

    if not db_checkpoint:
        raise HTTPException(
            status_code=404,
            detail=f"Checkpoint with id '{checkpoint_id}' not found in adventure '{adventure_id}'",
        )

    return db_checkpoint


CheckpointDep = Annotated[DBCheckpoint, Depends(get_checkpoint)]


router = APIRouter(
    prefix="/adventures/{adventure_id}/checkpoints", tags=["checkpoints"]
)


@router.get(
    "/",
    response_model=list[PublicCheckpoint],
    operation_id="listCheckpoints",
    summary="List all checkpoints in an adventure",
    description="Returns all active checkpoints for the specified adventure.",
    responses={200: {"description": "Teams fetched succesfully"}},
)
def list_checkpoints(
    adventure_id: AdventureId,
    session: SessionDep,
):
    query = select(DBCheckpoint).where(
        DBCheckpoint.adventure_id == adventure_id, DBCheckpoint.active
    )
    return session.exec(query).all()


@router.get(
    "/{checkpoint_id}",
    response_model=PublicCheckpoint,
    operation_id="fetchCheckpoint",
    summary="Fetch a checkpoint in an adventure",
    description="Returns publicly available information about the checkpoint specified by *checkpoint_id*",
    responses={
        200: {"description": "Checkpoint fetched succesfully"},
        404: {"description": "Checkpoint could not be found"},
    },
)
def fetch_checkpoint(db_checkpoint: CheckpointDep) -> PublicCheckpoint:
    return db_checkpoint


@router.post(
    "/",
    response_model=PublicCheckpoint,
    operation_id="createCheckpoint",
    summary="Create a checkpoint",
    description="Creates a new checkpoint specified by *request body*",
    status_code=201,
    responses={
        201: {"description": "Checkpoint created"},
    },
)
def create_checkpoint(
    checkpoint: CreateCheckpoint,
    adventure_id: AdventureId,
    session: SessionDep,
    user: UserDep,
) -> PublicCheckpoint:
    db_checkpoint = DBCheckpoint.model_validate(checkpoint)
    db_checkpoint.adventure_id = adventure_id

    session.add(db_checkpoint)
    session.commit()
    session.refresh(db_checkpoint)

    return db_checkpoint


@router.patch(
    "/{checkpoint_id}",
    response_model=PublicCheckpoint,
    operation_id="patchCheckpoint",
    summary="Update a checkpoint",
    description="Update checkpoint specified by *team_id* and *adventure_id*",
    status_code=200,
    responses={
        200: {"description": "Checkpoint updated succesfully"},
        404: {"description": "Checkpoint could not be found"},
    },
)
def update_checkpoint(
    checkpoint: ModifyCheckpoint,
    db_checkpoint: CheckpointDep,
    user: UserDep,
    session: SessionDep,
) -> PublicCheckpoint:
    checkpoint_data = checkpoint.model_dump(exclude_unset=True)
    db_checkpoint.sqlmodel_update(checkpoint_data)

    session.add(db_checkpoint)
    session.commit()
    session.refresh(db_checkpoint)

    return db_checkpoint


@router.delete(
    "/{checkpoint_id}",
    response_model=DeleteResponse,
    operation_id="deleteCheckpoint",
    summary="Delete a checkpoint",
    description="Delete checkpoint specified by *checkpoint_id* and *adventure_id*",
    responses={
        200: {"description": "Checkpoint deleted succesfully"},
        404: {"description": "Checkpoint could not be found"},
    },
)
def delete_checkpoint(
    db_checkpoint: CheckpointDep,
    user: UserDep,
    session: SessionDep,
) -> DeleteResponse:
    db_checkpoint.active = False
    session.add(db_checkpoint)
    session.commit()

    return DeleteResponse(ok=True)


admin_router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


@admin_router.get(
    "/",
    response_model=list[AdminCheckpoint],
    operation_id="listAdminCheckpoints",
    summary="List all checkpoints in an adventure",
    description="Returns admin level info of all active teams for the specified adventure.",
    responses={
        200: {"description": "Checkpoints fetched succesfully"},
    },
)
def list_admin_checkpoints(
    adventure_id: AdventureId,
    user: UserDep,
    session: SessionDep,
) -> list[AdminCheckpoint]:
    query = select(DBCheckpoint).where(DBCheckpoint.adventure_id == adventure_id)
    return session.exec(query).all()


@admin_router.get(
    "/{checkpoint_id}",
    response_model=AdminCheckpoint,
    operation_id="fetchAdminCheckpoint",
    summary="Fetch a single checkpoint in an adventure",
    description="Fetches a checkpoint in an adventure specified by it's id",
    responses={
        200: {"description": "Checkpoint fetched succesfully"},
        404: {"description": "Checkpoint could not be found"},
    },
)
def fetch_admin_checkpoint(
    db_checkpoint: CheckpointDep, user: UserDep
) -> AdminCheckpoint:
    return db_checkpoint


router.include_router(admin_router)
