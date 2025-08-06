from fastapi import APIRouter, HTTPException
from sqlmodel import select

from pywebpush import webpush, WebPushException

from app.core.config import settings

from app.schemas.base import VapidKeyResponse, NotificationStatus

from app.deps import SessionDep

import json

from app.models.push import (
    DBPushSubscription,
    CreatePushSubscription,
)

router = APIRouter(prefix="/push", tags=["push"])


@router.get(
    "/public-key",
    response_model=VapidKeyResponse,
    operation_id="getVapidPublicKey",
    summary="Get VAPID public key",
    description="Return the VAPID public key for notifications",
    responses={200: {"description": "VAPID key fetched succesfully"}},
)
def get_vapid_public_key():
    return VapidKeyResponse(publicKey=settings.VAPID_PUBLIC_KEY)


@router.post(
    "/subscribe",
    response_model=NotificationStatus,
    operation_id="subscribeNotifications",
    summary="Subscribe to notifications",
    description="Subscribe to receive notifications",
    responses={200: {"description": "Subscribed succesfully"}},
)
def subscribe(sub: CreatePushSubscription, session: SessionDep):
    existing = session.exec(
        select(DBPushSubscription).where(DBPushSubscription.endpoint == sub.endpoint)
    ).first()

    if not existing:
        db_sub = DBPushSubscription.model_validate(sub)
        session.add(db_sub)
        session.commit()
        session.refresh(db_sub)

    return NotificationStatus(status="subscribed")


@router.post(
    "/send",
    response_model=NotificationStatus,
    operation_id="sendNotification",
    summary="Send a notification",
    description="Send a notification to all clients",
    responses={200: {"description": "Notification sent succesfully"}},
)
def send_push(session: SessionDep):
    payload = json.dumps(
        {
            "title": "Hello from Fuksiseikkailu!",
            "options": {
                "body": "You've got a new notification!",
                "icon": "/pwa-192x192.png",
            },
        }
    )

    subs = session.exec(select(DBPushSubscription)).all()
    errors = []

    for sub in subs:
        try:
            webpush(
                subscription_info={"endpoint": sub.endpoint, "keys": sub.keys},
                data=payload,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_SUBJECT},
            )
        except WebPushException as e:
            errors.append({"endpoint": sub.endpoint, "error": str(e)})

    if errors:
        raise HTTPException(status_code=500, detail=errors)

    return NotificationStatus(status="notifications sent")
