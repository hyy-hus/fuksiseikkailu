from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from app.models.teams import (
    DBTeam,
    PublicTeam,
    AdminTeam,
    ModifyTeam,
    CreateTeam,
)
from app.core.db import get_session
from sqlmodel import Session

router = APIRouter(prefix="/adventures/{adventure_id}/teams", tags=["teams"])


@router.get("/", response_model=list[PublicTeam])
def list_teams(
    adventure_id: int,
    session: Session = Depends(get_session),
):
    query = select(DBTeam).where(DBTeam.adventure_id == adventure_id and DBTeam.active)
    return session.exec(query).all()


@router.get("/{team_id}", response_model=PublicTeam)
def fetch_team(
    team_id: int,
    adventure_id: int,
    session: Session = Depends(get_session),
):
    query = select(DBTeam).where(
        DBTeam.id == team_id and DBTeam.adventure_id == adventure_id and DBTeam.active
    )
    db_team = session.exec(query).one_or_none()

    if not db_team:
        raise HTTPException(
            status_code=404, detail=f"Team with id '{team_id}' not found"
        )

    return db_team


@router.get("/admin/", response_model=list[AdminTeam])
def list_admin_teams(
    adventure_id: int,
    session: Session = Depends(get_session),
):
    query = select(DBTeam).where(DBTeam.adventure_id == adventure_id)
    return session.exec(query).all()


@router.get("/admin/{team_id}", response_model=AdminTeam)
def fetch_admin_team(
    adventure_id: int,
    team_id: int,
    session: Session = Depends(get_session),
):
    query = select(DBTeam).where(
        DBTeam.id == team_id and DBTeam.adventure_id == adventure_id
    )
    db_team = session.exec(query).one_or_none()

    if not db_team:
        raise HTTPException(
            status_code=404, detail=f"Team with id '{team_id}' not found"
        )

    return db_team


@router.post("/", response_model=PublicTeam)
def create_team(
    team: CreateTeam, adventure_id, session: Session = Depends(get_session)
):
    db_team = DBTeam.model_validate(team)
    db_team.adventure_id = adventure_id

    session.add(db_team)
    session.commit()
    session.refresh(db_team)

    return db_team


@router.patch("/{team_id}", response_model=PublicTeam)
def update_team(
    team_id: int,
    adventure_id: int,
    team: ModifyTeam,
    session: Session = Depends(get_session),
):
    query = select(DBTeam).where(
        DBTeam.id == team_id and DBTeam.adventure_id == adventure_id and DBTeam.active
    )
    db_team = session.exec(query).one_or_none()

    if not db_team:
        raise HTTPException(
            status_code=404, detail=f"Team with id '{team_id}' not found"
        )

    team_data = team.model_dump(exclude_unset=True)
    team_data.adventure_id = adventure_id
    db_team.sqlmodel_update(team_data)

    session.add(db_team)
    session.commit()
    session.refresh(db_team)

    return db_team


@router.delete("/{team_id}")
def delete_team(
    team_id: int,
    adventure_id: int,
    session: Session = Depends(get_session),
):
    db_team = session.exec(
        select(DBTeam).where(
            DBTeam.id == team_id
            and DBTeam.adventure_id == adventure_id
            and DBTeam.active
        )
    ).one_or_none()

    if not db_team:
        raise HTTPException(
            status_code=404, detail=f"Team with id '{team_id}' not found"
        )

    db_team.active = False
    session.add(db_team)
    session.commit()

    return {"ok": True}
