from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import select
from app.deps import get_current_user
from app.models.users import DBUser, PublicUser, UpdateUser, CreateUser, Role
from app.core.db import get_session
from app.core.security import hash_password
from sqlmodel import Session

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[PublicUser])
def list_users(
    include_inactive: bool = Query(False, description="Include inactive users"),
    session: Session = Depends(get_session),
    current_user: DBUser | None = Depends(get_current_user),
):
    if include_inactive:
        if not current_user or current_user.role != Role.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required to include inactive users.",
            )

    query = select(DBUser)
    if not include_inactive:
        query = query.where(DBUser.active)

    return session.exec(query).all()


@router.get("/{user_id}", response_model=PublicUser)
def fetch_user(
    user_id: int,
    include_inactive: bool = Query(False, description="Include inactive users"),
    session: Session = Depends(get_session),
    current_user: DBUser | None = Depends(get_current_user),
):
    if include_inactive:
        if not current_user or current_user.role != Role.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required to include inactive users.",
            )

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
    hashed = hash_password(user_data.password)

    db_user = DBUser(
        username=user_data.username,
        email=user_data.email,
        hash=hashed,
    )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user


@router.patch("/{user_id}", response_model=PublicUser)
def update_user(
    user_id: int,
    user: UpdateUser,
    session: Session = Depends(get_session),
    current_user: DBUser = Depends(get_current_user),
):
    db_user = session.exec(
        select(DBUser).where(DBUser.id == user_id, DBUser.active)
    ).one_or_none()

    if not db_user:
        raise HTTPException(
            status_code=404, detail=f"User with id '{user_id}' not found"
        )

    user_data = user.model_dump(exclude_unset=True)

    if "password" in user_data and user_data["password"]:
        db_user.hash = hash_password(user_data.pop("password"))

    if "role" in user_data:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update roles")
        db_user.role = user_data.pop("role")

    if "active" in user_data:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update roles")

        db_user.active = user_data.pop("active")

    db_user.sqlmodel_update(user_data)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    return db_user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: DBUser = Depends(get_current_user),
):
    db_user = session.exec(
        select(DBUser).where(DBUser.id == user_id).where(DBUser.active)
    ).one_or_none()

    if not db_user:
        raise HTTPException(
            status_code=404, detail=f"User with id '{user_id}' not found"
        )

    # Only admins or the user themselves can delete
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to delete this user"
        )

    db_user.active = False
    session.add(db_user)
    session.commit()

    return {"ok": True}
