-- Migration: Create users table
-- Feature: 002-auth-integration
-- Date: 2026-02-07
-- Description: Creates the users table with email authentication support

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on email for fast lookups during login
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add comment to table
COMMENT ON TABLE users IS 'User accounts with email authentication';
COMMENT ON COLUMN users.id IS 'Unique user identifier (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (used for login, must be unique)';
COMMENT ON COLUMN users.hashed_password IS 'Bcrypt-hashed password (never store plain text)';
COMMENT ON COLUMN users.created_at IS 'Timestamp when user account was created (UTC)';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when user account was last modified (UTC)';

-- Rollback instructions:
-- DROP INDEX IF EXISTS idx_users_email;
-- DROP TABLE IF EXISTS users;
