-- Comprehensive migration for Contest Features
-- Ensures idempotency (can be run multiple times safely)

BEGIN;

-- 1. Ensure 'contests' table has new columns
ALTER TABLE public.contests 
ADD COLUMN IF NOT EXISTS platform text DEFAULT 'local',
ADD COLUMN IF NOT EXISTS external_url text,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 2. Ensure 'contest_registrations' table exists with correct schema
CREATE TABLE IF NOT EXISTS public.contest_registrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id uuid REFERENCES public.contests(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    registered_at timestamptz DEFAULT now(),
    score integer DEFAULT 0,
    penalty integer DEFAULT 0, -- In minutes
    rank integer,
    UNIQUE(contest_id, user_id)
);

-- 3. Ensure 'contest_problems' table exists (if not already)
CREATE TABLE IF NOT EXISTS public.contest_problems (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    contest_id uuid REFERENCES public.contests(id) ON DELETE CASCADE,
    problem_id text REFERENCES public.problems(id) ON DELETE CASCADE,
    order_index integer DEFAULT 0,
    UNIQUE(contest_id, problem_id)
);

-- 4. Enable RLS
ALTER TABLE public.contest_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for 'contest_registrations'

-- Users can view registrations (public leaderboard needs this)
DROP POLICY IF EXISTS "contest_registrations_select_all" ON public.contest_registrations;
CREATE POLICY "contest_registrations_select_all" ON public.contest_registrations
    FOR SELECT USING (true);

-- Users can register themselves
DROP POLICY IF EXISTS "contest_registrations_insert_own" ON public.contest_registrations;
CREATE POLICY "contest_registrations_insert_own" ON public.contest_registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unregister themselves
DROP POLICY IF EXISTS "contest_registrations_delete_own" ON public.contest_registrations;
CREATE POLICY "contest_registrations_delete_own" ON public.contest_registrations
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can do everything
DROP POLICY IF EXISTS "contest_registrations_all_admin" ON public.contest_registrations;
CREATE POLICY "contest_registrations_all_admin" ON public.contest_registrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );


-- 6. RLS Policies for 'contests' (Ensure update/delete works for admins)

-- Admins can Insert/Update/Delete contests
DROP POLICY IF EXISTS "contests_all_admin" ON public.contests;
CREATE POLICY "contests_all_admin" ON public.contests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );

-- Everyone can view contests
DROP POLICY IF EXISTS "contests_select_all" ON public.contests;
CREATE POLICY "contests_select_all" ON public.contests
    FOR SELECT USING (true);


-- 7. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_contest_registrations_contest_id ON public.contest_registrations(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_registrations_user_id ON public.contest_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_problems_contest_id ON public.contest_problems(contest_id);

COMMIT;
