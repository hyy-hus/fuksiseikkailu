from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from app.models.adventures import PublicAdventure, DBAdventure

from pydantic import BaseModel, Field as PydanticField

if TYPE_CHECKING:
    from app.models.scores import DBScore


class BaseCheckpoint(SQLModel):
    number: int
    area: int
    org_name: str
    org_abbreviation: str
    category: str
    latitude: str
    longitude: str
    address: str
    checkpoint_description: str
    org_description: str
    org_link: str
    accessible: bool


class DBCheckpoint(BaseCheckpoint, table=True):
    id: int | None = Field(default=None, primary_key=True)

    number: int = Field(default=0, index=True)
    area: int = Field(default=0, index=True)

    org_name: str = Field()
    org_abbreviation: str | None = Field()
    contact_person: str = Field()
    contact_email: str = Field()
    contact_phone: str = Field()
    category: str = Field()
    latitude: str | None = Field()
    longitude: str | None = Field()
    address: str = Field()
    requirements: str = Field()
    lanes: int = Field()
    checkpoint_description: str = Field()
    org_description: str | None = Field()
    org_link: str | None = Field()

    photo_permission: bool = Field(default=True)
    accessible: bool = Field(default=True)

    adventure_id: int | None = Field(default=None, foreign_key="dbadventure.id")
    adventure: DBAdventure | None = Relationship(back_populates="checkpoints")

    scores: list["DBScore"] = Relationship(back_populates="checkpoint")

    active: bool = Field(default=True)


class AdminCheckpoint(BaseCheckpoint):
    id: int
    number: int
    area: int
    org_name: str
    org_abbreviation: str
    contact_person: str
    contact_email: str
    contact_phone: str
    category: str
    latitude: str
    longitude: str
    address: str
    requirements: str
    lanes: int
    checkpoint_description: str
    org_description: str
    org_link: str

    photo_permission: bool
    accessible: bool

    adventure_id: int
    adventure: PublicAdventure
    active: bool


class PublicCheckpoint(BaseCheckpoint):
    id: int
    number: int
    area: int
    org_name: str
    org_abbreviation: str
    category: str
    latitude: str
    longitude: str
    address: str
    checkpoint_description: str
    org_description: str
    org_link: str
    accessible: bool


class CreateCheckpoint(BaseModel):
    number: Optional[int] = 0
    area: Optional[int] = 0
    org_name: Optional[str] = ""
    org_abbreviation: Optional[str] = ""
    contact_person: Optional[str] = ""
    contact_email: Optional[str] = ""
    contact_phone: Optional[str] = ""
    category: Optional[str] = ""
    latitude: Optional[str] = PydanticField(default="60.1699")
    longitude: Optional[str] = PydanticField(default="24.9384")
    address: Optional[str] = ""
    requirements: Optional[str] = ""
    lanes: Optional[int] = 0
    checkpoint_description: Optional[str] = ""
    org_description: Optional[str] = ""
    org_link: Optional[str] = ""
    
    photo_permission: Optional[bool] = True
    accessible: Optional[bool] = False


class ModifyCheckpoint(BaseCheckpoint):
    number: Optional[int] = None
    area: Optional[int] = None
    adventure_id: Optional[int] = None
    org_name: Optional[str] = None
    org_abbreviation: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    category: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    address: Optional[str] = None
    requirements: Optional[str] = None
    lanes: Optional[int] = None
    checkpoint_description: Optional[str] = None
    org_description: Optional[str] = None
    org_link: Optional[str] = None

    photo_permission: Optional[bool] = None
    accessible: Optional[bool] = None


# AdminCheckpoint.model_rebuild()
# PublicCheckpoint.model_rebuild()
# ModifyCheckpoint.model_rebuild()
# CreateCheckpoint.model_rebuild()
# DBCheckpoint.model_rebuild()
