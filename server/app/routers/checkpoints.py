from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlmodel import select

from sqlalchemy import cast, Float

from pydantic import BaseModel, Field, ValidationError

from app.schemas.base import DeleteResponse
from app.deps import SessionDep, UserDep

from app.models.checkpoints import (
    DBCheckpoint,
    PublicCheckpoint,
    AdminCheckpoint,
    ModifyCheckpoint,
    CreateCheckpoint,
)

from math import radians
import numpy as np
from sklearn.cluster import DBSCAN

EARTH_RADIUS_M = 6_371_000

AdventureId = Annotated[
    int, Path(..., description="ID of the adventure")
]  # to-do: Move this to a common place
CheckpointId = Annotated[int, Path(..., description="ID of the checkpoint")]


def get_checkpoint(
    adventure_id: AdventureId,
    checkpoint_id: CheckpointId,
    session: SessionDep,
) -> DBCheckpoint:
    query = select(DBCheckpoint).where(
        DBCheckpoint.adventure_id == adventure_id,
        DBCheckpoint.id == checkpoint_id,
        DBCheckpoint.active,
    )

    db_checkpoint = session.exec(query).one_or_none()

    if not db_checkpoint:
        raise HTTPException(
            status_code=404,
            detail=f"Checkpoint with id '{checkpoint_id}' not found in adventure '{adventure_id}'",
        )

    return db_checkpoint


CheckpointDep = Annotated[DBCheckpoint, Depends(get_checkpoint)]


router = APIRouter(
    prefix="/adventures/{adventure_id}/checkpoints", tags=["checkpoints"]
)


@router.get(
    "/",
    response_model=list[PublicCheckpoint],
    operation_id="listCheckpoints",
    summary="List all checkpoints in an adventure",
    description="Returns all active checkpoints for the specified adventure.",
    responses={200: {"description": "Teams fetched succesfully"}},
)
def list_checkpoints(
    adventure_id: AdventureId,
    session: SessionDep,
):
    query = select(DBCheckpoint).where(
        DBCheckpoint.adventure_id == adventure_id, DBCheckpoint.active
    )
    return session.exec(query).all()


@router.get(
    "/{checkpoint_id}",
    response_model=PublicCheckpoint,
    operation_id="fetchCheckpoint",
    summary="Fetch a checkpoint in an adventure",
    description="Returns publicly available information about the checkpoint specified by *checkpoint_id*",
    responses={
        200: {"description": "Checkpoint fetched succesfully"},
        404: {"description": "Checkpoint could not be found"},
    },
)
def fetch_checkpoint(db_checkpoint: CheckpointDep) -> PublicCheckpoint:
    return db_checkpoint


@router.post(
    "/",
    response_model=PublicCheckpoint,
    operation_id="createCheckpoint",
    summary="Create a checkpoint",
    description="Creates a new checkpoint specified by *request body*",
    status_code=201,
    responses={
        201: {"description": "Checkpoint created"},
    },
)
def create_checkpoint(
    checkpoint: CreateCheckpoint,
    adventure_id: AdventureId,
    session: SessionDep,
    user: UserDep,
) -> PublicCheckpoint:
    db_checkpoint = DBCheckpoint.model_validate(checkpoint)
    db_checkpoint.adventure_id = adventure_id

    session.add(db_checkpoint)
    session.commit()
    session.refresh(db_checkpoint)

    return db_checkpoint


@router.patch(
    "/{checkpoint_id}",
    response_model=PublicCheckpoint,
    operation_id="patchCheckpoint",
    summary="Update a checkpoint",
    description="Update checkpoint specified by *team_id* and *adventure_id*",
    status_code=200,
    responses={
        200: {"description": "Checkpoint updated succesfully"},
        404: {"description": "Checkpoint could not be found"},
    },
)
def update_checkpoint(
    checkpoint: ModifyCheckpoint,
    db_checkpoint: CheckpointDep,
    user: UserDep,
    session: SessionDep,
) -> PublicCheckpoint:
    checkpoint_data = checkpoint.model_dump(exclude_unset=True)
    db_checkpoint.sqlmodel_update(checkpoint_data)

    session.add(db_checkpoint)
    session.commit()
    session.refresh(db_checkpoint)

    return db_checkpoint


