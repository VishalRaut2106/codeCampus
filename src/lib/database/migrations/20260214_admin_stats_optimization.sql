-- Migration to add admin stats RPCs for performance
-- optimization: move aggregation from JS to SQL

-- 1. Get Department Distribution
CREATE OR REPLACE FUNCTION get_department_distribution()
RETURNS TABLE (
  department TEXT,
  count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as owner to see all users
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(u.department, 'Other') as department,
    COUNT(*)::BIGINT as count
  FROM users u
  WHERE u.role = 'student'
  GROUP BY COALESCE(u.department, 'Other')
  ORDER BY count DESC;
END;
$$;

-- 2. Get Registration Trend (Last 7 Days)
CREATE OR REPLACE FUNCTION get_registration_trend()
RETURNS TABLE (
  date TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE AS day
  )
  SELECT 
    TO_CHAR(d.day, 'YYYY-MM-DD') as date,
    COUNT(u.id)::BIGINT as count
  FROM dates d
  LEFT JOIN users u ON DATE(u.created_at) = d.day AND u.role = 'student'
  GROUP BY d.day
  ORDER BY d.day ASC;
END;
$$;

-- 3. Get Submission Activity (Last 7 Days)
CREATE OR REPLACE FUNCTION get_submission_activity()
RETURNS TABLE (
  date TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(
      CURRENT_DATE - INTERVAL '6 days',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE AS day
  )
  SELECT 
    TO_CHAR(d.day, 'YYYY-MM-DD') as date,
    COUNT(s.id)::BIGINT as count
  FROM dates d
  LEFT JOIN submissions s ON DATE(s.created_at) = d.day
  GROUP BY d.day
  ORDER BY d.day ASC;
END;
$$;

-- 4. Get Dashboard Stats (Admin)
CREATE OR REPLACE FUNCTION get_dashboard_stats_admin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalStudents', (SELECT COUNT(*) FROM users WHERE role = 'student'),
    'pendingApprovals', (SELECT COUNT(*) FROM users WHERE role = 'student' AND approval_status = 'pending'),
    'totalContests', (SELECT COUNT(*) FROM contests),
    'activeContests', (SELECT COUNT(*) FROM contests WHERE NOW() BETWEEN start_time AND end_time),
    'totalProblems', (SELECT COUNT(*) FROM problems),
    'totalSubmissions', (SELECT COUNT(*) FROM submissions)
  ) INTO result;
  
  RETURN result;
END;
$$;
