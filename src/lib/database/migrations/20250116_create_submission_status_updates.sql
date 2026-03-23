-- Migration: Create Submission Status Updates Table
-- Date: 2025-01-16
-- Purpose: Enable real-time submission feedback via Supabase real-time
-- Requirements: 9.8

-- ============================================================================
-- TABLE: submission_status_updates
-- ============================================================================
-- Stores real-time status updates for code submissions
-- Used for broadcasting submission progress to users via Supabase real-time

CREATE TABLE IF NOT EXISTS submission_status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'executing', 'passed', 'failed', 'error')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  message TEXT,
  test_cases_passed INTEGER,
  total_test_cases INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for querying by user (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_submission_status_user_id 
  ON submission_status_updates(user_id, created_at DESC);

-- Index for querying by submission
CREATE INDEX IF NOT EXISTS idx_submission_status_submission_id 
  ON submission_status_updates(submission_id, created_at DESC);

-- Index for querying by problem
CREATE INDEX IF NOT EXISTS idx_submission_status_problem_id 
  ON submission_status_updates(problem_id, created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE submission_status_updates ENABLE ROW LEVEL SECURITY;

-- Users can view their own submission status updates
CREATE POLICY "Users can view their own submission status"
  ON submission_status_updates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert status updates (for server-side broadcasting)
CREATE POLICY "Service role can insert status updates"
  ON submission_status_updates
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all submission status updates
CREATE POLICY "Admins can view all submission status"
  ON submission_status_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role = 'admin'
    )
  );

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================
-- Automatically delete old status updates (older than 24 hours)
-- to prevent table bloat

CREATE OR REPLACE FUNCTION cleanup_old_submission_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM submission_status_updates
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Schedule cleanup to run daily (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-submission-status', '0 2 * * *', 'SELECT cleanup_old_submission_status()');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON submission_status_updates TO authenticated;

-- Grant all permissions to service role (for server-side operations)
GRANT ALL ON submission_status_updates TO service_role;

-- ============================================================================
-- NOTES
-- ============================================================================

-- This table is designed for real-time broadcasting only
-- Status updates are ephemeral and automatically cleaned up after 24 hours
-- For permanent submission records, use the submissions table
-- Real-time subscriptions should filter by user_id for security

-- To enable real-time on this table in Supabase dashboard:
-- 1. Go to Database > Replication
-- 2. Enable replication for submission_status_updates table
-- 3. Select INSERT events for real-time broadcasting
