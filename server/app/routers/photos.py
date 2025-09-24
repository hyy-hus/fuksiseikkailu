from fastapi import FastAPI, UploadFile, File, Depends, Query, HTTPException, APIRouter, Depends, HTTPException, Path, status
from app.r2_utils import (
    generate_presigned_post,
    generate_presigned_view_url,
    s3_client,
    R2_BUCKET,
)
from uuid import uuid4
from sqlmodel import SQLModel, Session, select
from sqlalchemy import or_

from app.deps import SessionDep, UserDep
from app.models import (
    DBPhoto,
    PublicPhoto,
    DBTag,
    PublicTag,
    CreateTag,
)

from datetime import datetime, timedelta

from enum import Enum

router = APIRouter(
    prefix="/photos",
    tags=["photos"],
)


@router.get("/upload-url",
    operation_id="getUploadUrl",
)
def get_upload_url():
    object_key = f"uploads/{uuid4()}.jpg"
    return generate_presigned_post(object_key)


@router.post("/upload-file", operation_id="uploadPhoto")
async def upload_file(
    session: SessionDep,
    file: UploadFile = File(...)
):
    object_key = f"uploads/{file.filename}"
    contents = await file.read()

    s3_client.put_object(
        Bucket=R2_BUCKET, Key=object_key, Body=contents, ContentType=file.content_type
    )

    photo = DBPhoto(key=object_key, content_type=file.content_type)
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return {"id": photo.id, "key": photo.key}

@router.get("/test")
async def test():
    print("endpoint:", s3_client.meta.endpoint_url)
    print("bucket var:", repr(R2_BUCKET))  # catch stray spaces/newlines
    print("buckets:", [b["Name"] for b in s3_client.list_buckets().get("Buckets", [])])
    s3_client.head_bucket(Bucket=R2_BUCKET)  # should not raise


from boto3.s3.transfer import TransferConfig

transfer_cfg = TransferConfig(
    multipart_threshold=5 * 1024 * 1024,  # 5MB
    multipart_chunksize=5 * 1024 * 1024,
    max_concurrency=2,  # tune if CPU/IO allows
)

@router.post("/photos", operation_id="uploadPhotos")
def upload_photo(
    session: SessionDep,
    original: UploadFile = File(...),
    resized: UploadFile = File(...),
    thumb: UploadFile = File(...),
):
    key = f"{uuid4()}-{original.filename}"

    # stream: no .read(), pass file-like objects
    s3_client.upload_fileobj(
        Fileobj=original.file,
        Bucket=R2_BUCKET,
        Key=f"orig/{key}",
        ExtraArgs={"ContentType": original.content_type},
        Config=transfer_cfg,
    )
    s3_client.upload_fileobj(
        Fileobj=resized.file,
        Bucket=R2_BUCKET,
        Key=f"resized/{key}",
        ExtraArgs={"ContentType": resized.content_type},
        Config=transfer_cfg,
    )
    s3_client.upload_fileobj(
        Fileobj=thumb.file,
        Bucket=R2_BUCKET,
        Key=f"thumb/{key}",
        ExtraArgs={"ContentType": thumb.content_type},
        Config=transfer_cfg,
    )

    photo = DBPhoto(
        key=key,
        content_type=resized.content_type,
        original_url=generate_presigned_view_url(f"orig/{key}"),
        resized_url=generate_presigned_view_url(f"resized/{key}"),
        thumb_url=generate_presigned_view_url(f"thumb/{key}"),
        url_expires_at=datetime.utcnow() + timedelta(hours=1),
    )
    session.add(photo)
    session.commit()
    session.refresh(photo)
    return {"id": photo.id, "key": photo.key}


class SortOption(str, Enum):
    newest = "newest"
    oldest = "oldest"
    liked = "liked"
    viewed = "viewed"


@router.get("/photos/refresh", operation_id="refreshPhotos")
def refresh_photos(session: SessionDep):
    photos = session.exec(select(DBPhoto)).all()

    now = datetime.utcnow()
    for photo in photos:
        photo.original_url = generate_presigned_view_url(f"orig/{photo.key}")
        photo.resized_url = generate_presigned_view_url(f"resized/{photo.key}")
        photo.thumb_url = generate_presigned_view_url(f"thumb/{photo.key}")
        photo.url_expires_at = now + timedelta(hours=1)
        session.add(photo)

    session.commit()

    return {"ok": True}


@router.get("/photos", response_model=list[PublicPhoto], operation_id="listPhotos")
def list_photos(
    session : SessionDep,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    sort: SortOption = Query(SortOption.newest),
    search_query: str | None = Query(None, min_length=1),
):
    query = select(DBPhoto).where(DBPhoto.flagged == False)

    if search_query:
        like_pattern = f"%{search_query}%"
        query = (
            query.join(DBPhoto.tags, isouter=True)
            .where(
                or_(
                    DBTag.name.ilike(like_pattern),
                )
            )
            .distinct()
        )

    if sort == SortOption.newest:
        query = query.order_by(DBPhoto.uploaded_at.desc())
    elif sort == SortOption.oldest:
        query = query.order_by(DBPhoto.uploaded_at.asc())
    elif sort == SortOption.liked:
        query = query.order_by(DBPhoto.likes.desc())
    elif sort == SortOption.viewed:
        query = query.order_by(DBPhoto.views.desc())

    photos = session.exec(query.offset(offset).limit(limit)).all()

    now = datetime.utcnow()
    for photo in photos:
        if photo.url_expires_at <= (now + timedelta(minutes=5)):
            photo.original_url = generate_presigned_view_url(f"orig/{photo.key}")
            photo.resized_url = generate_presigned_view_url(f"resized/{photo.key}")
            photo.thumb_url = generate_presigned_view_url(f"thumb/{photo.key}")
            photo.url_expires_at = now + timedelta(hours=1)
            session.add(photo)
            session.commit()
            session.refresh(photo)

    return photos


