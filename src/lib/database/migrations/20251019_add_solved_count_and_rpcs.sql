-- Safe migration: add solved_count to problems and helper RPCs for increments
ALTER TABLE public.problems ADD COLUMN IF NOT EXISTS solved_count INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_submission_at TIMESTAMP WITH TIME ZONE;

-- Helper function to increment points
CREATE OR REPLACE FUNCTION public.increment_user_points(p_user_id UUID, p_points INT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users SET points = COALESCE(points,0) + p_points WHERE id = p_user_id;
END;$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment streak (naive +1)
CREATE OR REPLACE FUNCTION public.increment_user_streak(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users SET streak = COALESCE(streak,0) + 1, last_submission_at = NOW() WHERE id = p_user_id;
END;$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to increment problem solved count
CREATE OR REPLACE FUNCTION public.increment_problem_solved(p_problem_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.problems SET solved_count = COALESCE(solved_count,0) + 1 WHERE id = p_problem_id;
END;$$ LANGUAGE plpgsql SECURITY DEFINER;
