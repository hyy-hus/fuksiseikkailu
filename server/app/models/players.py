from typing import TYPE_CHECKING, Optional
from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel, Field as PydanticField

from datetime import datetime

from app.models.teams import DBTeam


class BasePlayer(SQLModel):
    name: str = Field(description="Name of the player")
    phone: str = Field(description="Phone number of the player (optional)")


class DBPlayer(BasePlayer, table=True):
    id: int | None = Field(primary_key=True, default=None)
    name: str = Field()
    phone: Optional[str] = Field(default=None)

    team_id: int | None = Field(default=None, foreign_key="dbteam.id")
    team: DBTeam | None = Relationship(back_populates="players")

    active: bool = Field(default=True)


class AdminPlayer(BasePlayer):
    id: int
    name: str
    phone: str

    active: bool


class CreatePlayer(BaseModel):
    name: str = PydanticField(
        ..., description="Name of the player", example="Fiona Fuksi"
    )
    phone: str = PydanticField(
        ..., description="Phone number of the player", example="040 123 4567"
    )
    team_id: int = PydanticField(
        ..., description="ID of the team the player belongs to", example=1
    )


class ModifyPlayer(BaseModel):
    name: Optional[str] = PydanticField(
        ..., description="Name of the player", example="Fiona Fuksi"
    )
    phone: Optional[str] = PydanticField(
        ..., description="Phone number of the player", example="040 123 4567"
    )
