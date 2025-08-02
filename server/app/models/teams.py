from sqlmodel import SQLModel, Field, Relationship

from app.models.adventures import PublicAdventure, DBAdventure


class BaseTeam(SQLModel):
    name: str


class DBTeam(BaseTeam, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field()

    adventure_id: int | None = Field(default=None, foreign_key="dbadventure.id")
    adventure: DBAdventure | None = Relationship(back_populates="teams")

    active: bool = Field(default=True)


class AdminTeam(BaseTeam):
    id: int
    name: str

    adventure_id: int
    adventure: DBAdventure

    active: bool


class PublicTeam(BaseTeam):
    id: int
    name: str

    adventure: PublicAdventure


class CreateTeam(BaseTeam):
    name: str
    adventure_id: int


class ModifyTeam(BaseTeam):
    name: str
    adventure_id: int
