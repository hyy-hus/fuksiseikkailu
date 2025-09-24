from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str

    VAPID_PUBLIC_KEY: str
    VAPID_PRIVATE_KEY: str
    VAPID_SUBJECT: str

    ADMIN_USERNAME: str
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    SECRET: str

    R2_ACCESS_KEY: str
    R2_SECRET_KEY: str
    R2_ENDPOINT: str
    R2_BUCKET: str

    class Config:
        env_file = ".env"


settings = Settings()