@router.get("/photos/{photo_id}", response_model=PublicPhoto, operation_id="fetchPhoto")
def get_photo(session: SessionDep, photo_id: int):
    photo = session.get(DBPhoto, photo_id)

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    now = datetime.utcnow()
    if photo.url_expires_at <= (now + timedelta(minutes=5)):
        photo.original_url = generate_presigned_view_url(f"orig/{photo.key}")
        photo.resized_url = generate_presigned_view_url(f"resized/{photo.key}")
        photo.thumb_url = generate_presigned_view_url(f"thumb/{photo.key}")
        photo.url_expires_at = now + timedelta(hours=1)
        session.add(photo)
        session.commit()
        session.refresh(photo)

    return photo


@router.post("/photos/{photo_id}/tags/{tag_id}", response_model=PublicPhoto, operation_id="tagPhoto")
def add_tag_to_photo(
    session: SessionDep, photo_id: int, tag_id: int,
):
    photo = session.get(DBPhoto, photo_id)
    tag = session.execute(select(DBTag).where(DBTag.name == str(tag_id))).first()



    if not photo:
        raise HTTPException(status_code=404, detail="Photo or tag not found")

    if tag is None:
        tag = DBTag(
            name=str(tag_id)
        )

        session.add(tag)
        session.commit()
        session.refresh(tag)

    if tag not in photo.tags:
        photo.tags.append(tag)
        session.add(photo)
        session.commit()
        session.refresh(photo)

    return photo


@router.post("/photos/{photo_id}/tags", response_model=PublicPhoto, operation_id="setAllTags")
def set_tags(
    photo_id: int, tag_ids: list[int], session: SessionDep
):
    photo = session.get(DBPhoto, photo_id)
    tags = [session.get(DBTag, id) for id in tag_ids]

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    photo.tags = tags
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return photo



@router.post("/photos/{photo_id}/flag", operation_id="flagPhoto")
def flag_image(photo_id: int, session: SessionDep):
    photo = session.exec(select(DBPhoto).where(DBPhoto.id == photo_id)).first()

    if not photo:
        raise HTTPException(status_code=404, details="Photo not found")

    photo.flagged = True
    session.add(photo)
    session.commit()
    session.refresh(photo)

    print(photo)

    return {"status": "ok"}


@router.post("/views/{photo_id}", response_model=PublicPhoto, operation_id="viewPhoto")
def view_photo(photo_id: int, session: SessionDep):
    photo = session.exec(select(DBPhoto).where(DBPhoto.id == photo_id)).first()

    if not photo:
        raise HTTPException(status_code=404, details="Photo not found")

    photo.views += 1
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return photo


@router.post("/likes/{photo_id}", response_model=PublicPhoto, operation_id="likePhoto")
def like_photo(photo_id: int, session: SessionDep):
    photo = session.exec(select(DBPhoto).where(DBPhoto.id == photo_id)).first()

    if not photo:
        raise HTTPException(status_code=404, details="Photo not found")

    photo.likes += 1
    session.add(photo)
    session.commit()
    session.refresh(photo)

    return photo


@router.get("/tags", response_model=list[PublicTag], operation_id="listTags")
def view_tags(session: SessionDep):
    tags = session.exec(select(DBTag)).all()

    return tags


@router.get("/tags/{tag_id}", response_model=PublicTag, operation_id="fetchTag")
def view_tag(tag_id: int, session: SessionDep):
    tag = session.exec(select(DBTag).where(DBTag.id == tag_id)).first()

    if not tag:
        raise HTTPException(status_code=404, details="Tag not found")

    return tag


@router.post("/tags", response_model=PublicTag, operation_id="createTag")
def create_tag(tag: CreateTag, session: SessionDep):
    db_tag = DBTag.model_validate(tag)

    session.add(db_tag)
    session.commit()
    session.refresh(db_tag)

    return db_tag


@router.patch("/tags/{tag_id}", response_model=PublicTag, operation_id="modifyTag")
def update_tag(tag_id: int, tag: CreateTag, session: SessionDep):
    db_tag = session.exec(select(DBTag).where(DBTag.id == tag_id)).first()

    if not db_tag:
        raise HTTPException(status_code=404, details="Tag not found")

    data = tag.model_dump(exclude_unset=True)
    db_tag.sqlmodel_update(data)

    session.add(db_tag)
    session.commit()
    session.refresh(tag)

    return db_tag
