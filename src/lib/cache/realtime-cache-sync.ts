/**
 * Real-time Cache Synchronization
 * Uses Supabase real-time subscriptions to trigger cache invalidation
 * Requirements: 5.3
 */

import { createClient } from '@/lib/supabase/client'
import cacheInvalidationService from './cache-invalidation'
import type { RealtimeChannel } from '@supabase/supabase-js'

class RealtimeCacheSync {
  private channels: Map<string, RealtimeChannel> = new Map()
  private isInitialized = false

  /**
   * Initialize real-time subscriptions for cache invalidation
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Real-time cache sync already initialized')
      return
    }

    const supabase = createClient()

    // Subscribe to user updates
    const usersChannel = supabase
      .channel('cache-sync-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
        },
        async (payload) => {
          console.log('User change detected, invalidating cache:', payload)
          
          if (payload.new && 'id' in payload.new) {
            await cacheInvalidationService.invalidateUserCache(
              payload.new.id as string
            )
          }
          
          // If points changed, invalidate leaderboard
          if (
            payload.old &&
            payload.new &&
            'points' in payload.old &&
            'points' in payload.new &&
            payload.old.points !== payload.new.points
          ) {
            await cacheInvalidationService.invalidateLeaderboardCache()
          }
        }
      )
      .subscribe()

    this.channels.set('users', usersChannel)

    // Subscribe to problem updates
    const problemsChannel = supabase
      .channel('cache-sync-problems')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'problems',
        },
        async (payload) => {
          console.log('Problem change detected, invalidating cache:', payload)
          
          if (payload.new && 'id' in payload.new) {
            await cacheInvalidationService.invalidateProblemCache(
              payload.new.id as string
            )
          }
        }
      )
      .subscribe()

    this.channels.set('problems', problemsChannel)

    // Subscribe to contest updates
    const contestsChannel = supabase
      .channel('cache-sync-contests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contests',
        },
        async (payload) => {
          console.log('Contest change detected, invalidating cache:', payload)
          
          if (payload.new && 'id' in payload.new) {
            await cacheInvalidationService.invalidateContestCache(
              payload.new.id as string
            )
          }
        }
      )
      .subscribe()

    this.channels.set('contests', contestsChannel)

    // Subscribe to submission updates
    const submissionsChannel = supabase
      .channel('cache-sync-submissions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions',
        },
        async (payload) => {
          console.log('Submission created, invalidating cache:', payload)
          
          if (
            payload.new &&
            'user_id' in payload.new &&
            'problem_id' in payload.new
          ) {
            await cacheInvalidationService.invalidateSubmissionCache(
              payload.new.user_id as string,
              payload.new.problem_id as string
            )
          }
        }
      )
      .subscribe()

    this.channels.set('submissions', submissionsChannel)

    this.isInitialized = true
    console.log('Real-time cache sync initialized')
  }

  /**
   * Cleanup all subscriptions
   */
  async cleanup(): Promise<void> {
    const supabase = createClient()
    
    for (const [name, channel] of this.channels.entries()) {
      await supabase.removeChannel(channel)
      console.log(`Unsubscribed from ${name} channel`)
    }
    
    this.channels.clear()
    this.isInitialized = false
    console.log('Real-time cache sync cleaned up')
  }

  /**
   * Check if real-time sync is active
   */
  isActive(): boolean {
    return this.isInitialized
  }

  /**
   * Get active channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}

// Singleton instance
const realtimeCacheSync = new RealtimeCacheSync()

export default realtimeCacheSync

/**
 * Hook to initialize real-time cache sync in React components
 */
export function useRealtimeCacheSync() {
  if (typeof window !== 'undefined' && !realtimeCacheSync.isActive()) {
    realtimeCacheSync.initialize().catch((error) => {
      console.error('Failed to initialize real-time cache sync:', error)
    })
  }

  return {
    isActive: realtimeCacheSync.isActive(),
    cleanup: () => realtimeCacheSync.cleanup(),
    channels: realtimeCacheSync.getActiveChannels(),
  }
}
