use sqlx::PgPool;
use tracing::instrument;
use uuid::Uuid;

use super::models::{CreatePhotoPayload, Photo, PhotoTeamSuggestion, UpdatePhotoPayload};
use crate::errors::AppError;

/// Formats public S3 URL from key (adjust CDN prefix as necessary)
pub fn build_s3_url(s3_key: &str, public_base_url: &str) -> String {
    let base = public_base_url.trim_end_matches('/');
    let key = s3_key.trim_start_matches('/');
    format!("{base}/{key}")
}

#[instrument(skip(pool))]
pub async fn list_published_photos(pool: &PgPool) -> Result<Vec<Photo>, AppError> {
    let photos = sqlx::query_as!(
        Photo,
        r#"
        SELECT 
            p.id, p.s3_key, p.url, p.team_id, p.checkpoint_id, p.published, 
            COUNT(v.id)::BIGINT as "vote_count",
            p.created_at, p.updated_at
        FROM photos p
        LEFT JOIN votes v ON v.photo_id = p.id
        WHERE p.published = true AND p.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY p.created_at DESC
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(photos)
}

#[instrument(skip(pool))]
pub async fn list_all_photos(pool: &PgPool) -> Result<Vec<Photo>, AppError> {
    let photos = sqlx::query_as!(
        Photo,
        r#"
        SELECT 
            p.id, p.s3_key, p.url, p.team_id, p.checkpoint_id, p.published, 
            COUNT(v.id)::BIGINT as "vote_count",
            p.created_at, p.updated_at
        FROM photos p
        LEFT JOIN votes v ON v.photo_id = p.id
        WHERE p.deleted_at IS NULL
        GROUP BY p.id
        ORDER BY p.created_at DESC
        "#
    )
    .fetch_all(pool)
    .await?;

    Ok(photos)
}

#[instrument(skip(pool), fields(photo_id = %id))]
pub async fn get_photo(pool: &PgPool, id: Uuid) -> Result<Photo, AppError> {
    let photo = sqlx::query_as!(
        Photo,
        r#"
        SELECT 
            p.id, p.s3_key, p.url, p.team_id, p.checkpoint_id, p.published, 
            COUNT(v.id)::BIGINT as "vote_count",
            p.created_at, p.updated_at
        FROM photos p
        LEFT JOIN votes v ON v.photo_id = p.id
        WHERE p.id = $1 AND p.deleted_at IS NULL
        GROUP BY p.id
        "#,
        id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(photo)
}

#[instrument(skip(pool, payload))]
pub async fn create_photo(
    pool: &PgPool,
    payload: &CreatePhotoPayload,
    public_base_url: &str,
) -> Result<Photo, AppError> {
    let url = build_s3_url(&payload.s3_key, public_base_url);
    let published = payload.published.unwrap_or(false);

    let photo = sqlx::query_as!(
        Photo,
        r#"
        INSERT INTO photos (s3_key, url, team_id, checkpoint_id, published)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING 
            id, s3_key, url, team_id, checkpoint_id, published, 
            0::BIGINT as "vote_count",
            created_at, updated_at
        "#,
        payload.s3_key,
        url,
        payload.team_id,
        payload.checkpoint_id,
        published
    )
    .fetch_one(pool)
    .await?;

    Ok(photo)
}

#[instrument(skip(pool, payload), fields(photo_id = %id))]
pub async fn update_photo(
    pool: &PgPool,
    id: Uuid,
    payload: &UpdatePhotoPayload,
) -> Result<Photo, AppError> {
    let photo = sqlx::query_as!(
        Photo,
        r#"
        UPDATE photos
        SET 
            team_id = COALESCE($1, team_id),
            checkpoint_id = COALESCE($2, checkpoint_id),
            published = COALESCE($3, published),
            updated_at = NOW()
        WHERE id = $4 AND deleted_at IS NULL
        RETURNING 
            id, s3_key, url, team_id, checkpoint_id, published, 
            0::BIGINT as "vote_count",
            created_at, updated_at
        "#,
        payload.team_id,
        payload.checkpoint_id,
        payload.published,
        id
    )
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(photo)
}

#[instrument(skip(pool), fields(photo_id = %id))]
pub async fn delete_photo(pool: &PgPool, id: Uuid) -> Result<(), AppError> {
    let result = sqlx::query!(
        r#"
        UPDATE photos
        SET deleted_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        "#,
        id
    )
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(())
}

#[instrument(skip(pool, voter_hash), fields(photo_id = %photo_id))]
pub async fn cast_vote(pool: &PgPool, photo_id: Uuid, voter_hash: &str) -> Result<(), AppError> {
    sqlx::query!(
        r#"
        INSERT INTO votes (photo_id, voter_hash)
        VALUES ($1, $2)
        "#,
        photo_id,
        voter_hash
    )
    .execute(pool)
    .await?;

    Ok(())
}

#[instrument(skip(pool, voter_hash), fields(photo_id = %photo_id, team_number = team_number))]
pub async fn submit_suggestion(
    pool: &PgPool,
    photo_id: Uuid,
    team_number: i32,
    voter_hash: Option<&str>,
) -> Result<PhotoTeamSuggestion, AppError> {
    let suggestion = sqlx::query_as!(
        PhotoTeamSuggestion,
        r#"
        INSERT INTO photo_team_suggestions (photo_id, suggested_team_number, voter_hash)
        VALUES ($1, $2, $3)
        RETURNING id, photo_id, suggested_team_number, voter_hash, created_at
        "#,
        photo_id,
        team_number,
        voter_hash
    )
    .fetch_one(pool)
    .await?;

    Ok(suggestion)
}

#[instrument(skip(pool), fields(photo_id = %photo_id))]
pub async fn list_suggestions(
    pool: &PgPool,
    photo_id: Uuid,
) -> Result<Vec<PhotoTeamSuggestion>, AppError> {
    let suggestions = sqlx::query_as!(
        PhotoTeamSuggestion,
        r#"
        SELECT id, photo_id, suggested_team_number, voter_hash, created_at
        FROM photo_team_suggestions
        WHERE photo_id = $1
        ORDER BY created_at DESC
        "#,
        photo_id
    )
    .fetch_all(pool)
    .await?;

    Ok(suggestions)
}
