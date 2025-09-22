from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routers import users, auth, adventures, checkpoints, teams, push, news, scores, app_settings, players

app = FastAPI(root_path="/api")

raw = os.getenv("CORS_ALLOW_ORIGINS", "")
ALLOW_ORIGINS = [o.strip() for o in raw.split(",") if o.strip()]

# Reasonable defaults for local dev if env not set
if not ALLOW_ORIGINS:
    ALLOW_ORIGINS = ["http://localhost:8788", "http://127.0.0.1:8788"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,               # use explicit list if you send cookies
    # OR allow a pages.dev wildcard if you need many previews:
    allow_origin_regex=r"^https://.*\.pages\.dev$",
    allow_credentials=True,                    # set True if you send cookies; ok to keep True if using Authorization header too
    allow_methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(adventures.router)
app.include_router(checkpoints.router)
app.include_router(teams.router)
app.include_router(push.router)
app.include_router(news.router)
app.include_router(scores.router)
app.include_router(app_settings.router)
app.include_router(players.router)
