from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.checkpoints import DBCheckpoint, PublicCheckpoint


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


class PublicAdventure(BaseAdventure):
    id: int


class LinkedAdventure(BaseAdventure):
    id: int
    checkpoints: list["PublicCheckpoint"]


class CreateAdventure(BaseAdventure):
    pass


class ModifyAdventure(BaseAdventure):
    name: str | None = None
    year: int | None = None
    ongoing: bool | None = None
    test: bool | None = None


# LinkedAdventure.model_rebuild()
# PublicAdventure.model_rebuild()
# ModifyAdventure.model_rebuild()
# CreateAdventure.model_rebuild()
# DBAdventure.model_rebuild()
