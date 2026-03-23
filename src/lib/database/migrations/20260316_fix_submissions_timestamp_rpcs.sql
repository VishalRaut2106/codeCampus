-- Migration: Fix Submissions Timestamp Column in RPCs
-- Date: 2026-03-16
-- Description: Updates RPCs to use 'submitted_at' instead of 'created_at' for the submissions table.

-- 1. Fix get_user_dashboard_data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_user_data JSONB;
    v_stats JSONB;
    v_recent_activity JSONB;
    v_heatmap_data JSONB;
    v_contest_count INTEGER;
    v_global_rank INTEGER;
    v_total_users INTEGER;
BEGIN
    -- 1. Get User Profile
    SELECT id INTO v_user_id
    FROM users
    WHERE username = p_username;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- Fetch basic user info
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'username', username,
        'email', email,
        'role', role,
        'department', department,
        'prn', prn,
        'bio', bio,
        'streak', streak,
        'points', points,
        'badges', badges,
        'github_url', github_url,
        'linkedin_url', linkedin_url,
        'instagram_url', instagram_url,
        'portfolio_url', portfolio_url,
        'created_at', created_at,
        'approval_status', approval_status,
        'rank', rank
    ) INTO v_user_data
    FROM users
    WHERE id = v_user_id;

    -- 2. Calculate Problem Stats (Easy, Medium, Hard)
    SELECT jsonb_build_object(
        'easy', COUNT(*) FILTER (WHERE lower(p.difficulty) = 'easy'),
        'medium', COUNT(*) FILTER (WHERE lower(p.difficulty) = 'medium'),
        'hard', COUNT(*) FILTER (WHERE lower(p.difficulty) = 'hard'),
        'total', COUNT(*)
    ) INTO v_stats
    FROM (
        SELECT DISTINCT ON (problem_id) problem_id
        FROM submissions
        WHERE user_id = v_user_id AND status = 'accepted'
    ) s
    JOIN problems p ON s.problem_id = p.id;

    -- 3. Get Recent Activity (Last 5 Submissions)
    -- Fixed: Use submitted_at instead of created_at
    SELECT jsonb_agg(sub)
    INTO v_recent_activity
    FROM (
        SELECT 
            s.id,
            s.submitted_at as created_at, -- Alias to keep compatibility with existing frontend
            s.status,
            s.language,
            jsonb_build_object(
                'id', p.id,
                'title', p.title,
                'difficulty', p.difficulty
            ) as problem
        FROM submissions s
        JOIN problems p ON s.problem_id = p.id
        WHERE s.user_id = v_user_id AND s.status = 'accepted'
        ORDER BY s.submitted_at DESC
        LIMIT 5
    ) sub;

    -- 4. Get Heatmap Data (Date: Count)
    -- Fixed: Use submitted_at instead of created_at
    SELECT jsonb_agg(day_stat)
    INTO v_heatmap_data
    FROM (
        SELECT 
            submitted_at::DATE as date, 
            COUNT(*) as count
        FROM submissions 
        WHERE user_id = v_user_id
        GROUP BY submitted_at::DATE
        ORDER BY submitted_at::DATE ASC
    ) day_stat;
    
    -- 5. Contest Count
    SELECT COUNT(*) INTO v_contest_count
    FROM contest_participants
    WHERE user_id = v_user_id;

    -- 6. Global Rank Calculation
    IF (v_user_data->>'rank')::INTEGER IS NOT NULL THEN
        v_global_rank := (v_user_data->>'rank')::INTEGER;
    ELSE
         SELECT COUNT(*) + 1 INTO v_global_rank
         FROM users
         WHERE points > (v_user_data->>'points')::INTEGER
            AND role = 'student'
            AND approval_status = 'approved';
    END IF;

    -- 7. Total Users
    SELECT COUNT(*) INTO v_total_users
    FROM users
    WHERE role = 'student' AND approval_status = 'approved';

    -- Return Consolidated Result
    RETURN jsonb_build_object(
        'success', true,
        'profile', v_user_data,
        'stats', v_stats,
        'recent_activity', COALESCE(v_recent_activity, '[]'::jsonb),
        'heatmap', COALESCE(v_heatmap_data, '[]'::jsonb),
        'contest_count', v_contest_count,
        'global_rank', v_global_rank,
        'total_users', v_total_users
    );
END;
$$;

-- 2. Fix get_submission_activity
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
  LEFT JOIN submissions s ON DATE(s.submitted_at) = d.day -- Fixed: Use submitted_at
  GROUP BY d.day
  ORDER BY d.day ASC;
END;
$$;
