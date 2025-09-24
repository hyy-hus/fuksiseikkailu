from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import select

from app.schemas.base import DeleteResponse
from app.deps import SessionDep, UserDep

from sqlalchemy import func, desc

from app.models.scores import (
    DBScore,
    PublicScore,
    AdminScore,
    ModifyScore,
    CreateScore,
)

from app.models.teams import DBTeam, TeamLeaderboard

AdventureId = Annotated[int, Path(..., description="ID of the adventure")]
ScoreId = Annotated[int, Path(..., description="ID of the score")]


def get_score(
    adventure_id: AdventureId,
    score_id: ScoreId,
    session: SessionDep,
) -> DBScore:
    query = select(DBScore).where(
        DBScore.adventure_id == adventure_id, DBScore.id == score_id, DBScore.active
    )

    db_score = session.exec(query).one_or_none()

    if not db_score:
        raise HTTPException(
            status_code=404,
            detail=f"Score with id '{score_id}' not found in adventure '{adventure_id}'",
        )

    return db_score


ScoreDep = Annotated[DBScore, Depends(get_score)]


router = APIRouter(
    prefix="/adventures/{adventure_id}/scores",
    tags=["scores"],
)


@router.get(
    "/",
    response_model=list[PublicScore],
    operation_id="listScores",
    summary="List all scores in an adventure",
    description="Returns all active scores for the specified adventure.",
    responses={200: {"description": "Scores fetched succesfully"}},
)
def list_scores(
    adventure_id: AdventureId,
    session: SessionDep,
) -> list[PublicScore]:
    return session.exec(select(DBScore).where(DBScore.active)).all()


@router.get(
    "/leaderboard",
    response_model=list[TeamLeaderboard],
    operation_id="leaderboard",
    summary="Return a leaderboard of scores",
)
def leaderboard(
    adventure_id: AdventureId,
    session: SessionDep,
) -> list[TeamLeaderboard]:
    total_points = func.coalesce(func.sum(DBScore.score), 0).label("score")
    entries = func.count(DBScore.id).label("checkpoints")
    last_score_at = func.max(DBScore.created_at).label("last_score_at")

    stmt = (
        select(
            DBTeam.id.label("id"),
            DBTeam.number.label("number"),
            DBTeam.name.label("name"),
            total_points,
            entries,
            last_score_at,
        )
        .select_from(DBTeam)
        # keep LEFT JOIN semantics; put right-table filters in the ON clause
        .join(
            DBScore,
            (DBScore.team_id == DBTeam.id) & (DBScore.active.is_(True)),
            isouter=True,
        )
        .where(DBTeam.adventure_id == adventure_id)
        .group_by(DBTeam.id, DBTeam.name)
        .order_by(total_points.desc(), DBTeam.name)  # ✅ use the labeled column object
        # .order_by(total_points.desc(), last_score_at.desc())  # optional tiebreaker
    )
    rows = session.exec(stmt).all()
    return [TeamLeaderboard(**dict(row._mapping)) for row in rows]


@router.get(
    "/{score_id}",
    response_model=PublicScore,
    operation_id="fetchScore",
    summary="Fetch a score in an adventure",
    description="Returns publicly available information about the score specified by *score_id*.",
    responses={
        200: {"description": "Score fetched succesfully"},
        404: {"description": "Score could not be found"},
    },
)
def fetch_score(
    db_score: ScoreDep,
) -> PublicScore:
    return db_score


@router.post(
    "/",
    response_model=PublicScore,
    operation_id="createScore",
    summary="Create a score",
    description="Creates a new score specified by *request body*",
    status_code=201,
    responses={
        201: {"description": "Score created"},
    },
)
def create_score(
    score: CreateScore,
    adventure_id: AdventureId,
    session: SessionDep,
) -> PublicScore:
    existing = session.exec(
        select(DBScore).where(
            DBScore.adventure_id == adventure_id,
            DBScore.team_id == score.team_id,
            DBScore.checkpoint_id == score.checkpoint_id,
            DBScore.active == True,
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="A score for this adventure/team/checkpoint already exists."
        )

    db_score = DBScore.model_validate(score)
    db_score.adventure_id = adventure_id

    session.add(db_score)
    try:
        session.commit()             # DB-level constraint is the final guard
    except IntegrityError:
        session.rollback()
        raise HTTPException(
            status_code=409,
            detail="A score for this adventure/team/checkpoint already exists."
        )

    session.refresh(db_score)
    return db_score


@router.patch(
    "/{score_id}",
    response_model=PublicScore,
    operation_id="patchScore",
    summary="Update a score",
    description="Update score specified by *score_id* and *adventure_id*",
    status_code=200,
    responses={
        200: {"description": "Score updated succesfully"},
        404: {"description": "Score could not be found"},
    },
)
def update_score(
    score: ModifyScore,
    db_score: ScoreDep,
    user: UserDep,
    session: SessionDep,
) -> PublicScore:
    score_data = score.model_dump(exclude_unset=True)
    db_score.sqlmodel_update(score_data)

    session.add(db_score)
    session.commit()
    session.refresh(db_score)

    return db_score


@router.delete(
    "/{score_id}",
    response_model=DeleteResponse,
    operation_id="deleteScore",
    summary="Delete a score",
    description="Delete score specified by *score_id* and *adventure_id*",
    responses={
        200: {"description": "Score deleted succesfully"},
        404: {"description": "Score could not be found"},
    },
)
def delete_score(
    db_score: ScoreDep,
    user: UserDep,
    session: SessionDep,
) -> DeleteResponse:
    db_score.active = False
    session.add(db_score)
    session.commit()

    return DeleteResponse(ok=True)


admin_router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


@admin_router.get(
    "/",
    response_model=list[AdminScore],
    operation_id="listAdminScores",
    summary="List all scores in an adventure",
    description="Returns admin level list of all active scores for the specified adventure.",
    responses={
        200: {"description": "Score fetched succesfully"},
    },
)
def list_admin_scores(
    adventure_id: AdventureId,
    session: SessionDep,
    user: UserDep,
) -> list[AdminScore]:
    query = select(DBScore).where(DBScore.adventure_id == adventure_id)
    return session.exec(query).all()


@admin_router.get(
    "/{score_id}",
    response_model=AdminScore,
    operation_id="fetchAdminScore",
    summary="Fetch a single score in an adventure",
    description="Fetches a score in an adventure specified by it's id",
    responses={
        200: {"description": "Score fetched succesfully"},
        404: {"description": "Score could not be found"},
    },
)
def fetch_admin_score(
    db_score: ScoreDep,
    user: UserDep,
) -> AdminScore:
    return db_score


router.include_router(admin_router)
