import { createClient } from '@/lib/supabase/client'

export interface SimpleUserProfile {
  id: string
  name: string
  email: string
  username?: string
  prn?: string
  role: 'student' | 'admin'
  streak: number
  points: number
  badges: string[]
  approval_status: 'pending' | 'approved' | 'rejected'
  department?: string
  mobile_number?: string
  bio?: string
  profile_visible?: boolean
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
}

export class SimpleUserService {
  private supabase = createClient()

  private generateUsername(name: string, email: string): string {
    // Get first letters of name
    const nameLetters = name.split(' ').map(n => n.charAt(0).toLowerCase()).join('')
    // Get first 3 letters of email before @
    const emailLetters = email.split('@')[0].substring(0, 3).toLowerCase()
    // Combine and add timestamp for uniqueness
    const timestamp = Date.now().toString().slice(-4)
    return `${nameLetters}${emailLetters}${timestamp}`
  }

  async createUserProfile(userId: string, userData: {
    name: string
    email: string
    role?: 'student' | 'admin'
    prn?: string
    department?: string
  }): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('=== CREATING USER PROFILE ===')
      console.log('User ID:', userId)
      console.log('User Data:', userData)
      
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await this.supabase
        .from('users')
        .select('id, name, email, prn, department, approval_status')
        .eq('id', userId)
        .single()
      
      if (existingProfile && !checkError) {
        console.log('Profile already exists:', existingProfile)
        return { 
          success: true, 
          details: { message: 'Profile already exists', profile: existingProfile }
        }
      }
      
      // Try using the critical database function first
      console.log('Trying critical database function...')
      try {
        const { data: functionResult, error: functionError } = await this.supabase
          .rpc('create_user_profile_critical', {
            user_id: userId,
            user_name: userData.name,
            user_email: userData.email,
            user_prn: userData.prn?.trim() || null,
            user_department: userData.department?.trim() || null
          })
        
        if (functionResult && !functionError) {
          console.log('Profile created via critical database function:', functionResult)
          return { success: true, details: functionResult }
        }
        
        console.log('Critical database function failed:', functionError?.message)
      } catch (funcError) {
        console.log('Critical database function not available:', funcError)
      }
      
      // Fallback to direct insert
      console.log('Using direct insert...')
      const username = this.generateUsername(userData.name, userData.email)
      
      const profileData = {
        id: userId,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        username: username,
        prn: userData.prn?.trim() || null,
        department: userData.department?.trim() || null,
        role: userData.role || 'student',
        streak: 0,
        points: 0,
        badges: [],
        approval_status: 'pending',
        profile_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Inserting profile data:', profileData)
      
      const { data: newProfile, error: insertError } = await this.supabase
        .from('users')
        .insert(profileData)
        .select()
        .single()
      
      if (insertError) {
        console.error('Direct insert failed:', insertError)
        
        // Handle duplicate key error
        if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
          console.log('Profile already exists (duplicate key)')
          return { success: true, details: { message: 'Profile already exists' } }
        }
        
        // Try API endpoint as final fallback
        console.log('Trying API endpoint as final fallback...')
        try {
          const apiResponse = await fetch('/api/create-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              name: userData.name,
              email: userData.email,
              prn: userData.prn,
              department: userData.department,
              role: userData.role || 'student'
            })
          })
          
          if (!apiResponse.ok) {
            throw new Error(`API response not ok: ${apiResponse.status}`)
          }
          
          const apiResult = await apiResponse.json()
          
          if (apiResult.success) {
            console.log('Profile created via API endpoint:', apiResult)
            return { success: true, details: apiResult }
          } else {
            console.error('API endpoint failed:', apiResult.error)
            return {
              success: false,
              error: `All methods failed. Last error: ${apiResult.error}`,
              details: { insertError, apiResult }
            }
          }
        } catch (apiError) {
          console.error('API endpoint exception:', apiError)
          return {
            success: false,
            error: `All methods failed. Insert error: ${insertError.message}, API error: ${apiError instanceof Error ? apiError.message : 'Unknown'}`,
            details: { insertError, apiError }
          }
        }
      }
      
      console.log('Profile created successfully via direct insert:', newProfile)
      return { success: true, details: { profile: newProfile } }
      
    } catch (error) {
      console.error('Unexpected error creating profile:', error)
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      }
    }
  }

  async getUserProfile(userId: string): Promise<{ profile: SimpleUserProfile | null; error?: string; details?: any }> {
    try {
      const result = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (result.error) {
        console.error('Failed to fetch user profile:', result.error.message)
        return {
          profile: null,
          error: `Failed to fetch profile: ${result.error.message}`,
          details: result.error
        }
      }
      
      return { profile: result.data as SimpleUserProfile }
      
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      return {
        profile: null,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      }
    }
  }
}

export const simpleUserService = new SimpleUserService()

