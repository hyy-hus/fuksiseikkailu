from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel, Field as PydanticField

from app.models.adventures import PublicAdventure, DBAdventure

from datetime import datetime

if TYPE_CHECKING:
    from app.models.scores import DBScore


class BaseTeam(SQLModel):
    name: str = Field(description="Name of the team")


class DBTeam(BaseTeam, table=True):
    id: int | None = Field(primary_key=True, default=None)
    name: str = Field()
    adventure_id: int | None = Field(default=None, foreign_key="dbadventure.id")
    adventure: DBAdventure | None = Relationship(back_populates="teams")

    scores: list["DBScore"] = Relationship(back_populates="team")

    active: bool = Field(default=True)


class AdminTeam(BaseTeam):
    id: int
    name: str

    adventure_id: int
    adventure: DBAdventure

    active: bool


class PublicTeam(BaseTeam):
    id: int = Field(description="Unique identifier")
    name: str

    adventure: PublicAdventure


class TeamLeaderboard(BaseTeam):
    id: int
    name: str
    score: int
    checkpoints: int
    last_score_at: datetime | None


class CreateTeam(BaseModel):
    name: str = PydanticField(
        ..., description="Name of the team", example="Theologian Tigers"
    )


class ModifyTeam(BaseModel):
    name: str = PydanticField(
        ..., description="Name of the team", example="Evil Engineers"
    )
