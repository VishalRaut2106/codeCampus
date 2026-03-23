/**
 * Atomic Database Operations
 * 
 * This module provides TypeScript wrappers for atomic database functions.
 * These functions ensure data consistency and handle race conditions properly.
 * 
 * Requirements: 6.8, 9.4
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AwardPointsResult {
  awarded: boolean;
  is_first_solve: boolean;
  new_points: number;
  new_streak: number;
}

export interface IncrementStreakResult {
  success: boolean;
  new_streak: number;
  streak_continued: boolean;
  streak_reset: boolean;
}

export interface UpdateSolvedCountResult {
  success: boolean;
  old_count: number;
  new_count: number;
}

export interface RecordSubmissionResult {
  submission_id: string;
  points_awarded: boolean;
  is_first_solve: boolean;
  new_points: number;
  new_streak: number;
}

export interface RecalculateStatsResult {
  success: boolean;
  total_submissions: number;
  accepted_submissions: number;
  total_points: number;
  problems_solved: number;
}

// ============================================================================
// ATOMIC OPERATIONS
// ============================================================================

/**
 * Award points to a user for solving a problem (first solve only)
 * 
 * This function:
 * - Checks if this is the user's first solve for the problem
 * - Awards points only on first solve
 * - Updates user streak based on activity
 * - Updates problem solved count
 * - Handles race conditions with proper locking
 * 
 * @param supabase - Supabase client (preferably service role for admin operations)
 * @param userId - User ID
 * @param problemId - Problem ID
 * @param points - Points to award
 * @returns Award result with updated stats
 */
export async function awardPointsForSolve(
  supabase: SupabaseClient,
  userId: string,
  problemId: string,
  points: number
): Promise<AwardPointsResult> {
  const { data, error } = await supabase.rpc('award_points_for_solve', {
    p_user_id: userId,
    p_problem_id: problemId,
    p_points: points,
  });

  if (error) {
    console.error('Error awarding points:', error);
    throw new Error(`Failed to award points: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No result returned from award_points_for_solve');
  }

  return data[0];
}

/**
 * Increment user streak based on activity
 * 
 * This function:
 * - Checks user's last activity date
 * - Continues streak if active yesterday
 * - Resets streak if gap > 1 day
 * - No change if already active today
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Streak update result
 */
export async function incrementUserStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<IncrementStreakResult> {
  const { data, error } = await supabase.rpc('increment_user_streak', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error incrementing streak:', error);
    throw new Error(`Failed to increment streak: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No result returned from increment_user_streak');
  }

  return data[0];
}

/**
 * Update problem solved count based on accepted submissions
 * 
 * This function:
 * - Counts unique users with accepted submissions
 * - Updates the problem's solved_count field
 * - Returns old and new counts for verification
 * 
 * @param supabase - Supabase client
 * @param problemId - Problem ID
 * @returns Update result with old and new counts
 */
export async function updateProblemSolvedCount(
  supabase: SupabaseClient,
  problemId: string
): Promise<UpdateSolvedCountResult> {
  const { data, error } = await supabase.rpc('update_problem_solved_count', {
    p_problem_id: problemId,
  });

  if (error) {
    console.error('Error updating solved count:', error);
    throw new Error(`Failed to update solved count: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No result returned from update_problem_solved_count');
  }

  return data[0];
}

/**
 * Record a submission and award points atomically
 * 
 * This function:
 * - Inserts the submission record
 * - Awards points if status is 'accepted'
 * - Updates user stats atomically
 * - All in a single database transaction
 * 
 * @param supabase - Supabase client
 * @param params - Submission parameters
 * @returns Submission result with point award status
 */
export async function recordSubmissionWithPoints(
  supabase: SupabaseClient,
  params: {
    userId: string;
    problemId: string;
    contestId?: string | null;
    language: string;
    code: string;
    status: string;
    executionTime: number;
    memoryUsed: number;
    testCasesPassed: number;
    totalTestCases: number;
    points: number;
  }
): Promise<RecordSubmissionResult> {
  const { data, error } = await supabase.rpc('record_submission_with_points', {
    p_user_id: params.userId,
    p_problem_id: params.problemId,
    p_contest_id: params.contestId || null,
    p_language: params.language,
    p_code: params.code,
    p_status: params.status,
    p_execution_time: params.executionTime,
    p_memory_used: params.memoryUsed,
    p_test_cases_passed: params.testCasesPassed,
    p_total_test_cases: params.totalTestCases,
    p_points: params.points,
  });

  if (error) {
    console.error('Error recording submission:', error);
    throw new Error(`Failed to record submission: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No result returned from record_submission_with_points');
  }

  return data[0];
}

/**
 * Recalculate all user statistics from submissions
 * 
 * This function:
 * - Counts total and accepted submissions
 * - Calculates unique problems solved
 * - Recalculates total points from first solves
 * - Updates user record with correct values
 * 
 * Useful for:
 * - Fixing data inconsistencies
 * - Data migration
 * - Manual corrections
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Recalculated statistics
 */
export async function recalculateUserStats(
  supabase: SupabaseClient,
  userId: string
): Promise<RecalculateStatsResult> {
  const { data, error } = await supabase.rpc('recalculate_user_stats', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error recalculating stats:', error);
    throw new Error(`Failed to recalculate stats: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error('No result returned from recalculate_user_stats');
  }

  return data[0];
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Recalculate statistics for multiple users
 * 
 * @param supabase - Supabase client
 * @param userIds - Array of user IDs
 * @returns Array of recalculation results
 */
export async function recalculateMultipleUserStats(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<RecalculateStatsResult[]> {
  const results: RecalculateStatsResult[] = [];

  for (const userId of userIds) {
    try {
      const result = await recalculateUserStats(supabase, userId);
      results.push(result);
    } catch (error) {
      console.error(`Error recalculating stats for user ${userId}:`, error);
      // Continue with other users
    }
  }

  return results;
}

/**
 * Update solved counts for multiple problems
 * 
 * @param supabase - Supabase client
 * @param problemIds - Array of problem IDs
 * @returns Array of update results
 */
export async function updateMultipleProblemSolvedCounts(
  supabase: SupabaseClient,
  problemIds: string[]
): Promise<UpdateSolvedCountResult[]> {
  const results: UpdateSolvedCountResult[] = [];

  for (const problemId of problemIds) {
    try {
      const result = await updateProblemSolvedCount(supabase, problemId);
      results.push(result);
    } catch (error) {
      console.error(`Error updating solved count for problem ${problemId}:`, error);
      // Continue with other problems
    }
  }

  return results;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user has already solved a problem
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param problemId - Problem ID
 * @returns True if user has an accepted submission for this problem
 */
export async function hasUserSolvedProblem(
  supabase: SupabaseClient,
  userId: string,
  problemId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', userId)
    .eq('problem_id', problemId)
    .eq('status', 'accepted')
    .limit(1);

  if (error) {
    console.error('Error checking if problem solved:', error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Get user's current streak
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Current streak value
 */
export async function getUserStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('users')
    .select('streak')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error getting user streak:', error);
    return 0;
  }

  return data?.streak || 0;
}

/**
 * Get problem's current solved count
 * 
 * @param supabase - Supabase client
 * @param problemId - Problem ID
 * @returns Current solved count
 */
export async function getProblemSolvedCount(
  supabase: SupabaseClient,
  problemId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('problems')
    .select('solved_count')
    .eq('id', problemId)
    .single();

  if (error) {
    console.error('Error getting problem solved count:', error);
    return 0;
  }

  return data?.solved_count || 0;
}
