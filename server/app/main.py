from fastapi import FastAPI

from app.routers import users, auth, adventures, checkpoints, teams, push, news

app = FastAPI(root_path="/api")

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(adventures.router)
app.include_router(checkpoints.router)
app.include_router(teams.router)
app.include_router(push.router)
app.include_router(news.router)
