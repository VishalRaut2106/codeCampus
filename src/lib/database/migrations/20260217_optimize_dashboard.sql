-- Optimizes dashboard loading by fetching all user data in a single RPC call
-- Eliminates multiple round-trips and heavy client-side processing

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
    -- Much faster to count in DB than transfer 1000 rows to client
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
    -- We only fetch what we show in the UI
    SELECT jsonb_agg(sub)
    INTO v_recent_activity
    FROM (
        SELECT 
            s.id,
            s.created_at,
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
        ORDER BY s.created_at DESC
        LIMIT 5
    ) sub;

    -- 4. Get Heatmap Data (Date: Count)
    -- Optimized: Returns only date and count, not full objects
    -- Aggregates by day directly in SQL
    SELECT jsonb_agg(day_stat)
    INTO v_heatmap_data
    FROM (
        SELECT 
            created_at::DATE as date, 
            COUNT(*) as count
        FROM submissions 
        WHERE user_id = v_user_id
        GROUP BY created_at::DATE
        ORDER BY created_at::DATE ASC
    ) day_stat;
    
    -- 5. Contest Count
    SELECT COUNT(*) INTO v_contest_count
    FROM contest_participants
    WHERE user_id = v_user_id;

    -- 6. Global Rank Calculation (Optimized)
    -- If 'rank' field in users table is populated (from scheduled job), use it.
    -- Otherwise, calculate strictly based on points.
    IF (v_user_data->>'rank')::INTEGER IS NOT NULL THEN
        v_global_rank := (v_user_data->>'rank')::INTEGER;
    ELSE
         SELECT COUNT(*) + 1 INTO v_global_rank
         FROM users
         WHERE points > (v_user_data->>'points')::INTEGER
            AND role = 'student'
            AND approval_status = 'approved';
    END IF;

    -- 7. Total Users (for percentile)
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

-- Grant access
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(TEXT) TO anon;
