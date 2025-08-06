from fastapi import Depends
from typing import Annotated
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.config import settings

import json
from pywebpush import webpush, WebPushException

from app.models.push import DBPushSubscription

SessionDep = Annotated[Session, Depends(get_session)]


def send_push_notification_to_all(session: Session, title: str, body: str):
    payload = json.dumps(
        {
            "title": title,
            "options": {
                "body": body,
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
        raise Exception(errors)
