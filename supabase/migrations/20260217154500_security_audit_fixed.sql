-- Security Audit & Hardening (FIXED)
-- 1. Secure `get_user_dashboard_data` RPC to prevent email leaking
-- 2. Enforce Strict RLS on critical tables
-- 3. Fix Infinite Recursion in `users` policy

-- ============================================================================
-- 0. HELPER: Secure Admin Check (Avoids RLS Recursion)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Runs as owner, bypassing RLS
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
$$;

-- ============================================================================
-- 1. Secure the RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_viewer_id UUID;
    v_is_owner BOOLEAN;
    v_is_admin BOOLEAN;
    v_user_data JSONB;
    v_stats JSONB;
    v_recent_activity JSONB;
    v_heatmap_data JSONB;
    v_contest_count INTEGER;
    v_global_rank INTEGER;
    v_total_users INTEGER;
BEGIN
    -- Get viewer ID (current user)
    v_viewer_id := auth.uid();
    
    -- Check if viewer is admin (Using the secure function)
    v_is_admin := public.is_admin(v_viewer_id);

    -- Get Target User ID
    SELECT id INTO v_user_id
    FROM users
    WHERE username = p_username;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not found');
    END IF;

    -- Check ownership
    v_is_owner := (v_viewer_id = v_user_id);

    -- Fetch basic user info (Conditional Exposure)
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'username', username,
        -- Email/Phone/PRN only for owner or admin
        'email', CASE WHEN v_is_owner OR v_is_admin THEN email ELSE NULL END,
        'mobile_number', CASE WHEN v_is_owner OR v_is_admin THEN mobile_number ELSE NULL END,
        'prn', CASE WHEN v_is_owner OR v_is_admin THEN prn ELSE NULL END,
        'role', role,
        'department', department,
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

    -- Stats, Heatmap, Ranking remain public as they are non-sensitive
    
    -- 2. Calculate Problem Stats
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

    -- 3. Recent Activity (Publicly visible? Yes, usually. But can restrict code visibility elsewhere)
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

    -- 4. Heatmap
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

    -- 6. Global Rank
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

    RETURN jsonb_build_object(
        'success', true,
        'profile', v_user_data,
        'stats', v_stats,
        'recent_activity', COALESCE(v_recent_activity, '[]'::jsonb),
        'heatmap', COALESCE(v_heatmap_data, '[]'::jsonb),
        'contest_count', v_contest_count,
        'global_rank', v_global_rank,
        'total_users', v_total_users,
        'is_own_profile', v_is_owner
    );
END;
$$;


-- ============================================================================
-- 2. Strict RLS for Submissions
-- ============================================================================
-- Ensure only owners can SELECT their own submissions
DROP POLICY IF EXISTS "submissions_select_own" ON public.submissions;
CREATE POLICY "submissions_select_own" ON public.submissions 
FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    public.is_admin(auth.uid()) -- Use Secure Function
);

-- Ensure only owners can INSERT
DROP POLICY IF EXISTS "submissions_insert_own" ON public.submissions;
CREATE POLICY "submissions_insert_own" ON public.submissions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. Strict RLS for Users
-- ============================================================================
-- We keep 'users' table restricted. 
-- Public profiles must be accessed via RPC or Service Role APIs (like search).

DROP POLICY IF EXISTS "users_select_strict" ON public.users;
CREATE POLICY "users_select_strict" ON public.users
FOR SELECT USING (
    auth.uid() = id
    OR
    public.is_admin(auth.uid()) -- Use Secure Function to avoid recursion
);

-- D. Grant Permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_data(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_data(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_data(TEXT) TO service_role;
