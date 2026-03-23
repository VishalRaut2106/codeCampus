-- Migration: Fix Permissive RLS Policies
-- Date: 2026-02-14
-- Purpose: Remove overly permissive 'allow_all' policies and replace with secure, granular policies.
--          Address "RLS Policy Always True" warnings.

-- ============================================================================
-- 1. CONTESTS
-- ============================================================================
-- Goal: Valid users read all. Admins manage.
-- Security: Remove 'allow_all_contests' (which allowed public DELETE/UPDATE)

-- Ensure safe read policy exists
DROP POLICY IF EXISTS "contests_select_all" ON public.contests;
CREATE POLICY "contests_select_all" ON public.contests FOR SELECT USING (true);

-- Drop insecure permissive policies
DROP POLICY IF EXISTS "allow_all_contests" ON public.contests;


-- ============================================================================
-- 2. PROBLEMS
-- ============================================================================
-- Goal: Valid users read all. Admins manage.

-- Ensure safe read policy exists
DROP POLICY IF EXISTS "problems_select_all" ON public.problems;
CREATE POLICY "problems_select_all" ON public.problems FOR SELECT USING (true);

-- Drop insecure permissive policies
DROP POLICY IF EXISTS "allow_all_problems" ON public.problems;


-- ============================================================================
-- 3. CONTEST PROBLEMS & PARTICIPANTS
-- ============================================================================

-- Contest Problems
DROP POLICY IF EXISTS "contest_problems_select_all" ON public.contest_problems;
CREATE POLICY "contest_problems_select_all" ON public.contest_problems FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_all_contest_problems" ON public.contest_problems;

-- Contest Participants
DROP POLICY IF EXISTS "contest_participants_select_all" ON public.contest_participants;
CREATE POLICY "contest_participants_select_all" ON public.contest_participants FOR SELECT USING (true);

-- Ensure users can join/leave (own rows)
DROP POLICY IF EXISTS "contest_participants_insert_own" ON public.contest_participants;
CREATE POLICY "contest_participants_insert_own" ON public.contest_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contest_participants_delete_own" ON public.contest_participants;
CREATE POLICY "contest_participants_delete_own" ON public.contest_participants FOR DELETE USING (auth.uid() = user_id);

-- Drop insecure permissive policies
DROP POLICY IF EXISTS "allow_all_contest_participants" ON public.contest_participants;


-- ============================================================================
-- 4. SUBMISSIONS
-- ============================================================================
-- Goal: Users see own. Admins see all. NO PUBLIC WRITE.

-- Ensure safe policies exist
DROP POLICY IF EXISTS "submissions_select_own" ON public.submissions;
CREATE POLICY "submissions_select_own" ON public.submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "submissions_insert_own" ON public.submissions;
CREATE POLICY "submissions_insert_own" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drop insecure permissive policies
DROP POLICY IF EXISTS "allow_all_submissions" ON public.submissions;


-- ============================================================================
-- 5. USERS
-- ============================================================================
-- Goal: Users see own (and maybe some public profile info via specific queries/ RPCs). 
--       Admins see all.

-- Ensure safe policies exist
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Drop insecure permissive policies
DROP POLICY IF EXISTS "users_policy" ON public.users;


-- ============================================================================
-- 6. SUBMISSION STATUS UPDATES
-- ============================================================================
-- Goal: Fix "Service role can insert" being public.

DROP POLICY IF EXISTS "Service role can insert status updates" ON public.submission_status_updates;

-- Recreate restricted to service_role
CREATE POLICY "Service role can insert status updates" 
ON public.submission_status_updates 
FOR INSERT 
TO service_role 
WITH CHECK (true);


-- ============================================================================
-- 7. ENSURE ADMIN ACCESS (Generic)
-- ============================================================================
-- Ensure admins can access everything (using the is_admin function we secured earlier)

-- Contests
DROP POLICY IF EXISTS "contests_all_admin" ON public.contests;
CREATE POLICY "contests_all_admin" ON public.contests FOR ALL USING (public.is_admin(auth.uid()));

-- Problems
DROP POLICY IF EXISTS "problems_all_admin" ON public.problems;
CREATE POLICY "problems_all_admin" ON public.problems FOR ALL USING (public.is_admin(auth.uid()));

-- Submissions
DROP POLICY IF EXISTS "submissions_all_admin" ON public.submissions;
CREATE POLICY "submissions_all_admin" ON public.submissions FOR ALL USING (public.is_admin(auth.uid()));

-- Users
DROP POLICY IF EXISTS "users_all_admin" ON public.users;
CREATE POLICY "users_all_admin" ON public.users FOR ALL USING (public.is_admin(auth.uid()));

