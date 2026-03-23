/**
 * Client-side badges service
 * Safe for use in client components
 */

import { createClient } from '@/lib/supabase/client'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  requirements: {
    type: string
    value: number
  }
}

export class ClientBadgeService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Get all available badges
   */
  async getAvailableBadges(): Promise<{
    success: boolean
    data?: Badge[]
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase
        .from('badges')
        .select('*')
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch badges: ${error.message}`)
      }

      return {
        success: true,
        data: data || []
      }

    } catch (error) {
      console.error('Error fetching badges:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId: string): Promise<{
    success: boolean
    data?: string[]
    error?: string
  }> {
    try {
      const { data: userProfile, error } = await this.supabase
        .from('users')
        .select('badges')
        .eq('id', userId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch user badges: ${error.message}`)
      }

      return {
        success: true,
        data: userProfile?.badges || []
      }

    } catch (error) {
      console.error('Error fetching user badges:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Award a badge to a user
   */
  async awardBadge(userId: string, badgeId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // Get current badges
      const { data: userProfile, error: fetchError } = await this.supabase
        .from('users')
        .select('badges')
        .eq('id', userId)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch user profile: ${fetchError.message}`)
      }

      const currentBadges = userProfile?.badges || []
      
      // Add new badge if not already earned
      if (!currentBadges.includes(badgeId)) {
        const updatedBadges = [...currentBadges, badgeId]
        
        const { error: updateError } = await this.supabase
          .from('users')
          .update({ badges: updatedBadges })
          .eq('id', userId)

        if (updateError) {
          throw new Error(`Failed to update user badges: ${updateError.message}`)
        }
      }

      return { success: true }

    } catch (error) {
      console.error('Error awarding badge:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}
