-- Migration: Fix User Visibility RLS
-- Date: 2026-02-15
-- Purpose: Allow authenticated users to view other users' profiles (essential for Leaderboard, Search, and Hall of Fame).
--          Previous policy restricted SELECT to own row or admin only.

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "users_select_optimized" ON public.users;

-- Create a new policy that allows all authenticated users to view all users
-- This is standard for social/community platforms where profiles are visible
CREATE POLICY "users_select_all_authenticated" ON public.users
FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- Note: We still keep strict policies for UPDATE/DELETE/INSERT (handled by previous migrations)
-- users_update_optimized -> Own or Admin
-- users_delete_admin_optimized -> Admin only
-- users_insert_admin_optimized -> Admin only
