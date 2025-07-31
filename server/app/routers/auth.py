from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password
from app.core.auth import create_access_token
from app.core.db import get_session
from sqlmodel import select, Session
from app.models.users import DBUser

from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])


class Token(BaseModel):
    access_token: str
    token_type: str


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = session.exec(
        select(DBUser).where(DBUser.username == form_data.username)
    ).one_or_none()
    if not user or not verify_password(form_data.password, user.hash):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
