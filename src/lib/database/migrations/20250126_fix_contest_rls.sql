-- Fix RLS policies for Contest Problems
-- Enables public read access and admin write access

BEGIN;

-- 1. Policies for 'contest_problems'

-- Allow everyone to view contest problems (needed for counts and taking contests)
DROP POLICY IF EXISTS "contest_problems_select_all" ON public.contest_problems;
CREATE POLICY "contest_problems_select_all" ON public.contest_problems
    FOR SELECT USING (true);

-- Allow admins to manage contest problems (Assign/Remove)
DROP POLICY IF EXISTS "contest_problems_all_admin" ON public.contest_problems;
CREATE POLICY "contest_problems_all_admin" ON public.contest_problems
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );

COMMIT;
