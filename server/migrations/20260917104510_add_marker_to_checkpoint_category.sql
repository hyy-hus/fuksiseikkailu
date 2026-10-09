-- Add migration script here

ALTER TYPE checkpoint_category ADD VALUE IF NOT EXISTS 'marker';
