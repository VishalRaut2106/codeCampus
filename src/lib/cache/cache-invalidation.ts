/**
 * Cache Invalidation Strategies
 * Handles cache invalidation based on data changes
 * Requirements: 5.3
 */

import cacheManager from './cache-manager'

/**
 * Cache invalidation strategies for different data types
 */
export class CacheInvalidationService {
  /**
   * Invalidate user-related caches
   * Called when user profile is updated
   */
  async invalidateUserCache(userId: string): Promise<void> {
    await Promise.all([
      // Invalidate specific user cache
      cacheManager.invalidate(`user:${userId}`),
      cacheManager.invalidate(`user:profile:${userId}`),
      
      // Invalidate dashboard cache (contains user stats)
      cacheManager.invalidate('dashboard:all'),
      
      // Invalidate leaderboard cache (user points may have changed)
      cacheManager.invalidatePattern('leaderboard:*'),
    ])
  }

  /**
   * Invalidate leaderboard caches
   * Called when user points change
   */
  async invalidateLeaderboardCache(): Promise<void> {
    await Promise.all([
      // Invalidate all leaderboard variations
      cacheManager.invalidatePattern('leaderboard:*'),
      
      // Invalidate dashboard cache (contains leaderboard data)
      cacheManager.invalidate('dashboard:all'),
    ])
  }

  /**
   * Invalidate problem-related caches
   * Called when problem is updated
   */
  async invalidateProblemCache(problemId: string): Promise<void> {
    await Promise.all([
      // Invalidate specific problem cache
      cacheManager.invalidate(`problem:${problemId}`),
      cacheManager.invalidate(`problem:testcases:${problemId}`),
      
      // Invalidate problem list cache
      cacheManager.invalidatePattern('problems:*'),
      
      // Invalidate dashboard cache (contains problem stats)
      cacheManager.invalidate('dashboard:all'),
    ])
  }

  /**
   * Invalidate contest-related caches
   * Called when contest is updated
   */
  async invalidateContestCache(contestId: string): Promise<void> {
    await Promise.all([
      // Invalidate specific contest cache
      cacheManager.invalidate(`contest:${contestId}`),
      cacheManager.invalidate(`contest:leaderboard:${contestId}`),
      cacheManager.invalidate(`contest:problems:${contestId}`),
      
      // Invalidate contest list cache
      cacheManager.invalidatePattern('contests:*'),
      
      // Invalidate dashboard cache (contains contest stats)
      cacheManager.invalidate('dashboard:all'),
    ])
  }

  /**
   * Invalidate submission-related caches
   * Called when submission is created
   */
  async invalidateSubmissionCache(userId: string, problemId: string): Promise<void> {
    await Promise.all([
      // Invalidate user submission history
      cacheManager.invalidate(`submissions:user:${userId}`),
      
      // Invalidate problem submission stats
      cacheManager.invalidate(`submissions:problem:${problemId}`),
      
      // Invalidate dashboard cache (contains submission stats)
      cacheManager.invalidate('dashboard:all'),
    ])
  }

  /**
   * Invalidate all caches
   * Use sparingly - only for major data changes
   */
  async invalidateAll(): Promise<void> {
    cacheManager.clear()
  }

  /**
   * Invalidate dashboard-specific caches
   */
  async invalidateDashboardCache(): Promise<void> {
    await cacheManager.invalidate('dashboard:all')
  }
}

// Singleton instance
const cacheInvalidationService = new CacheInvalidationService()

export default cacheInvalidationService

/**
 * Helper functions for common invalidation patterns
 */

export async function invalidateOnProfileUpdate(userId: string): Promise<void> {
  await cacheInvalidationService.invalidateUserCache(userId)
}

export async function invalidateOnPointsChange(userId: string): Promise<void> {
  await Promise.all([
    cacheInvalidationService.invalidateUserCache(userId),
    cacheInvalidationService.invalidateLeaderboardCache(),
  ])
}

export async function invalidateOnProblemUpdate(problemId: string): Promise<void> {
  await cacheInvalidationService.invalidateProblemCache(problemId)
}

export async function invalidateOnContestUpdate(contestId: string): Promise<void> {
  await cacheInvalidationService.invalidateContestCache(contestId)
}

export async function invalidateOnSubmission(
  userId: string,
  problemId: string
): Promise<void> {
  await Promise.all([
    cacheInvalidationService.invalidateSubmissionCache(userId, problemId),
    cacheInvalidationService.invalidateUserCache(userId),
  ])
}
