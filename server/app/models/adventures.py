from sqlmodel import SQLModel, Field


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


class PublicAdventure(BaseAdventure):
    id: int


class CreateAdventure(BaseAdventure):
    pass


class ModifyAdventure(BaseAdventure):
    name: str | None = None
    year: int | None = None
    ongoing: bool | None = None
    test: bool | None = None
