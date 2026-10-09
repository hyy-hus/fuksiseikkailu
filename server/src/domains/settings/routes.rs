use super::{
    db,
    models::{EventSettings, UpdateSettingPayload},
};
use crate::{
    domains::auth::{AuthState, extractor::RequireAdmin},
    errors::AppError,
};
use axum::{Json, extract::State, http::StatusCode};

#[utoipa::path(
    get,
    path = "/settings",
    tag = "Settings",
    responses(
        (status = 200, description = "Get current event configuration settings", body = EventSettings)
    )
)]
pub async fn get_settings(State(state): State<AuthState>) -> Result<Json<EventSettings>, AppError> {
    let scores_enabled = db::get_setting(&state.pool, "scores_enabled").await?;
    let leaderboard_public = db::get_setting(&state.pool, "leaderboard_public").await?;

    Ok(Json(EventSettings {
        scores_enabled,
        leaderboard_public,
    }))
}

#[utoipa::path(
    patch,
    path = "/settings/scores",
    tag = "Settings",
    request_body = UpdateSettingPayload,
    responses(
        (status = 204, description = "Toggled score submissions")
    )
)]
pub async fn toggle_scores(
    _admin: RequireAdmin,
    State(state): State<AuthState>,
    Json(payload): Json<UpdateSettingPayload>,
) -> Result<StatusCode, AppError> {
    db::set_setting(&state.pool, "scores_enabled", payload.enabled).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    patch,
    path = "/settings/leaderboard",
    tag = "Settings",
    request_body = UpdateSettingPayload,
    responses(
        (status = 204, description = "Toggled public leaderboard visibility")
    )
)]
pub async fn toggle_leaderboard(
    _admin: RequireAdmin,
    State(state): State<AuthState>,
    Json(payload): Json<UpdateSettingPayload>,
) -> Result<StatusCode, AppError> {
    db::set_setting(&state.pool, "leaderboard_public", payload.enabled).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[utoipa::path(
    post,
    path = "/settings/scores/reset",
    tag = "Settings",
    responses(
        (status = 204, description = "Reset all recorded scores")
    )
)]
pub async fn reset_scores(
    _admin: RequireAdmin,
    State(state): State<AuthState>,
) -> Result<StatusCode, AppError> {
    db::reset_all_scores(&state.pool).await?;
    Ok(StatusCode::NO_CONTENT)
}
