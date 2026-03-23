-- Migration: Cleanup Conflicting RLS Policies
-- Date: 2026-02-18
-- Purpose: Remove legacy and conflicting policies that cause infinite recursion.

-- 1. Drop the RECURSIVE policy (The main culprit)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;

-- 2. Drop redundant policies (Covered by users_select_final)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.users;

-- 3. Ensure the FINAL policies are the only ones active (for safety)
-- (These were created in the previous migration, but we ensure no duplicates)
-- users_select_final, users_update_final, users_delete_final, users_insert_final

-- 4. Double check validation for INSERT
-- Re-applying just in case to ensure it has the correct WITH CHECK definition
DROP POLICY IF EXISTS "users_insert_final" ON public.users;
CREATE POLICY "users_insert_final" ON public.users
FOR INSERT WITH CHECK (
  public.is_admin(auth.uid())
);
