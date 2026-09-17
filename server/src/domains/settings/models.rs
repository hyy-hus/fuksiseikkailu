use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct EventSettings {
    pub scores_enabled: bool,
    pub leaderboard_public: bool,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateSettingPayload {
    pub enabled: bool,
}
