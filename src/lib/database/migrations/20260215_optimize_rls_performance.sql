-- Migration: Optimize RLS Policies for Performance
-- Date: 2026-02-15
-- Purpose: 
-- 1. Wrap `auth.uid()` in `(select auth.uid())` to enable initplan caching (performance).
-- 2. Consolidate overlapping permissive policies to reduce evaluation overhead.
-- 3. Fix type mismatches (uuid vs text) in policies.

-- Helper for admin check to be fast
-- We assume public.is_admin() is already optimized or we use the raw check if function adds overhead, 
-- but function is better for maintainability. We will wrap the function call in (select ...).

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================

-- Drop existing overlapping/inefficient policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_all_admin" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_admin" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin" ON public.users;
DROP POLICY IF EXISTS "users_insert_admin" ON public.users;

-- Create optimized policies

-- SELECT: Users see themselves OR Admins see everyone
CREATE POLICY "users_select_optimized" ON public.users
FOR SELECT USING (
  id = (select auth.uid()) 
  OR 
  (select public.is_admin((select auth.uid())))
);

-- UPDATE: Users update themselves OR Admins update everyone
CREATE POLICY "users_update_optimized" ON public.users
FOR UPDATE USING (
  id = (select auth.uid()) 
  OR 
  (select public.is_admin((select auth.uid())))
);

-- DELETE: Only Admins
CREATE POLICY "users_delete_admin_optimized" ON public.users
FOR DELETE USING (
  (select public.is_admin((select auth.uid())))
);

-- INSERT: Only Admins
CREATE POLICY "users_insert_admin_optimized" ON public.users
FOR INSERT WITH CHECK (
  (select public.is_admin((select auth.uid())))
);


-- ============================================================================
-- 2. CONTESTS TABLE
-- ============================================================================

-- Drop existing admin policies (public read is 'true', so keep that)
DROP POLICY IF EXISTS "contests_all_admin" ON public.contests;
DROP POLICY IF EXISTS "contests_delete_admin" ON public.contests;
DROP POLICY IF EXISTS "contests_insert_admin" ON public.contests;
DROP POLICY IF EXISTS "contests_update_admin" ON public.contests;

-- Make sure we have the public read policy (optimized)
DROP POLICY IF EXISTS "contests_select_all" ON public.contests;
CREATE POLICY "contests_select_all" ON public.contests FOR SELECT USING (true);

-- Admin Write Access (Consolidated and Optimized)
CREATE POLICY "contests_admin_write_optimized" ON public.contests
FOR ALL USING (
  (select public.is_admin((select auth.uid())))
);


-- ============================================================================
-- 3. PROBLEMS TABLE
-- ============================================================================

-- Drop existing admin policies
DROP POLICY IF EXISTS "problems_all_admin" ON public.problems;
DROP POLICY IF EXISTS "problems_delete_admin" ON public.problems;
DROP POLICY IF EXISTS "problems_insert_admin" ON public.problems;
DROP POLICY IF EXISTS "problems_update_admin" ON public.problems;

-- Public read
DROP POLICY IF EXISTS "problems_select_all" ON public.problems;
CREATE POLICY "problems_select_all" ON public.problems FOR SELECT USING (true);

-- Admin Write Access
CREATE POLICY "problems_admin_write_optimized" ON public.problems
FOR ALL USING (
  (select public.is_admin((select auth.uid())))
);


-- ============================================================================
-- 4. CONTEST PROBLEMS
-- ============================================================================

-- Drop redundant policies
DROP POLICY IF EXISTS "contest_problems_all_admin" ON public.contest_problems;
DROP POLICY IF EXISTS "contest_problems_delete_admin" ON public.contest_problems;
DROP POLICY IF EXISTS "contest_problems_insert_admin" ON public.contest_problems;
DROP POLICY IF EXISTS "contest_problems_update_admin" ON public.contest_problems;

-- Public read
DROP POLICY IF EXISTS "contest_problems_select_all" ON public.contest_problems;
CREATE POLICY "contest_problems_select_all" ON public.contest_problems FOR SELECT USING (true);

-- Admin Write Access
CREATE POLICY "contest_problems_admin_write_optimized" ON public.contest_problems
FOR ALL USING (
  (select public.is_admin((select auth.uid())))
);


-- ============================================================================
-- 5. SUBMISSIONS
-- ============================================================================

-- Drop existing
DROP POLICY IF EXISTS "submissions_select_own" ON public.submissions;
DROP POLICY IF EXISTS "submissions_insert_own" ON public.submissions;
DROP POLICY IF EXISTS "submissions_all_admin" ON public.submissions;
DROP POLICY IF EXISTS "submissions_select_admin" ON public.submissions;
DROP POLICY IF EXISTS "submissions_delete_admin" ON public.submissions;
DROP POLICY IF EXISTS "submissions_update_admin" ON public.submissions;
DROP POLICY IF EXISTS "Users can manage their submissions" ON public.submissions;

