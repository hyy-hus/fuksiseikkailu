from typing import Optional
from sqlmodel import SQLModel, Field, Relationship

from app.models.adventures import DBAdventure

from datetime import datetime


class BaseNews(SQLModel):
    title_en: str
    title_fi: str
    title_sv: str

    contents_en: str
    contents_fi: str
    contents_sv: str


class DBNews(BaseNews, table=True):
    id: int | None = Field(default=None, primary_key=True)

    title_en: str = Field()
    title_fi: str = Field()
    title_sv: str = Field()

    contents_en: str = Field()
    contents_fi: str = Field()
    contents_sv: str = Field()

    created_at: datetime = Field(default_factory=datetime.utcnow)

    adventure_id: int | None = Field(default=None, foreign_key="dbadventure.id")
    adventure: DBAdventure | None = Relationship(back_populates="news")

    active: bool = Field(default=True)


class AdminNews(BaseNews):
    id: int


class PublicNews(BaseNews):
    id: int


class CreateNews(BaseNews):
    pass


class ModifyNews(BaseNews):
    title_en: Optional[str] = None
    contents_en: Optional[str] = None
    title_fi: Optional[str] = None
    contents_fi: Optional[str] = None
    title_sv: Optional[str] = None
    contents_sv: Optional[str] = None
