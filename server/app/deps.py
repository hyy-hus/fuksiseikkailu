from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.auth import decode_access_token
from app.core.db import get_session
from sqlmodel import Session, select
from app.models.users import DBUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)
):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    username: str = payload.get("sub")
    user = session.exec(select(DBUser).where(DBUser.username == username)).one_or_none()
    if not user or not user.active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    return user


def require_admin(current_user: DBUser = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Allowed only for admins")

    return current_user


def require_user(current_user: DBUser = Depends(get_current_user)):
    if current_user.role != "user" or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Allowed only for users and admins")

    return current_user
