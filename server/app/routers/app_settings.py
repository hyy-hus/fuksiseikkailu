from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlmodel import select

from pydantic import BaseModel, Field, ValidationError

from app.schemas.base import DeleteResponse
from app.deps import SessionDep, UserDep

from app.models.app_settings import (
        DBAppSettings,
        PublicAppSettings,
        ModifyAppSettings,
    )

from app.models.adventures import (
    DBAdventure,
    PublicAdventure,
)

AdventureId = Annotated[
    int, Path(..., description="ID of the adventure")
]  # to-do: Move this to a common place

router = APIRouter(
    prefix="/admin/app_settings", tags=["settings", "admin"]
)


@router.get(
    "/",
    response_model=PublicAppSettings,
    operation_id="fetchAppSettings",
    summary="Fetch the application settings",
    description="Returns all the settings defined for the application",
    responses={200: {"description": "AppSettings fetched succesfully"}},
)
def fetch_app_settings(
    session: SessionDep,
):
    query = select(DBAppSettings).where(
        DBAppSettings.id == 1
    )
    return session.exec(query).one()

@router.patch(
    "/",
    response_model=PublicAppSettings,
    operation_id="patchAppSettings",
    summary="Update application settings",
    description="Update the settings of the application",
    status_code=200,
    responses={
        200: {"description": "Settings updated succesfully"},
        404: {"description": "Settings could not be found"},
    },
)
def update_checkpoint(
    settings: ModifyAppSettings,
    user: UserDep,
    session: SessionDep,
) -> PublicAppSettings:
    settings_data = settings.model_dump(exclude_unset=True)

    db_settings = session.exec(select(DBAppSettings).where(DBAppSettings.id == 1)).one()

    db_settings.sqlmodel_update(settings_data)

    session.add(db_settings)
    session.commit()
    session.refresh(db_settings)

    return db_settings

