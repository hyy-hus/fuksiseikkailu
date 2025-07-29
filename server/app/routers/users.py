from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import select
from app.models.users import DBUser, PublicUser, UpdateUser, CreateUser
from app.core.db import get_session
from sqlmodel import Session

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[PublicUser])
def list_users(
    include_inactive: bool = Query(False, description="Include inactive users"),
    session: Session = Depends(get_session),
):
    query = select(DBUser)
    if not include_inactive:
        query = query.where(DBUser.active)

    users = session.exec(query).all()
    return users


@router.get("/{user_id}", response_model=PublicUser)
def fetch_user(
    user_id: int,
    include_inactive: bool = Query(False, description="Include inactive users"),
    session: Session = Depends(get_session),
):
    query = select(DBUser)
    if not include_inactive:
        query = query.where(DBUser.active)

    db_user = session.exec(query.where(DBUser.id == user_id)).one_or_none()

    if not db_user:
        raise HTTPException(
            status_code=404, detail=f"User with id '{user_id}' not found"
        )

    return db_user


@router.post("/", response_model=PublicUser)
def create_user(user_data: CreateUser, session: Session = Depends(get_session)):
    db_user = DBUser.model_validate(user_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user


@router.patch("/{user_id}", response_model=PublicUser)
def update_user(
    user_id: int, user: UpdateUser, session: Session = Depends(get_session)
):
    db_user = session.exec(
        select(DBUser).where(DBUser.id == user_id, DBUser.active)
    ).one_or_none()

    if not db_user:
        raise HTTPException(
            status_code=404, detail=f"User with id '{user_id}' not found"
        )

    user_data = user.model_dump(exclude_unset=True)
    db_user.sqlmodel_update(user_data)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user


@router.delete("/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session)):
    db_user = session.exec(
        select(DBUser).where(DBUser.id == user_id).where(DBUser.active)
    ).one_or_none()

    if not db_user:
        raise HTTPException(
            status_code=404, detail=f"User with id '{user_id}' not found"
        )

    db_user.active = False

    session.add(db_user)
    session.commit()

    return {"ok": True}