@router.delete(
    "/{checkpoint_id}",
    response_model=DeleteResponse,
    operation_id="deleteCheckpoint",
    summary="Delete a checkpoint",
    description="Delete checkpoint specified by *checkpoint_id* and *adventure_id*",
    responses={
        200: {"description": "Checkpoint deleted succesfully"},
        404: {"description": "Checkpoint could not be found"},
    },
)
def delete_checkpoint(
    db_checkpoint: CheckpointDep,
    user: UserDep,
    session: SessionDep,
) -> DeleteResponse:
    db_checkpoint.active = False
    session.add(db_checkpoint)
    session.commit()

    return DeleteResponse(ok=True)


admin_router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


@admin_router.get(
    "/",
    response_model=list[AdminCheckpoint],
    operation_id="listAdminCheckpoints",
    summary="List all checkpoints in an adventure",
    description="Returns admin level info of all active teams for the specified adventure.",
    responses={
        200: {"description": "Checkpoints fetched succesfully"},
    },
)
def list_admin_checkpoints(
    adventure_id: AdventureId,
    user: UserDep,
    session: SessionDep,
) -> list[AdminCheckpoint]:
    query = select(DBCheckpoint).where(DBCheckpoint.adventure_id == adventure_id)
    return session.exec(query).all()


@admin_router.get(
    "/{checkpoint_id}",
    response_model=AdminCheckpoint,
    operation_id="fetchAdminCheckpoint",
    summary="Fetch a single checkpoint in an adventure",
    description="Fetches a checkpoint in an adventure specified by it's id",
    responses={
        200: {"description": "Checkpoint fetched succesfully"},
        404: {"description": "Checkpoint could not be found"},
    },
)
def fetch_admin_checkpoint(
    db_checkpoint: CheckpointDep, user: UserDep
) -> AdminCheckpoint:
    return db_checkpoint


class ImportPayload(BaseModel):
    identifiers: list[str] = Field(
        ..., description="List of field names used to match existing records"
    )
    data: list[dict[str, str]] = Field(
        ..., description="Rows of checkpoint data keyed by output column name"
    )


class ImportErrorDetail(BaseModel):
    type: str = Field(
        ...,
        description="Type of error: lookup_error, update_error, validation_error, etc.",
    )
    error: str | list[dict[str, Any]] = Field(
        ..., description="Error message or list of validation errors"
    )
    row: dict[str, str] = Field(..., description="The row that caused the error")


class ImportResult(BaseModel):
    message: str = Field(..., example="Import completed")
    updated: int = Field(..., ge=0, description="Number of records updated")
    created: int = Field(..., ge=0, description="Number of records created")
    errors: list[ImportErrorDetail] = Field(default_factory=list)
    status: int = Field(..., description="HTTP status code (e.g. 200, 207)")


def parse_bool(val: str) -> bool:
    return val.strip().lower() in {"true", "1", "yes", "t", "kyllä"}


def parse_int(val: str) -> int:
    try:
        return int(val.strip())
    except Exception:
        return 0


