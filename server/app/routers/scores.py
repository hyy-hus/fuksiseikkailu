from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import select

from app.schemas.base import DeleteResponse
from app.deps import SessionDep, UserDep

from app.models.scores import (
    DBScore,
    PublicScore,
    AdminScore,
    ModifyScore,
    CreateScore,
)

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
    db_score = DBScore.model_validate(score)
    db_score.adventure_id = adventure_id

    session.add(db_score)
    session.commit()
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
