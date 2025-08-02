from fastapi import FastAPI

from app.routers import users, auth, adventures, checkpoints

app = FastAPI(root_path="/api")

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(adventures.router)
app.include_router(checkpoints.router)
