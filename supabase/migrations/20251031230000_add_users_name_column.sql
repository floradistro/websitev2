-- Migration: Add missing 'name' column to users table
-- This fixes the authentication error: "Could not find the 'name' column of 'users'"
-- Date: 2025-10-31

-- Add name column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing rows to populate name from email if null
UPDATE users
SET name = COALESCE(name, split_part(email, '@', 1))
WHERE name IS NULL OR name = '';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- Add comment for documentation
COMMENT ON COLUMN users.name IS 'User display name - used for vendor admin and employee names';