-- SELECT: Own OR Admin
CREATE POLICY "submissions_select_optimized" ON public.submissions
FOR SELECT USING (
  user_id = (select auth.uid()) 
  OR 
  (select public.is_admin((select auth.uid())))
);

-- INSERT: Own only
CREATE POLICY "submissions_insert_optimized" ON public.submissions
FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
  OR
  (select public.is_admin((select auth.uid())))
);

-- UPDATE/DELETE: Admin only
CREATE POLICY "submissions_admin_write_optimized" ON public.submissions
FOR DELETE USING (
  (select public.is_admin((select auth.uid())))
);

-- Separate UPDATE if needed
CREATE POLICY "submissions_admin_update_optimized" ON public.submissions
FOR UPDATE USING (
  (select public.is_admin((select auth.uid())))
);


-- ============================================================================
-- 6. CONTEST PARTICIPANTS
-- ============================================================================

-- Drop existing
DROP POLICY IF EXISTS "contest_participants_all_admin" ON public.contest_participants;
DROP POLICY IF EXISTS "contest_participants_select_all" ON public.contest_participants;
DROP POLICY IF EXISTS "contest_participants_insert_own" ON public.contest_participants;
DROP POLICY IF EXISTS "contest_participants_delete_own" ON public.contest_participants;
DROP POLICY IF EXISTS "Users can manage their contest participation" ON public.contest_participants;

-- SELECT: Public
CREATE POLICY "contest_participants_select_all" ON public.contest_participants FOR SELECT USING (true);

-- INSERT: Join yourself OR Admin adds you
CREATE POLICY "contest_participants_insert_optimized" ON public.contest_participants
FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
  OR
  (select public.is_admin((select auth.uid())))
);

-- DELETE: Leave yourself OR Admin removes you
CREATE POLICY "contest_participants_delete_optimized" ON public.contest_participants
FOR DELETE USING (
  user_id = (select auth.uid())
  OR
  (select public.is_admin((select auth.uid())))
);

-- UPDATE: Admin only
CREATE POLICY "contest_participants_update_admin_optimized" ON public.contest_participants
FOR UPDATE USING (
  (select public.is_admin((select auth.uid())))
);


-- ============================================================================
-- 7. CONTEST REGISTRATIONS
-- ============================================================================

-- Drop existing
DROP POLICY IF EXISTS "contest_registrations_all_admin" ON public.contest_registrations;
DROP POLICY IF EXISTS "contest_registrations_select_all" ON public.contest_registrations;
DROP POLICY IF EXISTS "contest_registrations_insert_own" ON public.contest_registrations;
DROP POLICY IF EXISTS "contest_registrations_delete_own" ON public.contest_registrations;

-- SELECT: Public or Restricted? Assuming Public/Auth for now to see who registered
CREATE POLICY "contest_registrations_select_all" ON public.contest_registrations FOR SELECT USING (true);

-- INSERT: Register yourself OR Admin registers you
CREATE POLICY "contest_registrations_insert_optimized" ON public.contest_registrations
FOR INSERT WITH CHECK (
  user_id = (select auth.uid())
  OR
  (select public.is_admin((select auth.uid())))
);

-- DELETE: Cancel registration yourself OR Admin cancels you
CREATE POLICY "contest_registrations_delete_optimized" ON public.contest_registrations
FOR DELETE USING (
  user_id = (select auth.uid())
  OR
  (select public.is_admin((select auth.uid())))
);


-- ============================================================================
-- 8. SUBMISSION STATUS UPDATES
-- ============================================================================

-- Drop existing
DROP POLICY IF EXISTS "Admins can view all submission status" ON public.submission_status_updates;
DROP POLICY IF EXISTS "Users can view their own submission status" ON public.submission_status_updates;
DROP POLICY IF EXISTS "Users can view their own submission updates" ON public.submission_status_updates;

-- SELECT: Own OR Admin
-- Note: submission_id in submission_status_updates is TEXT, but submissions.id is UUID.
-- We must cast submission_id to UUID for the link to work.
CREATE POLICY "submission_status_updates_select_optimized" ON public.submission_status_updates
FOR SELECT USING (
  exists (
    select 1 from submissions s 
    where s.id = submission_status_updates.submission_id::uuid
    and (s.user_id = (select auth.uid()) or (select public.is_admin((select auth.uid()))))
  )
);

-- INSERT: Service Role Only (Handled by existing policy in previous migration, but ensuring no duplications)
-- "Service role can insert status updates" exists.

