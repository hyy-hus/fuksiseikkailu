from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Path
from sqlmodel import select

from datetime import datetime

from app.schemas.base import DeleteResponse
from app.deps import SessionDep, UserDep

from app.utils.notifications import send_push_notification_to_all

from app.models.news import (
    DBNews,
    PublicNews,
    AdminNews,
    ModifyNews,
    CreateNews,
)

AdventureId = Annotated[
    int, Path(..., description="ID of the adventure")
]  # to-do: Move this to a common place
NewsId = Annotated[int, Path(..., description="ID of the news")]


def get_news(
    adventure_id: AdventureId,
    news_id: NewsId,
    session: SessionDep,
) -> DBNews:
    query = select(DBNews).where(
        DBNews.adventure_id == adventure_id,
        DBNews.id == news_id,
    )

    db_news = session.exec(query).one_or_none()

    if not db_news:
        raise HTTPException(
            status_code=404,
            detail=f"News with id '{news_id}' not found in adventure '{adventure_id}'",
        )

    return db_news


def get_active_news(
    adventure_id: AdventureId,
    news_id: NewsId,
    session: SessionDep,
) -> DBNews:
    query = select(DBNews).where(
        DBNews.adventure_id == adventure_id,
        DBNews.id == news_id,
        DBNews.active,
    )

    db_news = session.exec(query).one_or_none()

    if not db_news:
        raise HTTPException(
            status_code=404,
            detail=f"News with id '{news_id}' not found in adventure '{adventure_id}'",
        )

    return db_news


NewsDep = Annotated[DBNews, Depends(get_news)]
ActiveNewsDep = Annotated[DBNews, Depends(get_active_news)]


router = APIRouter(prefix="/adventures/{adventure_id}/news", tags=["news"])


@router.get(
    "/",
    response_model=list[PublicNews],
    operation_id="listNews",
    summary="List all news in an adventure",
    description="Returns all active news for the specified adventure.",
    responses={200: {"description": "Teams fetched succesfully"}},
)
def list_news(
    adventure_id: AdventureId,
    session: SessionDep,
):
    query = select(DBNews).where(DBNews.adventure_id == adventure_id, DBNews.active)
    return session.exec(query).all()


@router.get(
    "/{news_id}",
    response_model=PublicNews,
    operation_id="fetchNews",
    summary="Fetch a news in an adventure",
    description="Returns publicly available information about the news specified by *news_id*",
    responses={
        200: {"description": "News fetched succesfully"},
        404: {"description": "News could not be found"},
    },
)
def fetch_news(db_news: ActiveNewsDep) -> PublicNews:
    return db_news


@router.post(
    "/",
    response_model=PublicNews,
    operation_id="createNews",
    summary="Create a news",
    description="Creates a new news specified by *request body*",
    status_code=201,
    responses={
        201: {"description": "News created"},
    },
)
def create_news(
    news: CreateNews,
    adventure_id: AdventureId,
    session: SessionDep,
    user: UserDep,
) -> PublicNews:
    db_news = DBNews.model_validate(news)
    db_news.adventure_id = adventure_id

    session.add(db_news)
    session.commit()
    session.refresh(db_news)

    return db_news


@router.patch(
    "/{news_id}",
    response_model=PublicNews,
    operation_id="patchNews",
    summary="Update a news",
    description="Update news specified by *team_id* and *adventure_id*",
    status_code=200,
    responses={
        200: {"description": "News updated succesfully"},
        404: {"description": "News could not be found"},
    },
)
def update_news(
    news: ModifyNews,
    db_news: NewsDep,
    user: UserDep,
    session: SessionDep,
) -> PublicNews:
    news_data = news.model_dump(exclude_unset=True)
    was_inactive = not db_news.active

    db_news.sqlmodel_update(news_data)

    if db_news.active:
        db_news.published_at = datetime.utcnow()
    else:
        db_news.published_at = None

    session.add(db_news)
    session.commit()
    session.refresh(db_news)

    if was_inactive and db_news.active:
        try:
            send_push_notification_to_all(
                session, title=db_news.title_fi, body=db_news.contents_fi
            )
        except Exception as e:
            # Log the error or raise HTTPException if you want it to block
            print(f"Notification error: {e}")

    return db_news


@router.delete(
    "/{news_id}",
    response_model=DeleteResponse,
    operation_id="deleteNews",
    summary="Delete a news",
    description="Delete news specified by *news_id* and *adventure_id*",
    responses={
        200: {"description": "News deleted succesfully"},
        404: {"description": "News could not be found"},
    },
)
def delete_news(
    db_news: NewsDep,
    user: UserDep,
    session: SessionDep,
) -> DeleteResponse:
    db_news.active = False
    session.add(db_news)
    session.commit()

    return DeleteResponse(ok=True)


admin_router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


@admin_router.get(
    "/",
    response_model=list[AdminNews],
    operation_id="listAdminNews",
    summary="List all news in an adventure",
    description="Returns admin level info of all active teams for the specified adventure.",
    responses={
        200: {"description": "News fetched succesfully"},
    },
)
def list_admin_news(
    adventure_id: AdventureId,
    user: UserDep,
    session: SessionDep,
) -> list[AdminNews]:
    query = select(DBNews).where(DBNews.adventure_id == adventure_id)
    return session.exec(query).all()


@admin_router.get(
    "/{news_id}",
    response_model=AdminNews,
    operation_id="fetchAdminNews",
    summary="Fetch a single news in an adventure",
    description="Fetches a news in an adventure specified by it's id",
    responses={
        200: {"description": "News fetched succesfully"},
        404: {"description": "News could not be found"},
    },
)
def fetch_admin_news(db_news: NewsDep, user: UserDep) -> AdminNews:
    return db_news


router.include_router(admin_router)
