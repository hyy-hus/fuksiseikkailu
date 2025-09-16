from typing import TYPE_CHECKING, Optional
from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel, Field as PydanticField
from sqlalchemy import CheckConstraint

from app.models.adventures import PublicAdventure, DBAdventure

from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.sql import func

class BaseAppSettings(SQLModel):
    updated_at: datetime = Field(
        sa_column=sa.Column(
            sa.DateTime(),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        )
    )

class DBAppSettings(BaseAppSettings, table=True):
    __table_args__ = (CheckConstraint("id = 1", name="app_settings_singleton"),)

    id: int = Field(default=1, primary_key=True)
    current_adventure_id: Optional[int] = Field(
        default=None, foreign_key="dbadventure.id"
    )
    current_adventure: Optional[DBAdventure] = Relationship()

class PublicAppSettings(BaseAppSettings):
    current_adventure: Optional[PublicAdventure] = None

class ModifyAppSettings(SQLModel):
    current_adventure_id: Optional[int]

