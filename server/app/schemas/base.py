from pydantic import BaseModel, Field


class DeleteResponse(BaseModel):
    ok: bool = Field(
        ..., description="True if delete operation succeeded", example=True
    )


class VapidKeyResponse(BaseModel):
    publicKey: str = Field(
        ..., description="Public VAPID key", example="a-public-vapid-key"
    )


class NotificationStatus(BaseModel):
    status: str = Field(
        ..., description="Status of the subscription", example="subscribed"
    )
