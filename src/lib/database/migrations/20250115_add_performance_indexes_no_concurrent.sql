-- Migration: Add Performance Indexes (Non-Concurrent Version)
-- Date: 2025-01-15
-- Purpose: Add indexes to improve query performance for frequently accessed columns
-- Requirements: 6.5
-- NOTE: This version does NOT use CONCURRENTLY, so it can run in a transaction
--       but will briefly lock tables during index creation

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Index for filtering users by approval status (used in admin dashboard)
CREATE INDEX IF NOT EXISTS idx_users_approval_status 
ON users(approval_status);

-- Index for filtering users by role (used for role-based queries)
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);

-- Index for leaderboard queries (sorting by points descending)
CREATE INDEX IF NOT EXISTS idx_users_points_desc 
ON users(points DESC);

-- Composite index for approved students leaderboard
CREATE INDEX IF NOT EXISTS idx_users_leaderboard 
ON users(approval_status, role, points DESC) 
WHERE approval_status = 'approved' AND role = 'student';

-- ============================================================================
-- SUBMISSIONS TABLE INDEXES
-- ============================================================================

-- Composite index for user's submissions on a specific problem
CREATE INDEX IF NOT EXISTS idx_submissions_user_problem 
ON submissions(user_id, problem_id);

-- Index for filtering submissions by status
CREATE INDEX IF NOT EXISTS idx_submissions_status 
ON submissions(status);

-- Index for recent submissions (sorting by submitted_at descending)
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at 
ON submissions(submitted_at DESC);

-- Composite index for checking first solve (user + problem + status)
CREATE INDEX IF NOT EXISTS idx_submissions_first_solve 
ON submissions(user_id, problem_id, status) 
WHERE status = 'accepted';

-- Index for contest submissions
CREATE INDEX IF NOT EXISTS idx_submissions_contest 
ON submissions(contest_id) 
WHERE contest_id IS NOT NULL;

-- ============================================================================
-- CONTEST_REGISTRATIONS TABLE INDEXES
-- ============================================================================

-- Index for finding user's contest registrations
CREATE INDEX IF NOT EXISTS idx_contest_registrations_user 
ON contest_registrations(user_id);

-- Index for finding contest participants
CREATE INDEX IF NOT EXISTS idx_contest_registrations_contest 
ON contest_registrations(contest_id);

-- Composite unique index to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS idx_contest_registrations_unique 
ON contest_registrations(user_id, contest_id);

-- ============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Index for contest problems lookup
CREATE INDEX IF NOT EXISTS idx_contest_problems_contest 
ON contest_problems(contest_id);

-- Index for problem lookup by difficulty
CREATE INDEX IF NOT EXISTS idx_problems_difficulty 
ON problems(difficulty);

-- Index for active contests (filtering by start/end time)
CREATE INDEX IF NOT EXISTS idx_contests_active 
ON contests(start_time, end_time);

-- Index for user_id lookups in submissions (supports RLS policies)
CREATE INDEX IF NOT EXISTS idx_submissions_user_id_rls 
ON submissions(user_id) 
WHERE user_id IS NOT NULL;

-- Index for user_id lookups in contest_registrations (supports RLS policies)
CREATE INDEX IF NOT EXISTS idx_contest_registrations_user_id_rls 
ON contest_registrations(user_id) 
WHERE user_id IS NOT NULL;

-- Index for auth.uid() comparisons in users table (supports RLS policies)
CREATE INDEX IF NOT EXISTS idx_users_id_rls 
ON users(id) 
WHERE id IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Verify all indexes were created
SELECT 
  schemaname, 
  tablename, 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('users', 'submissions', 'contest_registrations', 'contest_problems', 'problems', 'contests')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
