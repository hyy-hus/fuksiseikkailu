use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
};
use uuid::Uuid;
use validator::Validate;

use super::{
    db,
    models::{Score, SubmitScorePayload, TeamLeaderboardEntry, UpdateScorePayload},
};
use crate::{
    domains::auth::{AuthState, extractor::RequireAdmin},
    errors::AppError,
};

#[utoipa::path(
    get,
    path = "/scores/leaderboard",
    tag = "Scores",
    responses((status = 200, description = "Get event leaderboard", body = [TeamLeaderboardEntry]))
)]
pub async fn get_leaderboard(
    State(state): State<AuthState>,
) -> Result<Json<Vec<TeamLeaderboardEntry>>, AppError> {
    let leaderboard = db::get_leaderboard(&state.pool).await?;
    Ok(Json(leaderboard))
}

#[utoipa::path(
    post,
    path = "/scores",
    tag = "Scores",
    request_body = SubmitScorePayload,
    responses(
        (status = 200, description = "Score submitted or updated", body = Score)
    )
)]
pub async fn submit_score(
    State(state): State<AuthState>,
    Json(payload): Json<SubmitScorePayload>,
) -> Result<(StatusCode, Json<Score>), AppError> {
    payload.validate()?;

    // Submit or update score without user auth constraints
    let score = db::submit_or_update_score(&state.pool, &payload).await?;
    Ok((StatusCode::OK, Json(score)))
}

#[utoipa::path(
    get,
    path = "/scores/checkpoint/{checkpoint_id}",
    tag = "Scores",
    params(("checkpoint_id" = Uuid, Path, description = "Checkpoint ID")),
    responses((status = 200, description = "List scores for a checkpoint", body = [Score]))
)]
pub async fn list_by_checkpoint(
    State(state): State<AuthState>,
    Path(checkpoint_id): Path<Uuid>,
) -> Result<Json<Vec<Score>>, AppError> {
    let scores = db::list_scores_by_checkpoint(&state.pool, checkpoint_id).await?;
    Ok(Json(scores))
}

#[utoipa::path(
    get,
    path = "/scores/team/{team_id}",
    tag = "Scores",
    params(("team_id" = Uuid, Path, description = "Team ID")),
    responses((status = 200, description = "List scores for a team", body = [Score]))
)]
pub async fn list_by_team(
    State(state): State<AuthState>,
    Path(team_id): Path<Uuid>,
) -> Result<Json<Vec<Score>>, AppError> {
    let scores = db::list_scores_by_team(&state.pool, team_id).await?;
    Ok(Json(scores))
}

#[utoipa::path(
    patch,
    path = "/scores/{id}",
    tag = "Scores",
    params(("id" = Uuid, Path, description = "Score ID")),
    request_body = UpdateScorePayload,
    responses((status = 200, description = "Score updated", body = Score))
)]
pub async fn update_score(
    State(state): State<AuthState>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateScorePayload>,
) -> Result<Json<Score>, AppError> {
    payload.validate()?;
    let score = db::update_score(&state.pool, id, &payload).await?;
    Ok(Json(score))
}
