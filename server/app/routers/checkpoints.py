from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from app.models.checkpoints import (
    DBCheckpoint,
    PublicCheckpoint,
    AdminCheckpoint,
    ModifyCheckpoint,
    CreateCheckpoint,
)
from app.core.db import get_session
from sqlmodel import Session

router = APIRouter(prefix="/checkpoints", tags=["checkpoints"])


@router.get("/", response_model=list[PublicCheckpoint])
def list_checkpoints(
    session: Session = Depends(get_session),
):
    query = select(DBCheckpoint).where(DBCheckpoint.active)
    return session.exec(query).all()


@router.get("/{checkpoint_id}", response_model=PublicCheckpoint)
def fetch_checkpoint(
    checkpoint_id: int,
    session: Session = Depends(get_session),
):
    query = select(DBCheckpoint).where(
        DBCheckpoint.id == checkpoint_id and DBCheckpoint.active
    )
    db_checkpoint = session.exec(query).one_or_none()

    if not db_checkpoint:
        raise HTTPException(
            status_code=404, detail=f"Checkpoint with id '{checkpoint_id}' not found"
        )

    return db_checkpoint


@router.get("/admin/", response_model=list[AdminCheckpoint])
def list_admin_checkpoints(
    session: Session = Depends(get_session),
):
    query = select(DBCheckpoint)
    return session.exec(query).all()


@router.get("/admin/{checkpoint_id}", response_model=AdminCheckpoint)
def fetch_admin_checkpoint(
    checkpoint_id: int,
    session: Session = Depends(get_session),
):
    query = select(DBCheckpoint).where(DBCheckpoint.id == checkpoint_id)
    db_checkpoint = session.exec(query).one_or_none()

    if not db_checkpoint:
        raise HTTPException(
            status_code=404, detail=f"Checkpoint with id '{checkpoint_id}' not found"
        )

    return db_checkpoint


@router.post("/", response_model=PublicCheckpoint)
def create_checkpoint(
    checkpoint: CreateCheckpoint, session: Session = Depends(get_session)
):
    db_checkpoint = DBCheckpoint.model_validate(checkpoint)

    session.add(db_checkpoint)
    session.commit()
    session.refresh(db_checkpoint)

    return db_checkpoint


@router.patch("/{checkpoint_id}", response_model=PublicCheckpoint)
def update_checkpoint(
    checkpoint_id: int,
    checkpoint: ModifyCheckpoint,
    session: Session = Depends(get_session),
):
    query = select(DBCheckpoint).where(
        DBCheckpoint.id == checkpoint_id and DBCheckpoint.active
    )
    db_checkpoint = session.exec(query).one_or_none()

    if not db_checkpoint:
        raise HTTPException(
            status_code=404, detail=f"Checkpoint with id '{checkpoint_id}' not found"
        )

    checkpoint_data = checkpoint.model_dump(exclude_unset=True)
    db_checkpoint.sqlmodel_update(checkpoint_data)

    session.add(db_checkpoint)
    session.commit()
    session.refresh(db_checkpoint)

    return db_checkpoint


@router.delete("/{checkpoint_id}")
def delete_checkpoint(
    checkpoint_id: int,
    session: Session = Depends(get_session),
):
    db_checkpoint = session.exec(
        select(DBCheckpoint)
        .where(DBCheckpoint.id == checkpoint_id)
        .where(DBCheckpoint.active)
    ).one_or_none()

    if not db_checkpoint:
        raise HTTPException(
            status_code=404, detail=f"Checkpoint with id '{checkpoint_id}' not found"
        )

    db_checkpoint.active = False
    session.add(db_checkpoint)
    session.commit()

    return {"ok": True}
