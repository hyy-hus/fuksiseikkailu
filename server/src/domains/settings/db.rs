use crate::errors::AppError;
use sqlx::PgPool;

pub async fn get_setting(pool: &PgPool, key: &str) -> Result<bool, AppError> {
    let result = sqlx::query!(r#"SELECT value FROM event_settings WHERE key = $1"#, key)
        .fetch_optional(pool)
        .await?;

    Ok(result
        .and_then(|r| serde_json::from_value(r.value).ok())
        .unwrap_or(false))
}

pub async fn set_setting(pool: &PgPool, key: &str, value: bool) -> Result<(), AppError> {
    sqlx::query!(
        r#"
        INSERT INTO event_settings (key, value, updated_at)
        VALUES ($1, to_jsonb($2::boolean), NOW())
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
        "#,
        key,
        value
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn reset_all_scores(pool: &PgPool) -> Result<(), AppError> {
    sqlx::query!("TRUNCATE TABLE scores RESTART IDENTITY CASCADE;")
        .execute(pool)
        .await?;
    Ok(())
}
