from sqlmodel import SQLModel, Field
from enum import Enum
from typing import Optional


class Role(str, Enum):
    guest = "guest"
    user = "user"
    admin = "admin"


class BaseUser(SQLModel):
    username: str
    email: str


class DBUser(BaseUser, table=True):
    id: int = Field(default=None, primary_key=True)
    username: str = Field()
    email: str = Field()

    hash: str = Field()

    active: bool = Field(default=True)
    role: Role = Field(default=Role.guest)


class CreateUser(BaseUser):
    username: str
    email: str
    password: str


class UpdateUser(BaseUser):
    username: str
    email: str
    password: Optional[str] = None
    role: Optional[Role] = None
    active: Optional[bool] = None


class PublicUser(BaseUser):
    id: int
    username: str
    email: str
