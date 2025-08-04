from pydantic import BaseModel, Field


class DeleteResponse(BaseModel):
    ok: bool = Field(
        ..., description="True if delete operation succeeded", example=True
    )
