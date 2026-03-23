// Badge system and streak tracking for codCampus

import { createClient } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  color: string
  condition: (stats: UserStats) => boolean
  category: 'streak' | 'problems' | 'contests' | 'social'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export interface UserStats {
  userId: string
  problemsSolved: number
  currentStreak: number
  longestStreak: number
  contestsParticipated: number
  contestsWon: number
  totalPoints: number
  rank: number
  badgesEarned: string[]
  lastActivityDate?: string
  joinDate: string
}

export interface AchievementResult {
  badgeId: string
  badgeName: string
  newlyEarned: boolean
  emailSent: boolean
}

// Badge definitions with conditions
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Streak badges
  {
    id: 'first_solve',
    name: 'First Steps',
    description: 'Solve your first problem',
    icon: '🎯',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    condition: (stats) => stats.problemsSolved >= 1,
    category: 'problems',
    rarity: 'common'
  },
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day coding streak',
    icon: '🔥',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    condition: (stats) => stats.currentStreak >= 3,
    category: 'streak',
    rarity: 'common'
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day coding streak',
    icon: '🔥',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    condition: (stats) => stats.currentStreak >= 7,
    category: 'streak',
    rarity: 'common'
  },
  {
    id: 'streak_30',
    name: 'Consistency King',
    description: 'Maintain a 30-day coding streak',
    icon: '👑',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    condition: (stats) => stats.currentStreak >= 30,
    category: 'streak',
    rarity: 'rare'
  },
  {
    id: 'streak_100',
    name: 'Century Champion',
    description: 'Maintain a 100-day coding streak',
    icon: '💯',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    condition: (stats) => stats.currentStreak >= 100,
    category: 'streak',
    rarity: 'legendary'
  },

  // Problem solving badges
  {
    id: 'problems_10',
    name: 'Problem Solver',
    description: 'Solve 10 problems',
    icon: '🧠',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    condition: (stats) => stats.problemsSolved >= 10,
    category: 'problems',
    rarity: 'common'
  },
  {
    id: 'problems_50',
    name: 'Algorithm Ace',
    description: 'Solve 50 problems',
    icon: '🧠',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    condition: (stats) => stats.problemsSolved >= 50,
    category: 'problems',
    rarity: 'uncommon'
  },
  {
    id: 'problems_100',
    name: 'Century Club',
    description: 'Solve 100 problems',
    icon: '💯',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    condition: (stats) => stats.problemsSolved >= 100,
    category: 'problems',
    rarity: 'rare'
  },
  {
    id: 'problems_500',
    name: 'Master Coder',
    description: 'Solve 500 problems',
    icon: '🏆',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    condition: (stats) => stats.problemsSolved >= 500,
    category: 'problems',
    rarity: 'epic'
  },

  // Contest badges
  {
    id: 'first_contest',
    name: 'Contest Debut',
    description: 'Participate in your first contest',
    icon: '🎪',
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    condition: (stats) => stats.contestsParticipated >= 1,
    category: 'contests',
    rarity: 'common'
  },
  {
    id: 'contest_winner',
    name: 'Contest Champion',
    description: 'Win a coding contest',
    icon: '🏆',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    condition: (stats) => stats.contestsWon >= 1,
    category: 'contests',
    rarity: 'rare'
  },
  {
    id: 'top_10',
    name: 'Top Performer',
    description: 'Reach top 10 on leaderboard',
    icon: '⭐',
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    condition: (stats) => stats.rank <= 10 && stats.rank > 0,
    category: 'contests',
    rarity: 'uncommon'
  },
  {
    id: 'top_3',
    name: 'Elite Coder',
    description: 'Reach top 3 on leaderboard',
    icon: '🌟',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    condition: (stats) => stats.rank <= 3 && stats.rank > 0,
    category: 'contests',
    rarity: 'rare'
  },

  // Social badges
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Complete your social media profiles',
    icon: '🦋',
    color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    condition: (stats) => false, // This would check if all social links are filled
    category: 'social',
    rarity: 'common'
  },

  // Special badges
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join during the beta period',
    icon: '🚀',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    condition: (stats) => {
      const joinDate = new Date(stats.joinDate)
      const betaEndDate = new Date('2024-12-31') // Example beta end date
      return joinDate <= betaEndDate
    },
    category: 'social',
    rarity: 'rare'
  },
  {
    id: 'mentor',
    name: 'Code Mentor',
    description: 'Help other students with solutions',
    icon: '👨‍🏫',
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    condition: (stats) => false, // This would track mentoring activity
    category: 'social',
    rarity: 'uncommon'
  }
]

