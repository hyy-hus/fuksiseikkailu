from sqlmodel import SQLModel, Field
from sqlalchemy import JSON, Column


class BasePushSubscription(SQLModel):
    endpoint: str
    keys: dict[str, str]


class DBPushSubscription(BasePushSubscription, table=True):
    id: int | None = Field(default=None, primary_key=True)
    endpoint: str = Field(index=True, nullable=False, unique=True)
    keys: dict[str, str] = Field(sa_column=Column(JSON), default_factory=dict)


class PublicPushSubscription(BasePushSubscription):
    endpoint: str
    keys: dict[str, str]


class CreatePushSubscription(BasePushSubscription):
    endpoint: str
    keys: dict[str, str]
