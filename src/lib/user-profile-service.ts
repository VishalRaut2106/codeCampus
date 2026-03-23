import { createClient } from '@/lib/supabase/client'
import { ErrorHandler } from '@/lib/error-handler'
import { EmergencyBypass } from '@/lib/emergency-bypass'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: 'student' | 'admin' | 'super_admin'
  streak: number
  points: number
  badges: string[]
  approval_status: 'pending' | 'approved' | 'rejected'
  department?: string
  mobile_number?: string
  github_url?: string
  linkedin_url?: string
  instagram_url?: string
  portfolio_url?: string
  username?: string
  prn?: string
  bio?: string
  profile_visible?: boolean
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at?: string
  updated_at?: string
}

export class UserProfileService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    try {
      this.supabase = createClient()
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      throw new Error('Failed to initialize database connection')
    }
  }

  async createUserProfile(userId: string, userData: {
    name: string
    email: string
    role?: 'student' | 'admin' | 'super_admin'
    prn?: string
    department?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const insertData = {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'student',
        prn: userData.prn?.trim() || null,
        department: userData.department?.trim() || null,
        streak: 0,
        points: 0,
        badges: [],
        approval_status: 'pending'
      }

      console.log('=== DATABASE INSERT DEBUG ===')
      console.log('Inserting user profile with data:', insertData)
      console.log('PRN value being inserted:', userData.prn?.trim() || null)

      const { error } = await this.supabase
        .from('users')
        .insert(insertData)

      if (error) {
        // Handle specific error cases
        if (error.code === 'PGRST116' || error.message?.includes('relation "users" does not exist')) {
          console.log('Users table does not exist yet - database setup required')
          return { success: false, error: 'Database table not found. Please run the migration script.' }
        }

        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.log('User profile already exists')
          return { success: true } // Profile already exists, consider it successful
        }

        console.error('Error creating user profile:', error)
        return { success: false, error: error.message }
      }

      console.log('=== DATABASE INSERT SUCCESS ===')
      console.log('User profile created successfully')

      // Verify the data was saved correctly
      const { data: savedUser, error: fetchError } = await this.supabase
        .from('users')
        .select('id, name, email, prn, role, approval_status')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching saved user:', fetchError)
      } else {
        console.log('Saved user data:', savedUser)
        console.log('PRN in saved data:', savedUser?.prn)
      }

      return { success: true }
    } catch (error) {
      console.error('Profile creation failed:', error)
      return { success: false, error: 'Failed to create user profile' }
    }
  }

  private checkSupabaseClient(): boolean {
    try {
      if (!this.supabase) {
        console.error('Supabase client is not initialized')
        return false
      }

      // Test if the client has the required methods
      if (typeof this.supabase.from !== 'function') {
        console.error('Supabase client is not properly initialized')
        return false
      }

      // Test if the client can make basic calls
      try {
        // This will throw if the client is not properly configured
        const testQuery = this.supabase.from('users').select('count').limit(0)
        if (!testQuery) {
          console.error('Supabase client query builder not working')
          return false
        }
      } catch (queryError) {
        console.error('Supabase client query test failed:', queryError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking Supabase client:', error)
      return false
    }
  }

  async getUserProfile(userId: string): Promise<{ profile: UserProfile | null; error?: string }> {
    try {
      console.log('Fetching user profile for ID:', userId)

      // Check if Supabase client is properly initialized
      if (!this.checkSupabaseClient()) {
        return { profile: null, error: 'Database connection not available' }
      }

      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables')
        return { profile: null, error: 'Database configuration missing' }
      }

      // TEMPORARY: Try the query with better error handling
      let queryResult
      try {
        queryResult = await this.supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()
      } catch (queryError) {
        console.error('Query execution failed:', queryError)
        return {
          profile: null,
          error: 'Database query failed. Please run the RLS policy fix script in Supabase SQL Editor.'
        }
      }

      const { data, error } = queryResult

      if (error) {
        // Enhanced error handling for empty objects
        if (!error || Object.keys(error).length === 0) {
          console.error('Empty error object received - this indicates RLS policy issues')
          console.log('Attempting emergency bypass...')

          // Try emergency bypass
          const emergencyBypass = EmergencyBypass.getInstance()
          if (emergencyBypass.isEnabled()) {
            // Get user info from auth
            const { data: { user: authUser } } = await this.supabase.auth.getUser()
            if (authUser) {
              const emergencyResult = await emergencyBypass.getUserProfile(
                userId,
                authUser.email || '',
                authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'
              )
              if (emergencyResult.profile) {
                console.log('Emergency bypass successful')
                return { profile: emergencyResult.profile }
              }
            }
          }

          return {
            profile: null,
            error: 'Database policy error detected. Please run the RLS policy fix script in Supabase SQL Editor.'
          }
        }

        // Check for specific RLS policy errors
        if (error.message?.includes('infinite recursion') || error.code === '42P17') {
          console.error('RLS infinite recursion detected - RLS policies need to be fixed')

          return {
            profile: null,
            error: 'RLS policy infinite recursion detected. Please run the IMMEDIATE_RLS_FIX.sql script in Supabase SQL Editor to fix this issue.'
          }
        }

        // Use the comprehensive error handler only for non-empty errors
        if (error.message || error.code) {
          const errorInfo = ErrorHandler.logError(error, 'getUserProfile', userId)
          const userMessage = ErrorHandler.getErrorMessage(error, 'getUserProfile')
          return { profile: null, error: userMessage }
        } else {
          // Handle empty error objects - don't pass to error handler
          console.error('Empty error object - RLS policy infinite recursion detected')
          console.error('Fix steps:')
          console.error('1. Go to Supabase Dashboard → SQL Editor')
          console.error('2. Copy and paste EMERGENCY_RLS_FIX.sql')
          console.error('3. Run the script and wait for success')
          console.error('4. Refresh the application')

          return {
            profile: null,
            error: 'RLS policy infinite recursion detected. Please run the EMERGENCY_RLS_FIX.sql script in Supabase SQL Editor.'
          }
        }
      }

      console.log('User profile fetched successfully:', data)
      return { profile: data as UserProfile }
    } catch (error) {
      console.error('Profile fetch failed with exception:', error)
      return { profile: null, error: error instanceof Error ? error.message : 'Failed to fetch user profile' }
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) {
        console.error('Error updating user profile:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Profile update failed:', error)
      return { success: false, error: 'Failed to update user profile' }
    }
  }

  async ensureUserProfile(userId: string, userData: {
    name: string
    email: string
    role?: 'student' | 'admin'
    prn?: string
    department?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // First, check if profile exists
      const { profile, error: fetchError } = await this.getUserProfile(userId)

      if (profile) {
        // Profile exists, no need to create
        return { success: true }
      }

      // Handle database table not found
      if (fetchError && fetchError.includes('Database table not found')) {
        console.log('Database table not found - skipping profile creation')
        return { success: false, error: 'Database setup required. Please run the migration script.' }
      }

      if (fetchError && !fetchError.includes('Profile not found')) {
        // There was a real error, not just "no rows found"
        return { success: false, error: fetchError }
      }

      // Profile doesn't exist, create it
      return await this.createUserProfile(userId, userData)
    } catch (error) {
      console.error('Ensure profile failed:', error)
      return { success: false, error: 'Failed to ensure user profile' }
    }
  }
}

export const userProfileService = new UserProfileService()
