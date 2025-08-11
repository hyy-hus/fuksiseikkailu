from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from app.models.adventures import PublicAdventure, DBAdventure
from app.models.teams import PublicTeam, DBTeam
from app.models.checkpoints import PublicCheckpoint, DBCheckpoint

from pydantic import BaseModel


class BaseScore(SQLModel):
    id: int
    score: int
    players: int


class DBScore(BaseScore, table=True):
    id: int | None = Field(default=None, primary_key=True)

    score: int = Field(default=0, index=True)
    players: int = Field(default=0, index=True)

    adventure_id: int | None = Field(default=None, foreign_key="dbadventure.id")
    adventure: Optional["DBAdventure"] = Relationship(back_populates="scores")

    team_id: int | None = Field(default=None, foreign_key="dbteam.id")
    team: Optional["DBTeam"] = Relationship(back_populates="scores")

    checkpoint_id: int | None = Field(default=None, foreign_key="dbcheckpoint.id")
    checkpoint: Optional["DBCheckpoint"] = Relationship(back_populates="scores")

    active: bool = Field(default=True)


class AdminScore(BaseScore):
    id: int
    score: int
    players: int

    adventure: PublicAdventure
    team: PublicTeam
    checkpoint: PublicCheckpoint


class PublicScore(BaseScore):
    id: int
    score: int
    players: int

    adventure: PublicAdventure
    team: PublicTeam
    checkpoint: PublicCheckpoint


class CreateScore(BaseModel):
    score: int
    players: int

    team_id: int
    checkpoint_id: int


class ModifyScore(BaseScore):
    score: Optional[int] = None
    players: Optional[int] = None

    team_id: Optional[int] = None
    checkpoint_id: Optional[int] = None
