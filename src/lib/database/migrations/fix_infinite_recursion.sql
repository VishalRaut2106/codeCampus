-- Migration: Fix Infinite Recursion in Users Policy
-- Date: 2026-02-18
-- Purpose: 
-- 1. Drop all potentially conflicting/recursive policies on `public.users`.
-- 2. Redefine `public.is_admin` as SECURITY DEFINER to break recursion.
-- 3. Create a clean, non-recursive policy for `public.users`.

-- ============================================================================
-- 1. CLEANUP: Drop existing policies to ensure a clean slate
-- ============================================================================

DROP POLICY IF EXISTS "users_select_strict" ON public.users;
DROP POLICY IF EXISTS "users_select_optimized" ON public.users;
DROP POLICY IF EXISTS "users_select_all_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_admin" ON public.users;
DROP POLICY IF EXISTS "users_all_admin" ON public.users;
-- Also drop any other variations found in previous migrations
DROP POLICY IF EXISTS "users_read_all" ON public.users;
DROP POLICY IF EXISTS "users_view_own" ON public.users;

-- ============================================================================
-- 2. HELPER: Secure Admin Check (Avoids RLS Recursion)
-- ============================================================================

-- Redefine is_admin to be strictly SECURITY DEFINER.
-- This runs with the privileges of the creator (postgres/admin), bypassing RLS on `users`.
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER 
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role IN ('admin', 'super_admin')
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO service_role;

-- ============================================================================
-- 3. POLICY: Users Table (Recursive-Free)
-- ============================================================================

-- Enable RLS just in case
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- SELECT Policy:
-- 1. Users can see their own profile (id = auth.uid())
-- 2. Admins can see everyone (public.is_admin(auth.uid()))
-- Note: public.is_admin() bypasses RLS, so it won't infinite loop.

CREATE POLICY "users_select_final" ON public.users
FOR SELECT USING (
  auth.uid() = id
  OR 
  public.is_admin(auth.uid())
);

-- UPDATE Policy:
-- 1. Users can update their own profile
-- 2. Admins can update everyone

DROP POLICY IF EXISTS "users_update_optimized" ON public.users;
CREATE POLICY "users_update_final" ON public.users
FOR UPDATE USING (
  auth.uid() = id
  OR 
  public.is_admin(auth.uid())
);

-- DELETE/INSERT Policy:
-- 1. Only Admins

DROP POLICY IF EXISTS "users_delete_admin_optimized" ON public.users;
CREATE POLICY "users_delete_final" ON public.users
FOR DELETE USING (
  public.is_admin(auth.uid())
);

DROP POLICY IF EXISTS "users_insert_admin_optimized" ON public.users;
CREATE POLICY "users_insert_final" ON public.users
FOR INSERT WITH CHECK (
  public.is_admin(auth.uid())
);
