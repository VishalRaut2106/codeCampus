-- Migration: Create Student of the Month Function
-- Date: 2026-02-15
-- Purpose: Calculate the top student for a specific month based on contest usage

CREATE OR REPLACE FUNCTION get_student_of_the_month(p_month INT, p_year INT)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  total_score BIGINT,
  contests_participated BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_contests AS (
    SELECT id 
    FROM contests 
    WHERE 
      EXTRACT(MONTH FROM end_time) = p_month AND
      EXTRACT(YEAR FROM end_time) = p_year AND
      status = 'ended'
  ),
  user_scores AS (
    SELECT 
      cr.user_id,
      SUM(cr.score) as total_score,
      COUNT(cr.contest_id) as contest_count
    FROM contest_registrations cr
    WHERE cr.contest_id IN (SELECT id FROM monthly_contests)
    GROUP BY cr.user_id
  )
  SELECT 
    u.id,
    u.name,
    u.username,
    u.avatar_url,
    us.total_score,
    us.contest_count
  FROM user_scores us
  JOIN users u ON u.id = us.user_id
  ORDER BY us.total_score DESC
  LIMIT 1;
END;
$$;
