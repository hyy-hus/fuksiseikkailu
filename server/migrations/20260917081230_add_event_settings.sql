-- Add migration script here

CREATE TABLE IF NOT EXISTS event_settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initialize defaults
INSERT INTO event_settings (key, value) VALUES
    ('scores_enabled', 'true'::jsonb),
    ('leaderboard_public', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;