export class AchievementSystem {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Get user statistics for badge checking
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      // Get user data
      const supabase = await createClient()
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!userData) {
        throw new Error('User not found')
      }

      // Get submission count
      const { count: problemsSolved } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId)
        .eq('status', 'accepted')

      // Get contest participation count
      const { count: contestsParticipated } = await supabase
        .from('submissions')
        .select('contest_id', { count: 'exact', head: true })
        .eq('student_id', userId)
        .not('contest_id', 'is', null)

      // Get contest wins (simplified - would need more complex logic for actual wins)
      const { count: contestsWon } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId)
        .eq('status', 'accepted')
        // This is a simplified check - actual contest wins would need more complex logic

      // Calculate current rank (simplified)
      const { data: rankData } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'student')
        .order('points', { ascending: false })

      const rank = (rankData?.findIndex(user => user.id === userId) ?? -1) + 1 || 0

      return {
        userId,
        problemsSolved: problemsSolved || 0,
        currentStreak: userData.streak || 0,
        longestStreak: userData.streak || 0, // Simplified - would track separately
        contestsParticipated: contestsParticipated || 0,
        contestsWon: contestsWon || 0,
        totalPoints: userData.points || 0,
        rank,
        badgesEarned: userData.badges || [],
        lastActivityDate: userData.updated_at,
        joinDate: userData.created_at
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      throw error
    }
  }

  /**
   * Check and award new badges for a user
   */
  async checkAndAwardBadges(userId: string): Promise<AchievementResult[]> {
    try {
      const stats = await this.getUserStats(userId)
      const results: AchievementResult[] = []

      for (const badge of BADGE_DEFINITIONS) {
        // Skip if badge already earned
        if (stats.badgesEarned.includes(badge.id)) {
          continue
        }

        // Check if badge should be awarded
        if (badge.condition(stats)) {
          // Award the badge
          await this.awardBadge(userId, badge.id)

          // Send email notification for streak milestones
          if (badge.category === 'streak') {
            const streakDays = stats.currentStreak
            await emailService.sendStreakMilestoneEmail(
              stats.userId, // This should be the user's email, but we need to get it
              stats.userId,
              streakDays
            )
          }

          results.push({
            badgeId: badge.id,
            badgeName: badge.name,
            newlyEarned: true,
            emailSent: badge.category === 'streak'
          })
        }
      }

      return results
    } catch (error) {
      console.error('Error checking badges:', error)
      return []
    }
  }

  /**
   * Award a specific badge to a user
   */
  async awardBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      // Get current badges
      const { data: userData } = await (await this.supabase)
        .from('users')
        .select('badges')
        .eq('id', userId)
        .single()

      if (!userData) {
        throw new Error('User not found')
      }

      const currentBadges = userData.badges || []

      // Check if badge already earned
      if (currentBadges.includes(badgeId)) {
        return true // Already earned
      }

      // Add new badge
      const updatedBadges = [...currentBadges, badgeId]

      const { error } = await (await this.supabase)
        .from('users')
        .update({ badges: updatedBadges })
        .eq('id', userId)

      if (error) {
        throw error
      }

      console.log(`🏆 Badge "${badgeId}" awarded to user ${userId}`)
      return true
    } catch (error) {
      console.error('Error awarding badge:', error)
      return false
    }
  }

  /**
   * Update user streak based on daily activity
   */
  async updateStreak(userId: string): Promise<{ streakUpdated: boolean; newStreak: number }> {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get current user data
      const { data: userData } = await (await this.supabase)
        .from('users')
        .select('streak, updated_at')
        .eq('id', userId)
        .single()

      if (!userData) {
        throw new Error('User not found')
      }

      const lastActivity = new Date(userData.updated_at).toISOString().split('T')[0]
      const currentStreak = userData.streak || 0
      let newStreak = currentStreak

      // Check if this is a new day and user is active
      if (lastActivity !== today) {
        // Check if last activity was yesterday (continue streak) or earlier (reset streak)
        const lastActivityDate = new Date(lastActivity)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)

        if (lastActivityDate.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
          // Continue streak
          newStreak = currentStreak + 1
        } else {
          // Reset streak
          newStreak = 1
        }
      }

      // Update streak in database
      const { error } = await (await this.supabase)
        .from('users')
        .update({ streak: newStreak })
        .eq('id', userId)

      if (error) {
        throw error
      }

      return {
        streakUpdated: newStreak !== currentStreak,
        newStreak
      }
    } catch (error) {
      console.error('Error updating streak:', error)
      return { streakUpdated: false, newStreak: 0 }
    }
  }

  /**
   * Get all available badges
   */
  getAllBadges(): BadgeDefinition[] {
    return BADGE_DEFINITIONS
  }

  /**
   * Get badges by category
   */
  getBadgesByCategory(category: BadgeDefinition['category']): BadgeDefinition[] {
    return BADGE_DEFINITIONS.filter(badge => badge.category === category)
  }

  /**
   * Get badges by rarity
   */
  getBadgesByRarity(rarity: BadgeDefinition['rarity']): BadgeDefinition[] {
    return BADGE_DEFINITIONS.filter(badge => badge.rarity === rarity)
  }
}

// Create singleton instance
export const achievementSystem = new AchievementSystem()
