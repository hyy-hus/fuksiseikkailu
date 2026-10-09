pub mod db;
pub mod models;
pub mod routes;

use axum::{
    Router,
    routing::{get, patch, post},
};

use crate::domains::auth::AuthState;

pub fn router(state: AuthState) -> Router {
    Router::new()
        .route("/", get(routes::get_settings))
        .route("/scores", patch(routes::toggle_scores))
        .route("/leaderboard", patch(routes::toggle_leaderboard))
        .route("/scores/reset", post(routes::reset_scores))
        .with_state(state)
}