def normalize_row(raw_row: dict) -> dict:
    return {
        "org_name": raw_row.get("org_name", "").strip(),
        "org_abbreviation": raw_row.get("org_abbreviation", "").strip(),
        "contact_person": raw_row.get("contact_person", "").strip(),
        "contact_email": raw_row.get("contact_email", "").strip(),
        "contact_phone": raw_row.get("contact_phone", "").strip(),
        "category": raw_row.get("category", "").strip(),
        "latitude": raw_row.get("latitude", "60.1699").strip(),
        "longitude": raw_row.get("longitude", "24.9384").strip(),
        "address": raw_row.get("address", "").strip(),
        "requirements": raw_row.get("requirements", "").strip(),
        "lanes": int(raw_row.get("lanes", 1))
        if raw_row.get("lanes", "").strip().isdigit()
        else 1,
        "checkpoint_description": raw_row.get("checkpoint_description", "").strip(),
        "org_description": raw_row.get("org_description", "").strip(),
        "org_link": raw_row.get("org_link", "").strip(),
        "photo_permission": parse_bool(raw_row.get("photo_permission", "true")),
        "accessible": parse_bool(raw_row.get("accessible", "false")),
    }


class AllocateAreasResult(BaseModel):
    updated: int = Field(..., description="Amount of updated checkpoints")
    clusters: int = Field(..., description="How many clusters we ended up with")
    noise: int = Field(..., description="Amount of individual checkpoints")
    total_areas: int = Field(..., description="Amount of areas in total")


class AllocateResult(BaseModel):
    status: str = Field(..., example="Allocation succesfull")
    updated: int = Field(..., description="Amount of updated checkpoints")


@admin_router.post(
    "/allocate_areas",
    response_model=AllocateAreasResult,
    operation_id="allocateCheckpointAreas",
    summary="Allocate areas for checkpoints",
    description="Allocates areas for all the checkpoints in the adventure",
    responses={200: {"description": "Succesfully allocated areas"}},
)
def allocate_areas(
    adventure_id: int,
    user: UserDep,
    session: SessionDep,
    eps_meters: int = 200,
    min_samples: int = 3,
) -> AllocateAreasResult:
    cps = session.exec(
        select(DBCheckpoint).where(DBCheckpoint.adventure_id == adventure_id)
    ).all()

    if not cps:
        return AllocateAreasResult(updated=0, clusters=0, noise=0, total_areas=0)

    # Collect coords (skip rows with missing/invalid coords)
    lats, lons, valid_idx = [], [], []
    for idx, cp in enumerate(cps):
        try:
            lat = float(cp.latitude)
            lon = float(cp.longitude)
        except (TypeError, ValueError):
            # no valid coords -> give singleton area later if you prefer, or skip
            continue
        lats.append(lat)
        lons.append(lon)
        valid_idx.append(idx)

    if not valid_idx:
        # No valid coordinates
        return AllocateAreasResult(updated=0, clusters=0, noise=len(cps), total_areas=0)

    coords_rad = np.radians(np.c_[lats, lons])
    eps_rad = eps_meters / EARTH_RADIUS_M

    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine")
    labels = db.fit_predict(coords_rad)  # -1 = noise

    # Map cluster labels to compact 1..K
    unique_clusters = sorted({lbl for lbl in labels if lbl != -1})
    cluster_map = {lbl: i + 1 for i, lbl in enumerate(unique_clusters)}
    k = len(unique_clusters)

    # Stable order for noise (NW -> SE)
    noise_idxs = [i for i, lbl in enumerate(labels) if lbl == -1]
    noise_sorted = sorted(noise_idxs, key=lambda idx: (-lats[idx], lons[idx]))
    noise_rank = {idx: r for r, idx in enumerate(noise_sorted)}

    updated = 0
    # Assign areas back to original cps order using valid_idx mapping
    for arr_pos, lbl in enumerate(labels):
        cp = cps[valid_idx[arr_pos]]
        if lbl == -1:
            cp.area = k + 1 + noise_rank[arr_pos]  # singleton area for each noise point
        else:
            cp.area = cluster_map[lbl]
        session.add(cp)
        updated += 1

    session.commit()

    return AllocateAreasResult(
        updated=updated,
        clusters=k,
        noise=len(noise_idxs),
        total_areas=k + len(noise_idxs),
    )


