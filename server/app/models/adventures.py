from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.checkpoints import DBCheckpoint, PublicCheckpoint
    from app.models.teams import DBTeam, PublicTeam
    from app.models.news import DBNews, PublicNews
    from app.models.news import DBScore, PublicScore


class BaseAdventure(SQLModel):
    name: str
    year: int
    ongoing: bool
    test: bool


class DBAdventure(BaseAdventure, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field()
    year: int = Field()
    ongoing: bool = Field(default=False)
    test: bool = Field(default=False)
    active: bool = Field(default=True)

    checkpoints: list["DBCheckpoint"] = Relationship(back_populates="adventure")
    teams: list["DBTeam"] = Relationship(back_populates="adventure")
    news: list["DBNews"] = Relationship(back_populates="adventure")
    scores: list["DBScore"] = Relationship(back_populates="adventure")


class PublicAdventure(BaseAdventure):
    id: int


class LinkedAdventure(BaseAdventure):
    id: int
    checkpoints: list["PublicCheckpoint"]
    teams: list["UnlinkedTeam"]
    news: list["PublicNews"]
    scores: list["PublicScore"]


class CreateAdventure(BaseAdventure):
    pass


class ModifyAdventure(BaseAdventure):
    name: str | None = None
    year: int | None = None
    ongoing: bool | None = None
    test: bool | None = None
