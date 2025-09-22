from typing import TYPE_CHECKING, Optional
from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel, Field as PydanticField, ConfigDict

from sqlalchemy import UniqueConstraint, select, func
from sqlalchemy.orm import column_property
from sqlalchemy.ext.hybrid import hybrid_property

from app.models.adventures import PublicAdventure, DBAdventure

from datetime import datetime

if TYPE_CHECKING:
    from app.models.scores import DBScore
    from app.models.players import DBPlayer, AdminPlayer


class BaseTeam(SQLModel):
    name: str = Field(description="Name of the team")


class DBTeam(BaseTeam, table=True):
    __table_args__ = (
        UniqueConstraint("adventure_id", "number", name="uq_team_adventure_number"),
    )
    id: int | None = Field(primary_key=True, default=None)

    name: str = Field()
    number: Optional[int] = Field(default=None, index=True)

    adventure_id: int | None = Field(default=None, foreign_key="dbadventure.id")
    adventure: DBAdventure | None = Relationship(back_populates="teams")

    scores: list["DBScore"] = Relationship(back_populates="team")
    players: list["DBPlayer"] = Relationship(
        back_populates="team",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    active: bool = Field(default=True)


class AdminTeam(BaseTeam):
    id: int

    name: str
    number: Optional[int]

    adventure_id: int
    adventure: DBAdventure

    players: list["AdminPlayer"]
    player_count: int

    active: bool


class PublicTeam(BaseTeam):
    id: int = Field(description="Unique identifier")
    name: str
    number: Optional[int]

    player_count: int

    adventure: PublicAdventure

class UnlinkedTeam(BaseTeam):
    id: int
    name: str
    number: Optional[int]


class TeamLeaderboard(BaseTeam):
    id: int
    name: str
    number: Optional[int]
    score: int
    checkpoints: int
    last_score_at: datetime | None

class Player(BaseModel):
    name: str = PydanticField(..., description="Name of the player", example="Fiona Fuksi")
    phone: Optional[str] = PydanticField(..., description="Phone number of the player", example="040 123 4567")

class CreateTeam(BaseModel):
    name: str = PydanticField(
        ..., description="Name of the team", example="Theologian Tigers"
    )
    number: Optional[int] = PydanticField(
        ..., description="Number of the team", example="12"
    )
    players: list[Player] = []


class ModifyTeam(BaseModel):
    name: str = PydanticField(
        ..., description="Name of the team", example="Evil Engineers"
    )
    number: Optional[int] = PydanticField(
        ..., description="Number of the team", example="12"
    )
