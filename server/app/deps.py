from fastapi import Depends, HTTPException, status, Path
from fastapi.security import OAuth2PasswordBearer
from app.core.auth import decode_access_token
from app.core.db import get_session
from sqlmodel import Session, select
from app.models.users import DBUser

from typing import Annotated

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
OAuthDep = Annotated[str, Depends(oauth2_scheme)]

SessionDep = Annotated[Session, Depends(get_session)]


def get_current_user(session: SessionDep, token: OAuthDep):
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


CurrentUserDep = Annotated[DBUser, Depends(get_current_user)]


def require_admin(current_user: CurrentUserDep):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Allowed only for admins")

    return current_user


def require_user(current_user: CurrentUserDep):
    if current_user.role not in ("user", "admin"):
        raise HTTPException(status_code=403, detail="Allowed only for users and admins")

    return current_user


AdventureId = Annotated[int, Path(..., description="ID of the adventure")]
TeamId = Annotated[int, Path(..., description="ID of the team")]

UserDep = Annotated[DBUser, Depends(require_user)]
