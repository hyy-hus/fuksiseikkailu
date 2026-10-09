-- Add migration script here

CREATE UNIQUE INDEX IF NOT EXISTS idx_checkpoints_name_active 
ON checkpoints (name) 
WHERE deleted_at IS NULL;