@admin_router.post(
    "/allocate_numbers",
    response_model=AllocateResult,
    operation_id="allocateCheckpointNumbers",
    summary="Allocate numbers for checkpoints",
    description="Allocates numbers for all the checkpoints in the adventure",
    responses={200: {"description": "Succesfully allocated numbers"}},
)
def allocate_numbers(
    adventure_id: AdventureId,
    user: UserDep,
    session: SessionDep,
):
    checkpoints = session.exec(
        select(DBCheckpoint).order_by(
            cast(DBCheckpoint.latitude, Float).desc(),
            cast(DBCheckpoint.longitude, Float).asc(),
        )
    ).all()

    for idx, checkpoint in enumerate(checkpoints, start=1):
        checkpoint.number = idx
        session.add(checkpoint)

    session.commit()

    return AllocateResult(status="Allocation succesfull", updated=len(checkpoints))


@admin_router.post(
    "/import",
    response_model=ImportResult,
    operation_id="importAdminCheckpoint",
    summary="Update / Add many checkpoints at once",
    description="Adds or updates checkpoints by bulk",
    responses={
        200: {"description": "All imported succesfully"},
        207: {"description": "At least some failed to import"},
    },
)
def import_checkpoints(
    adventure_id: AdventureId,
    user: UserDep,
    payload: ImportPayload,
    session: SessionDep,
):
    identifiers = payload.identifiers
    rows = payload.data

    created_count = 0
    updated_count = 0
    errors = []

    for row in rows:
        # To-do: this sanitization could be nicer?
        row["number"] = parse_int(row.get("number", "0"))
        row["photo_permission"] = parse_bool(row.get("photo_permission", "true"))
        row["accessible"] = parse_bool(row.get("accessible", "false"))
        row["lanes"] = parse_int(row.get("lanes", "0"))

        try:
            query = select(DBCheckpoint)
            for col in identifiers:
                if col not in DBCheckpoint.__fields__:
                    errors.append(
                        {"error": f"Unknown identifier field: {col}", "row": row}
                    )
                    continue

                query = query.where(getattr(DBCheckpoint, col) == row[col])

            db_checkpoint = session.exec(query).one_or_none()

        except Exception as e:
            errors.append(
                {
                    "type": "lookup_error",
                    "error": f"Failed lookup: {str(e)}",
                    "row": row,
                }
            )
            continue

        if not db_checkpoint:
            try:
                checkpoint = CreateCheckpoint(**row).model_dump(exclude_unset=False)
                db_checkpoint = DBCheckpoint.model_validate(checkpoint)
                db_checkpoint.adventure_id = adventure_id

                session.add(db_checkpoint)
                updated_count += 1

            except ValidationError as e:
                missing_fields = [
                    ".".join(map(str, err["loc"]))
                    for err in e.errors()
                    if err["type"] == "missing"
                ]

                if missing_fields:
                    errors.append(
                        {
                            "type": "validation_error",
                            "error": f"Missing required fields: {missing_fields}",
                            "row": row,
                        }
                    )
                else:
                    errors.append(
                        {
                            "type": "unexpected_validation_error",
                            "error": str(e),
                            "row": row,
                        }
                    )

            except Exception as e:
                errors.append(
                    {
                        "type": "unexpected_error",
                        "error": f"Failed to create checkpoint: {str(e)}",
                        "row": row,
                    }
                )
                continue
        else:
            try:
                update_data = ModifyCheckpoint(**row).model_dump(exclude_unset=True)
                db_checkpoint.sqlmodel_update(update_data)

                session.add(db_checkpoint)
                created_count += 1

            except Exception as e:
                errors.append(
                    {
                        "type": "update_error",
                        "error": f"Failed to update: {str(e)}",
                        "row": row,
                    }
                )
                continue

    session.commit()

    if errors:
        raise HTTPException(status_code=400, detail=errors)

    return {
        "message": "Import complete",
        "updated": updated_count,
        "created": created_count,
        "errors": errors,
        "status": status.HTTP_207_MULTI_STATUS if errors else status.HTTP_200_OK,
    }


router.include_router(admin_router)
