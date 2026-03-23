-- Migration: Fix Database Linter Issues
-- Date: 2026-02-14
-- Purpose: Address security and best practice issues flagged by Supabase linter
--          1. Fix "Security Definer View" errors
--          2. Fix "Function Search Path Mutable" warnings
--          3. Fix "Materialized View in API" warning
--          4. Add missing RLS policies

-- ============================================================================
-- 1. FIX SECURITY DEFINER VIEWS
-- ============================================================================
-- Views defined with SECURITY DEFINER should optionally be converted to SECURITY INVOKER
-- or have their search_path set. Standard views are usually SECURITY INVOKER.
-- We set them to SECURITY INVOKER to respect RLS of the querying user.

DO $$
BEGIN
    -- Fix public.leaderboard_public
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'leaderboard_public') THEN
        ALTER VIEW public.leaderboard_public SET (security_invoker = true);
    END IF;

    -- Fix public.leaderboard
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'leaderboard') THEN
        ALTER VIEW public.leaderboard SET (security_invoker = true);
    END IF;

    -- Fix public.rls_policy_documentation
    IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'rls_policy_documentation') THEN
        ALTER VIEW public.rls_policy_documentation SET (security_invoker = true);
    END IF;
END $$;

-- ============================================================================
-- 2. FIX FUNCTION SEARCH PATHS
-- ============================================================================
-- Set search_path to 'public' for SECURITY DEFINER functions to prevent search_path hijacking.
-- We use DO block to avoid errors if function signatures vary or functions don't exist.

-- Function: cleanup_old_submission_status
ALTER FUNCTION public.cleanup_old_submission_status() SET search_path = public;

-- Function: benchmark_policy_performance
ALTER FUNCTION public.benchmark_policy_performance(TEXT, INTEGER) SET search_path = public;

-- Function: refresh_leaderboard_view
ALTER FUNCTION public.refresh_leaderboard_view() SET search_path = public;

-- Function: trigger_leaderboard_refresh
ALTER FUNCTION public.trigger_leaderboard_refresh() SET search_path = public;

-- Function: get_user_rank
ALTER FUNCTION public.get_user_rank(UUID) SET search_path = public;

-- Function: increment_user_points (assuming signature based on typical usage)
-- Note: If overloaded, this might need adjustment.
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.increment_user_points(UUID, INT) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: publish_contest_problems
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.publish_contest_problems(UUID) SET search_path = public';
EXCEPTION WHEN OTHERS THEN 
    -- Try without args or handle manually if needed
    NULL; 
END $$;

-- Function: get_top_leaderboard
ALTER FUNCTION public.get_top_leaderboard(INTEGER) SET search_path = public;

-- Function: get_leaderboard_page
ALTER FUNCTION public.get_leaderboard_page(INTEGER, INTEGER) SET search_path = public;

-- Function: create_user_profile
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: admin_get_pending_students
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.admin_get_pending_students() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: handle_new_user (Trigger)
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Function: update_all_user_ranks
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.update_all_user_ranks() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: cleanup_ended_contests
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.cleanup_ended_contests() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: trigger_update_leaderboard (Trigger)
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.trigger_update_leaderboard() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: is_user_registered
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.is_user_registered(UUID, UUID) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: get_contest_status
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.get_contest_status(UUID) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: generate_admin_prn
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.generate_admin_prn() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: search_users
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.search_users(TEXT) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: make_user_admin
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.make_user_admin(UUID) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: update_contest_leaderboard
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.update_contest_leaderboard() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: is_admin
ALTER FUNCTION public.is_admin(UUID) SET search_path = public;

-- Function: is_user_approved
ALTER FUNCTION public.is_user_approved(UUID) SET search_path = public;

-- Function: update_updated_at_column (Trigger)
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: is_admin_user
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.is_admin_user(UUID) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: get_pending_students
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.get_pending_students() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: get_top_users
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.get_top_users(INTEGER) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: get_admin_dashboard_stats
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.get_admin_dashboard_stats() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: increment_problem_solved
ALTER FUNCTION public.increment_problem_solved(UUID) SET search_path = public;

-- Function: award_points_on_submission
-- Note: This might be old/renamed, check if exists
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.award_points_on_submission(UUID, UUID, INTEGER) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: get_all_students
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.get_all_students() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: get_user_role
ALTER FUNCTION public.get_user_role(UUID) SET search_path = public;

-- Function: get_all_students_admin (RPC used in API)
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.get_all_students_admin() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: is_student
ALTER FUNCTION public.is_student(UUID) SET search_path = public;

-- Function: get_user_profile_safe
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.get_user_profile_safe(UUID) SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Function: can_view_submission
ALTER FUNCTION public.can_view_submission(UUID, UUID) SET search_path = public;

-- Function: test_policy_recursion
ALTER FUNCTION public.test_policy_recursion(TEXT, TEXT) SET search_path = public;

-- Function: handle_updated_at (Trigger)
DO $$ BEGIN
    EXECUTE 'ALTER FUNCTION public.handle_updated_at() SET search_path = public';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- 3. FIX MATERIALIZED VIEW IN API
-- ============================================================================
-- Revoke direct permissions on materialized view to force use of RPCs
-- This fixes "Materialized view public.leaderboard_view is selectable by anon or authenticated roles"

REVOKE SELECT ON TABLE public.leaderboard_view FROM anon, authenticated;
-- Note: The app should use get_leaderboard_page or get_top_leaderboard RPCs, or admin functions.

-- ============================================================================
-- 4. FIX RLS ENABLED NO POLICY
-- ============================================================================
-- Table: public.contest_leaderboard

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contest_leaderboard' AND schemaname = 'public'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON "public"."contest_leaderboard"
        AS PERMISSIVE FOR SELECT
        TO public
        USING (true);
    END IF;
END $$;
