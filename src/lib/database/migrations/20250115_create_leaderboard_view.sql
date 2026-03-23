-- Migration: Create Materialized View for Leaderboard
-- Date: 2025-01-15
-- Purpose: Create a materialized view for efficient leaderboard queries with pre-calculated ranks
-- Requirements: 6.6

-- ============================================================================
-- DROP EXISTING OBJECTS (IF ANY)
-- ============================================================================

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trigger_submissions_leaderboard_refresh ON submissions;
DROP TRIGGER IF EXISTS trigger_users_leaderboard_refresh ON users;

-- Drop functions (use CASCADE to drop dependent objects)
DROP FUNCTION IF EXISTS get_leaderboard_page(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_top_leaderboard(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_user_rank(UUID) CASCADE;
DROP FUNCTION IF EXISTS trigger_leaderboard_refresh() CASCADE;
DROP FUNCTION IF EXISTS refresh_leaderboard_view() CASCADE;

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS leaderboard_view CASCADE;

-- ============================================================================
-- CREATE MATERIALIZED VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW leaderboard_view AS
SELECT 
  u.id,
  u.name,
  u.username,
  u.email,
  u.points,
  u.streak,
  u.badges,
  u.created_at,
  -- Calculate rank based on points (descending) and streak (descending) as tiebreaker
  ROW_NUMBER() OVER (
    ORDER BY u.points DESC, u.streak DESC, u.created_at ASC
  ) as rank,
  -- Calculate total number of accepted submissions
  COALESCE(
    (SELECT COUNT(*) 
     FROM submissions s 
     WHERE s.user_id = u.id AND s.status = 'accepted'),
    0
  ) as total_solved,
  -- Calculate total submissions
  COALESCE(
    (SELECT COUNT(*) 
     FROM submissions s 
     WHERE s.user_id = u.id),
    0
  ) as total_submissions,
  -- Calculate acceptance rate
  CASE 
    WHEN COALESCE(
      (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id),
      0
    ) > 0 THEN
      ROUND(
        (COALESCE(
          (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.status = 'accepted'),
          0
        )::numeric / 
        COALESCE(
          (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id),
          1
        )::numeric) * 100,
        2
      )
    ELSE 0
  END as acceptance_rate
FROM users u
WHERE u.role = 'student' 
  AND u.approval_status = 'approved'
ORDER BY rank ASC;

-- ============================================================================
-- CREATE INDEXES ON MATERIALIZED VIEW
-- ============================================================================

-- Primary index on rank for fast rank lookups
CREATE UNIQUE INDEX idx_leaderboard_view_rank ON leaderboard_view(rank);

-- Index on user_id for fast user lookup
CREATE INDEX idx_leaderboard_view_user_id ON leaderboard_view(id);

-- Index on username for search functionality
CREATE INDEX idx_leaderboard_view_username ON leaderboard_view(username);

-- Index on points for range queries
CREATE INDEX idx_leaderboard_view_points ON leaderboard_view(points DESC);

-- ============================================================================
-- REFRESH FUNCTION
-- ============================================================================

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_leaderboard_view()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh the materialized view (blocking but fast)
  REFRESH MATERIALIZED VIEW leaderboard_view;
  
  -- Log the refresh
  RAISE NOTICE 'Leaderboard view refreshed at %', NOW();
END;
$$;

-- ============================================================================
-- AUTOMATIC REFRESH TRIGGER
-- ============================================================================

-- Function to trigger refresh after relevant changes
CREATE OR REPLACE FUNCTION trigger_leaderboard_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh the view (non-blocking)
  PERFORM refresh_leaderboard_view();
  RETURN NULL;
END;
$$;

-- Trigger on users table (when points or streak changes)
DROP TRIGGER IF EXISTS trigger_users_leaderboard_refresh ON users;
CREATE TRIGGER trigger_users_leaderboard_refresh
AFTER UPDATE OF points, streak ON users
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_leaderboard_refresh();

-- Trigger on submissions table (when new accepted submission)
DROP TRIGGER IF EXISTS trigger_submissions_leaderboard_refresh ON submissions;
CREATE TRIGGER trigger_submissions_leaderboard_refresh
AFTER INSERT OR UPDATE OF status ON submissions
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_leaderboard_refresh();

-- ============================================================================
-- SCHEDULED REFRESH (USING pg_cron IF AVAILABLE)
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, use application-level scheduling instead

-- Enable pg_cron extension (run as superuser if needed)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule refresh every 5 minutes
-- SELECT cron.schedule(
--   'refresh-leaderboard',
--   '*/5 * * * *',
--   'SELECT refresh_leaderboard_view();'
-- );

-- To unschedule:
-- SELECT cron.unschedule('refresh-leaderboard');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's rank from the view
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN (
    SELECT rank 
    FROM leaderboard_view 
    WHERE id = p_user_id
  );
END;
$$;

-- Function to get top N users from leaderboard
CREATE OR REPLACE FUNCTION get_top_leaderboard(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  points INTEGER,
  streak INTEGER,
  rank BIGINT,
  total_solved BIGINT,
  acceptance_rate NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lv.id,
    lv.name,
    lv.username,
    lv.points,
    lv.streak,
    lv.rank,
    lv.total_solved,
    lv.acceptance_rate
  FROM leaderboard_view lv
  ORDER BY lv.rank ASC
  LIMIT p_limit;
END;
$$;

-- Function to get leaderboard page (with pagination)
CREATE OR REPLACE FUNCTION get_leaderboard_page(
  p_offset INTEGER DEFAULT 0,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  username TEXT,
  points INTEGER,
  streak INTEGER,
  rank BIGINT,
  total_solved BIGINT,
  acceptance_rate NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lv.id,
    lv.name,
    lv.username,
    lv.points,
    lv.streak,
    lv.rank,
    lv.total_solved,
    lv.acceptance_rate
  FROM leaderboard_view lv
  ORDER BY lv.rank ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify the view was created:
-- SELECT * FROM leaderboard_view LIMIT 10;

-- To check view size and statistics:
-- SELECT 
--   pg_size_pretty(pg_total_relation_size('leaderboard_view')) as total_size,
--   COUNT(*) as total_rows
-- FROM leaderboard_view;

-- To manually refresh the view:
-- SELECT refresh_leaderboard_view();

-- To check last refresh time:
-- SELECT 
--   schemaname,
--   matviewname,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) as size
-- FROM pg_matviews
-- WHERE matviewname = 'leaderboard_view';
