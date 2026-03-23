-- Migration: Optimize Database Schema & Edge Cases
-- Date: 2026-02-18

-- 1. Enable fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add fast search indexes
CREATE INDEX IF NOT EXISTS idx_users_username_gin 
ON public.users USING gin (username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_name_gin 
ON public.users USING gin (name gin_trgm_ops);

-- 3. Enforce Data Integrity (Idempotent checks)

DO $$ 
BEGIN 
    -- Email Unique Constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;

    -- Username Unique Constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;

    -- Points Check Constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_points_check') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_points_check CHECK (points >= 0);
    END IF;

    -- Streak Check Constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_streak_check') THEN
        ALTER TABLE public.users ADD CONSTRAINT users_streak_check CHECK (streak >= 0);
    END IF;
END $$;

-- Defaults (Safe to re-run)
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'student';
ALTER TABLE public.users ALTER COLUMN approval_status SET DEFAULT 'pending';
