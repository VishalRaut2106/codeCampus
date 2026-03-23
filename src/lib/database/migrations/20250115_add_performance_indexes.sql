-- Migration: Add Performance Indexes
-- Date: 2025-01-15
-- Purpose: Add indexes to improve query performance for frequently accessed columns
-- Requirements: 6.5

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Index for filtering users by approval status (used in admin dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_approval_status 
ON users(approval_status);

-- Index for filtering users by role (used for role-based queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users(role);

-- Index for leaderboard queries (sorting by points descending)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_points_desc 
ON users(points DESC);

-- Composite index for approved students leaderboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_leaderboard 
ON users(approval_status, role, points DESC) 
WHERE approval_status = 'approved' AND role = 'student';

-- ============================================================================
-- SUBMISSIONS TABLE INDEXES
-- ============================================================================

-- Composite index for user's submissions on a specific problem
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_problem 
ON submissions(user_id, problem_id);

-- Index for filtering submissions by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_status 
ON submissions(status);

-- Index for recent submissions (sorting by submitted_at descending)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_submitted_at 
ON submissions(submitted_at DESC);

-- Composite index for checking first solve (user + problem + status)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_first_solve 
ON submissions(user_id, problem_id, status) 
WHERE status = 'accepted';

-- Index for contest submissions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_contest 
ON submissions(contest_id) 
WHERE contest_id IS NOT NULL;

-- ============================================================================
-- CONTEST_REGISTRATIONS TABLE INDEXES
-- ============================================================================

-- Index for finding user's contest registrations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contest_registrations_user 
ON contest_registrations(user_id);

-- Index for finding contest participants
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contest_registrations_contest 
ON contest_registrations(contest_id);

-- Composite unique index to prevent duplicate registrations
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_contest_registrations_unique 
ON contest_registrations(user_id, contest_id);

-- ============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Index for contest problems lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contest_problems_contest 
ON contest_problems(contest_id);

-- Index for problem lookup by difficulty
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_problems_difficulty 
ON problems(difficulty);

-- Index for active contests (filtering by start/end time)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contests_active 
ON contests(start_time, end_time);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify indexes were created successfully, run:
-- SELECT schemaname, tablename, indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('users', 'submissions', 'contest_registrations', 'contest_problems', 'problems', 'contests')
-- ORDER BY tablename, indexname;

-- To check index usage statistics:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename IN ('users', 'submissions', 'contest_registrations')
-- ORDER BY idx_scan DESC;
