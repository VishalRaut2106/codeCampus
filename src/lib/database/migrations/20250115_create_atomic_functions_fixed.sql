-- Migration: Create Atomic Database Functions
-- Date: 2025-01-15
-- Purpose: Create atomic database functions for safe concurrent operations
-- Requirements: 6.8, 9.4

-- ============================================================================
-- FUNCTION: award_points_for_solve
-- ============================================================================
-- Awards points to a user for solving a problem (first solve only)
-- Handles race conditions with proper locking and atomic operations

CREATE OR REPLACE FUNCTION award_points_for_solve(
  p_user_id UUID,
  p_problem_id UUID,
  p_points INTEGER
)
RETURNS TABLE (
  awarded BOOLEAN,
  is_first_solve BOOLEAN,
  new_points INTEGER,
  new_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $`nDECLARE
  v_is_first_solve BOOLEAN;
  v_new_points INTEGER;
  v_new_streak INTEGER;
  v_last_solve_date DATE;
  v_today DATE;
  v_streak_increment INTEGER;
BEGIN
  -- Get today's date
  v_today := CURRENT_DATE;
  
  -- Check if this is the user's first accepted solve for this problem
  -- Use FOR UPDATE to lock the rows and prevent race conditions
  SELECT NOT EXISTS (
    SELECT 1 
    FROM submissions
    WHERE user_id = p_user_id
      AND problem_id = p_problem_id
      AND status = 'accepted'
    FOR UPDATE
  ) INTO v_is_first_solve;
  
  -- If not first solve, return early
  IF NOT v_is_first_solve THEN
    -- Get current user stats
    SELECT points, streak INTO v_new_points, v_new_streak
    FROM users
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT FALSE, FALSE, v_new_points, v_new_streak;
    RETURN;
  END IF;
  
  -- Get user's last solve date for streak calculation
  SELECT last_active INTO v_last_solve_date
  FROM users
  WHERE id = p_user_id
  FOR UPDATE; -- Lock the user row
  
  -- Calculate streak increment
  IF v_last_solve_date IS NULL THEN
    -- First ever solve
    v_streak_increment := 1;
  ELSIF v_last_solve_date = v_today THEN
    -- Already solved today, no streak increment
    v_streak_increment := 0;
  ELSIF v_last_solve_date = v_today - INTERVAL '1 day' THEN
    -- Solved yesterday, increment streak
    v_streak_increment := 1;
  ELSE
    -- Streak broken, reset to 1
    v_streak_increment := 1 - COALESCE((SELECT streak FROM users WHERE id = p_user_id), 0);
  END IF;
  
  -- Update user points and streak atomically
  UPDATE users
  SET 
    points = points + p_points,
    streak = CASE 
      WHEN v_streak_increment < 0 THEN 1  -- Reset streak
      ELSE streak + v_streak_increment
    END,
    last_active = v_today
  WHERE id = p_user_id
  RETURNING points, streak INTO v_new_points, v_new_streak;
  
  -- Update problem solved count atomically
  UPDATE problems
  SET solved_count = solved_count + 1
  WHERE id = p_problem_id;
  
  -- Return success
  RETURN QUERY SELECT TRUE, TRUE, v_new_points, v_new_streak;
END;`n$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION award_points_for_solve(UUID, UUID, INTEGER) TO authenticated;

-- ============================================================================
-- FUNCTION: increment_user_streak
-- ============================================================================
-- Increments user streak based on last activity date
-- Handles streak continuation, reset, and daily activity tracking

CREATE OR REPLACE FUNCTION increment_user_streak(
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  new_streak INTEGER,
  streak_continued BOOLEAN,
  streak_reset BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $`nDECLARE
  v_last_active DATE;
  v_today DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
  v_streak_continued BOOLEAN := FALSE;
  v_streak_reset BOOLEAN := FALSE;
BEGIN
  -- Get today's date
  v_today := CURRENT_DATE;
  
  -- Get user's current streak and last active date
  SELECT last_active, streak 
  INTO v_last_active, v_current_streak
  FROM users
  WHERE id = p_user_id
  FOR UPDATE; -- Lock the row
  
  -- If user not found, return failure
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, FALSE, FALSE;
    RETURN;
  END IF;
  
  -- Determine streak action
  IF v_last_active IS NULL THEN
    -- First activity ever
    v_new_streak := 1;
    v_streak_continued := TRUE;
    
  ELSIF v_last_active = v_today THEN
    -- Already active today, no change
    v_new_streak := v_current_streak;
    
  ELSIF v_last_active = v_today - INTERVAL '1 day' THEN
    -- Active yesterday, continue streak
    v_new_streak := v_current_streak + 1;
    v_streak_continued := TRUE;
    
  ELSE
    -- Streak broken, reset to 1
    v_new_streak := 1;
    v_streak_reset := TRUE;
  END IF;
  
  -- Update user streak and last active date
  UPDATE users
  SET 
    streak = v_new_streak,
    last_active = v_today
  WHERE id = p_user_id;
  
  -- Return result
  RETURN QUERY SELECT TRUE, v_new_streak, v_streak_continued, v_streak_reset;
END;`n$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_user_streak(UUID) TO authenticated;

-- ============================================================================
-- FUNCTION: update_problem_solved_count
-- ============================================================================
-- Updates the solved count for a problem based on accepted submissions
-- Can be used for recalculation or correction

CREATE OR REPLACE FUNCTION update_problem_solved_count(
  p_problem_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  old_count INTEGER,
  new_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $`nDECLARE
  v_old_count INTEGER;
  v_new_count INTEGER;
BEGIN
  -- Get current solved count
  SELECT solved_count INTO v_old_count
  FROM problems
  WHERE id = p_problem_id
  FOR UPDATE; -- Lock the row
  
  -- If problem not found, return failure
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 0;
    RETURN;
  END IF;
  
  -- Calculate actual solved count from submissions
  SELECT COUNT(DISTINCT user_id) INTO v_new_count
  FROM submissions
  WHERE problem_id = p_problem_id
    AND status = 'accepted';
  
  -- Update problem solved count
  UPDATE problems
  SET solved_count = v_new_count
  WHERE id = p_problem_id;
  
  -- Return result
  RETURN QUERY SELECT TRUE, v_old_count, v_new_count;
END;`n$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_problem_solved_count(UUID) TO authenticated;

-- ============================================================================
-- FUNCTION: record_submission_with_points
-- ============================================================================
-- Records a submission and awards points atomically in a single transaction
-- Ensures data consistency between submissions and user stats

CREATE OR REPLACE FUNCTION record_submission_with_points(
  p_user_id UUID,
  p_problem_id UUID,
  p_contest_id UUID,
  p_language TEXT,
  p_code TEXT,
  p_status TEXT,
  p_execution_time NUMERIC,
  p_memory_used INTEGER,
  p_test_cases_passed INTEGER,
  p_total_test_cases INTEGER,
  p_points INTEGER
)
RETURNS TABLE (
  submission_id UUID,
  points_awarded BOOLEAN,
  is_first_solve BOOLEAN,
  new_points INTEGER,
  new_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $`nDECLARE
  v_submission_id UUID;
  v_award_result RECORD;
BEGIN
  -- Insert submission
  INSERT INTO submissions (
    user_id,
    problem_id,
    contest_id,
    language,
    code,
    status,
    execution_time,
    memory_used,
    test_cases_passed,
    total_test_cases
  ) VALUES (
    p_user_id,
    p_problem_id,
    p_contest_id,
    p_language,
    p_code,
    p_status,
    p_execution_time,
    p_memory_used,
    p_test_cases_passed,
    p_total_test_cases
  )
  RETURNING id INTO v_submission_id;
  
  -- If submission was accepted, award points
  IF p_status = 'accepted' THEN
    SELECT * INTO v_award_result
    FROM award_points_for_solve(p_user_id, p_problem_id, p_points);
    
    RETURN QUERY SELECT 
      v_submission_id,
      v_award_result.awarded,
      v_award_result.is_first_solve,
      v_award_result.new_points,
      v_award_result.new_streak;
  ELSE
    -- Get current user stats
    SELECT points, streak INTO v_award_result.new_points, v_award_result.new_streak
    FROM users
    WHERE id = p_user_id;
    
    RETURN QUERY SELECT 
      v_submission_id,
      FALSE,
      FALSE,
      v_award_result.new_points,
      v_award_result.new_streak;
  END IF;
END;`n$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION record_submission_with_points(
  UUID, UUID, UUID, TEXT, TEXT, TEXT, NUMERIC, INTEGER, INTEGER, INTEGER, INTEGER
) TO authenticated;

-- ============================================================================
-- FUNCTION: recalculate_user_stats
-- ============================================================================
-- Recalculates all user statistics from submissions
-- Useful for fixing inconsistencies or data migration

CREATE OR REPLACE FUNCTION recalculate_user_stats(
  p_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  total_submissions INTEGER,
  accepted_submissions INTEGER,
  total_points INTEGER,
  problems_solved INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $`nDECLARE
  v_total_submissions INTEGER;
  v_accepted_submissions INTEGER;
  v_total_points INTEGER;
  v_problems_solved INTEGER;
BEGIN
  -- Calculate total submissions
  SELECT COUNT(*) INTO v_total_submissions
  FROM submissions
  WHERE user_id = p_user_id;
  
  -- Calculate accepted submissions
  SELECT COUNT(*) INTO v_accepted_submissions
  FROM submissions
  WHERE user_id = p_user_id
    AND status = 'accepted';
  
  -- Calculate unique problems solved
  SELECT COUNT(DISTINCT problem_id) INTO v_problems_solved
  FROM submissions
  WHERE user_id = p_user_id
    AND status = 'accepted';
  
  -- Calculate total points (sum of problem points for first solves)
  SELECT COALESCE(SUM(p.points), 0) INTO v_total_points
  FROM (
    SELECT DISTINCT ON (problem_id) problem_id
    FROM submissions
    WHERE user_id = p_user_id
      AND status = 'accepted'
    ORDER BY problem_id, created_at ASC
  ) first_solves
  JOIN problems p ON p.id = first_solves.problem_id;
  
  -- Update user stats
  UPDATE users
  SET points = v_total_points
  WHERE id = p_user_id;
  
  -- Return result
  RETURN QUERY SELECT 
    TRUE,
    v_total_submissions,
    v_accepted_submissions,
    v_total_points,
    v_problems_solved;
END;`n$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION recalculate_user_stats(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To test award_points_for_solve:
-- SELECT * FROM award_points_for_solve(
--   'user-uuid'::UUID,
--   'problem-uuid'::UUID,
--   100
-- );

-- To test increment_user_streak:
-- SELECT * FROM increment_user_streak('user-uuid'::UUID);

-- To test update_problem_solved_count:
-- SELECT * FROM update_problem_solved_count('problem-uuid'::UUID);

-- To test recalculate_user_stats:
-- SELECT * FROM recalculate_user_stats('user-uuid'::UUID);

-- ============================================================================
-- NOTES
-- ============================================================================

-- All functions use SECURITY DEFINER to run with elevated privileges
-- This allows them to bypass RLS policies for atomic operations
-- All functions use FOR UPDATE to lock rows and prevent race conditions
-- All functions are granted to authenticated role for use by logged-in users
