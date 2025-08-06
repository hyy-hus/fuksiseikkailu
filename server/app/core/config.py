from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str

    VAPID_PUBLIC_KEY: str
    VAPID_PRIVATE_KEY: str
    VAPID_SUBJECT: str

    class Config:
        env_file = ".env"


settings = Settings()
