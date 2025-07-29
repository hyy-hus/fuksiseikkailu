from sqlmodel import SQLModel, Field


class BaseUser(SQLModel):
    username: str
    email: str


class DBUser(BaseUser, table=True):
    id: int = Field(default=None, primary_key=True)
    username: str = Field()
    email: str = Field()
    active: bool = Field(default=True)


class CreateUser(BaseUser):
    username: str
    email: str


class UpdateUser(BaseUser):
    username: str
    email: str


class PublicUser(BaseUser):
    id: int
    username: str
    email: str
