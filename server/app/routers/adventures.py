from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from app.models.adventures import (
    DBAdventure,
    LinkedAdventure,
    PublicAdventure,
    ModifyAdventure,
    CreateAdventure,
)
from app.core.db import get_session
from sqlmodel import Session

router = APIRouter(prefix="/adventures", tags=["adventures"])


@router.get("/", response_model=list[PublicAdventure])
def list_adventures(
    session: Session = Depends(get_session),
):
    query = select(DBAdventure).where(DBAdventure.active)
    return session.exec(query).all()


@router.get("/{adventure_id}", response_model=PublicAdventure)
def fetch_adventure(
    adventure_id: int,
    session: Session = Depends(get_session),
):
    query = select(DBAdventure).where(
        DBAdventure.id == adventure_id and DBAdventure.active
    )
    db_adventure = session.exec(query).one_or_none()

    if not db_adventure:
        raise HTTPException(
            status_code=404, detail=f"Adventure with id '{adventure_id}' not found"
        )

    return db_adventure


@router.post("/", response_model=PublicAdventure)
def create_adventure(
    adventure: CreateAdventure, session: Session = Depends(get_session)
):
    db_adventure = DBAdventure.model_validate(adventure)

    session.add(db_adventure)
    session.commit()
    session.refresh(db_adventure)

    return db_adventure


@router.patch("/{adventure_id}", response_model=PublicAdventure)
def update_adventure(
    adventure_id: int,
    adventure: ModifyAdventure,
    session: Session = Depends(get_session),
):
    query = select(DBAdventure).where(
        DBAdventure.id == adventure_id and DBAdventure.active
    )
    db_adventure = session.exec(query).one_or_none()

    if not db_adventure:
        raise HTTPException(
            status_code=404, detail=f"Adventure with id '{adventure_id}' not found"
        )

    adventure_data = adventure.model_dump(exclude_unset=True)
    db_adventure.sqlmodel_update(adventure_data)

    session.add(db_adventure)
    session.commit()
    session.refresh(db_adventure)

    return db_adventure


@router.delete("/{adventure_id}")
def delete_adventure(
    adventure_id: int,
    session: Session = Depends(get_session),
):
    db_adventure = session.exec(
        select(DBAdventure)
        .where(DBAdventure.id == adventure_id)
        .where(DBAdventure.active)
    ).one_or_none()

    if not db_adventure:
        raise HTTPException(
            status_code=404, detail=f"Adventure with id '{adventure_id}' not found"
        )

    db_adventure.active = False
    session.add(db_adventure)
    session.commit()

    return {"ok": True}
