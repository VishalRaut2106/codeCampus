/**
 * Production User Service
 * Secure, maintainable, and production-ready user management
 */

import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'student' | 'admin'
  prn?: string
  streak: number
  points: number
  badges: any[]
  approval_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  name: string
  email: string
  role?: 'student' | 'admin'
  prn?: string
}

export class ProductionUserService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Create user profile with comprehensive error handling
   */
  async createUserProfile(userId: string, userData: CreateUserData): Promise<{
    success: boolean
    error?: string
    data?: UserProfile
  }> {
    try {
      // Validate input data
      if (!userId || !userData.name || !userData.email) {
        return {
          success: false,
          error: 'Missing required fields: userId, name, and email are required'
        }
      }

      // Check if user already exists
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (existingUser) {
        return {
          success: false,
          error: 'User profile already exists'
        }
      }

      if (checkError && checkError.code !== 'PGRST116') {
        throw new Error(`Database error: ${checkError.message}`)
      }

      // Create user profile
      const insertData = {
        id: userId,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        role: userData.role || 'student',
        prn: userData.prn?.trim() || null,
        streak: 0,
        points: 0,
        badges: [],
        approval_status: 'pending' as const
      }

      const { data, error } = await this.supabase
        .from('users')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        // Handle specific error cases
        if (error.code === '23505') {
          return {
            success: false,
            error: 'User profile already exists'
          }
        }
        
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Database table not found. Please run the database setup script.'
          }
        }

        throw new Error(`Database error: ${error.message}`)
      }

      return {
        success: true,
        data
      }

    } catch (error) {
      console.error('Production user service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get user profile with comprehensive error handling
   */
  async getUserProfile(userId: string): Promise<{
    success: boolean
    data?: UserProfile
    error?: string
  }> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        }
      }

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Database table not found. Please run the database setup script.'
          }
        }

        if (error.code === 'PGRST116' || error.message?.includes('No rows returned')) {
          return {
            success: false,
            error: 'User profile not found'
          }
        }

        throw new Error(`Database error: ${error.message}`)
      }

      return {
        success: true,
        data
      }

    } catch (error) {
      console.error('Error fetching user profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<CreateUserData>): Promise<{
    success: boolean
    data?: UserProfile
    error?: string
  }> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        }
      }

      // Prepare update data
      const updateData: any = {}
      
      if (updates.name) updateData.name = updates.name.trim()
      if (updates.email) updateData.email = updates.email.toLowerCase().trim()
      if (updates.role) updateData.role = updates.role
      if (updates.prn !== undefined) updateData.prn = updates.prn?.trim() || null

      if (Object.keys(updateData).length === 0) {
        return {
          success: false,
          error: 'No valid fields to update'
        }
      }

      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      return {
        success: true,
        data
      }

    } catch (error) {
      console.error('Error updating user profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Ensure user profile exists (create if not exists)
   */
  async ensureUserProfile(userId: string, userData: CreateUserData): Promise<{
    success: boolean
    data?: UserProfile
    error?: string
  }> {
    try {
      // First, try to get existing profile
      const existingProfile = await this.getUserProfile(userId)
      
      if (existingProfile.success) {
        return existingProfile
      }

      // If profile doesn't exist, create it
      return await this.createUserProfile(userId, userData)

    } catch (error) {
      console.error('Error ensuring user profile:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}
