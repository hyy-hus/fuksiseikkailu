use axum::{Json, extract::State, http::StatusCode};
use resend_rs::{Resend, types::CreateEmailBaseOptions};
use uuid::Uuid;
use validator::Validate;

use super::{
    db, jwt,
    models::{AuthTokens, RegisterPayload, RequestOtpPayload, VerifyOtpPayload},
};
use crate::{config::Config, domains::users::models::Role, errors::AppError};

#[derive(Clone)]
pub struct AuthState {
    pub pool: sqlx::PgPool,
    pub config: Config,
    pub resend: Resend,
}

#[utoipa::path(
    post,
    path = "/auth/register",
    tag = "Auth",
    request_body = RegisterPayload,
    responses(
        (status = 201, description = "User registered successfully", body = AuthTokens),
        (status = 409, description = "Email already registered"),
        (status = 422, description = "Validation error")
    )
)]
pub async fn register(
    State(state): State<AuthState>,
    Json(payload): Json<RegisterPayload>,
) -> Result<(StatusCode, Json<AuthTokens>), AppError> {
    payload.validate()?;

    let user = db::create_user(&state.pool, &payload).await?;
    let tokens =
        issue_token_pair(&state, user.id, user.role, user.checkpoint_id, user.team_id).await?;

    Ok((StatusCode::CREATED, Json(tokens)))
}

#[utoipa::path(
    post,
    path = "/auth/otp/request",
    tag = "Auth",
    request_body = RequestOtpPayload,
    responses(
        (status = 200, description = "OTP code requested successfully")
    )
)]
pub async fn request_otp(
    State(state): State<AuthState>,
    Json(payload): Json<RequestOtpPayload>,
) -> Result<StatusCode, AppError> {
    payload.validate()?;

    if let Some(ref email) = payload.email {
        if let Some(code) = db::create_and_store_otp(&state.pool, email).await? {
            tracing::info!("[DEV OTP] Code generated for {}: {}", email, code);

            // Construct email with resend-rs
            let body_html = format!(
                "<h2>Your Fuksiseikkailu Login Code</h2>\
                 <p>Use the following code to complete your login:</p>\
                 <h1 style=\"letter-spacing: 4px; font-size: 32px; color: #2563eb;\">{}</h1>\
                 <p>This code will expire in 10 minutes.</p>",
                code
            );

            let email_options = CreateEmailBaseOptions::new(
                &state.config.from_email,
                [email.as_str()],
                "Your Fuksiseikkailu Verification Code",
            )
            .with_html(&body_html);

            // Send via Resend client
            match state.resend.emails.send(email_options).await {
                Ok(response) => {
                    tracing::info!("✓ Sent OTP email to {} (ID: {})", email, response.id);
                }
                Err(err) => {
                    tracing::error!("Failed to dispatch OTP email to {}: {:?}", email, err);
                    // Decide whether to fail the request or return 200 silently to prevent user enumeration
                }
            }
        } else {
            // Prevent user enumeration: log silently on server if email doesn't exist
            tracing::warn!("OTP requested for non-existent email: {}", email);
        }
    }

    Ok(StatusCode::OK)
}

#[utoipa::path(
    post,
    path = "/auth/otp/verify",
    tag = "Auth",
    request_body = VerifyOtpPayload,
    responses(
        (status = 200, description = "OTP verified, returns tokens", body = AuthTokens),
        (status = 401, description = "Invalid or expired OTP code")
    )
)]
pub async fn verify_otp(
    State(state): State<AuthState>,
    Json(payload): Json<VerifyOtpPayload>,
) -> Result<Json<AuthTokens>, AppError> {
    payload.validate()?;

    // Verify code hash and consume OTP
    let user = db::verify_and_consume_otp(&state.pool, &payload.email, &payload.code)
        .await?
        .ok_or_else(|| {
            AppError::Unauthorized("Invalid or expired verification code".to_string())
        })?;

    let tokens =
        issue_token_pair(&state, user.id, user.role, user.checkpoint_id, user.team_id).await?;
    Ok(Json(tokens))
}

async fn issue_token_pair(
    state: &AuthState,
    user_id: Uuid,
    role: Role,
    checkpoint_id: Option<Uuid>,
    team_id: Option<Uuid>,
) -> Result<AuthTokens, AppError> {
    let access_token = jwt::encode_jwt(
        user_id,
        role,
        checkpoint_id,
        team_id,
        &state.config.jwt_secret,
        state.config.jwt_expiration_seconds,
    )?;

    Ok(AuthTokens {
        access_token,
        token_type: "Bearer".to_string(),
        expires_in: state.config.jwt_expiration_seconds,
    })
}

#[utoipa::path(
    post,
    path = "/auth/refresh",
    tag = "Auth",
    responses(
        (status = 200, description = "Token refreshed successfully", body = AuthTokens),
        (status = 401, description = "Invalid or expired refresh token")
    )
)]
pub async fn refresh_token(
    State(state): State<AuthState>,
    headers: axum::http::HeaderMap,
) -> Result<Json<AuthTokens>, AppError> {
    // 1. Extract Bearer token from headers
    let auth_header = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Missing authorization header".into()))?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or_else(|| AppError::Unauthorized("Invalid token format".into()))?;

    // 2. Decode and validate claims (allow slight clock skew or grace period for refreshes)
    let claims = jwt::decode_jwt(token, &state.config.jwt_secret)?;

    // 3. Issue fresh token pair
    let tokens = issue_token_pair(
        &state,
        claims.sub,
        claims.role,
        claims.checkpoint_id,
        claims.team_id,
    )
    .await?;

    Ok(Json(tokens))
}
