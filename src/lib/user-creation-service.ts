import { createClient } from '@/lib/supabase/client'
import { createServerClientSafe, createServiceRoleClient } from '@/lib/supabase/server-safe'

export interface UserCreationData {
  id: string
  name: string
  email: string
  prn?: string
  department?: string
  role?: 'student' | 'admin'
}

export interface UserCreationResult {
  success: boolean
  error?: string
  data?: any
  method?: string
}

export class UserCreationService {
  private clientSide: ReturnType<typeof createClient> | null = null
  private serverSide: ReturnType<typeof createServerClientSafe> | null = null

  constructor(useServerSide: boolean = false) {
    if (useServerSide) {
      this.serverSide = createServerClientSafe()
    } else {
      this.clientSide = createClient()
    }
  }

  private getSupabaseClient() {
    return this.serverSide || this.clientSide || createClient()
  }

  /**
   * Create user profile with multiple fallback methods
   */
  async createUserProfile(userData: UserCreationData): Promise<UserCreationResult> {
    console.log('=== USER CREATION SERVICE START ===')
    console.log('Creating profile for:', {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      prn: userData.prn,
      department: userData.department,
      role: userData.role || 'student'
    })

    // Method 1: Skip database function temporarily (function not available)
    console.log('Skipping database function method - not available')

    // Method 2: Try direct database insert
    const directInsertResult = await this.tryDirectInsert(userData)
    if (directInsertResult.success) {
      console.log('✅ Profile created via direct insert')
      return directInsertResult
    }

    // Method 3: Try service role bypass
    const serviceRoleResult = await this.tryServiceRoleInsert(userData)
    if (serviceRoleResult.success) {
      console.log('✅ Profile created via service role')
      return serviceRoleResult
    }

    // Method 4: Try API endpoint fallback
    const apiResult = await this.tryApiEndpoint(userData)
    if (apiResult.success) {
      console.log('✅ Profile created via API endpoint')
      return apiResult
    }

    console.log('❌ All user creation methods failed')
    return {
      success: false,
      error: 'All user creation methods failed. Please contact support.',
      method: 'all_failed'
    }
  }

  /**
   * Method 1: Try using the database function
   */
  private async tryDatabaseFunction(userData: UserCreationData): Promise<UserCreationResult> {
    try {
      console.log('Attempting database function method...')
      const supabase = this.getSupabaseClient()

      const { data, error } = await supabase.rpc('create_user_profile', {
        p_user_id: userData.id,
        p_name: userData.name,
        p_email: userData.email,
        p_prn: userData.prn?.trim() || null,
        p_department: userData.department?.trim() || null
      })

      if (error) {
        console.log('Database function error:', error)
        return { success: false, error: error.message, method: 'database_function' }
      }

      if (data && data.success) {
        return { success: true, data, method: 'database_function' }
      }

      return { success: false, error: 'Database function returned no data', method: 'database_function' }
    } catch (error) {
      console.log('Database function exception:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Database function failed',
        method: 'database_function'
      }
    }
  }

  /**
   * Method 2: Try direct database insert
   */
  private async tryDirectInsert(userData: UserCreationData): Promise<UserCreationResult> {
    try {
      console.log('Attempting direct insert method...')
      const supabase = this.getSupabaseClient()

      // Check if user already exists first
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, name, email, prn, department')
        .eq('id', userData.id)
        .single()

      if (existingUser && !checkError) {
        console.log('User already exists, updating missing fields if needed')
        
        const updateData: any = {}
        if (!existingUser.prn && userData.prn?.trim()) {
          updateData.prn = userData.prn.trim()
        }
        if (!existingUser.department && userData.department?.trim()) {
          updateData.department = userData.department.trim()
        }

        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString()
          
          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userData.id)

          if (updateError) {
            return { success: false, error: updateError.message, method: 'direct_insert_update' }
          }
        }

        return {
          success: true,
          data: { ...existingUser, ...updateData },
          method: 'direct_insert_update'
        }
      }

      // Create new user profile
      const profileData = {
        id: userData.id,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        username: this.generateUsername(userData.name, userData.email),
        prn: userData.prn?.trim() || null,
        department: userData.department?.trim() || null,
        role: userData.role || 'student',
        streak: 0,
        points: 0,
        badges: [],  // This will be interpreted as text[] in PostgreSQL
        approval_status: 'pending',
        profile_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        // Handle duplicate key gracefully
        if (error.code === '23505') {
          console.log('User already exists (duplicate key)')
          return { success: true, data: { id: userData.id }, method: 'direct_insert_duplicate' }
        }
        return { success: false, error: error.message, method: 'direct_insert' }
      }

      return { success: true, data, method: 'direct_insert' }
    } catch (error) {
      console.log('Direct insert exception:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Direct insert failed',
        method: 'direct_insert'
      }
    }
  }

  /**
   * Method 3: Try service role insert (bypasses RLS)
   */
  private async tryServiceRoleInsert(userData: UserCreationData): Promise<UserCreationResult> {
    try {
      console.log('Attempting service role method...')
      
      // Only available on server side
      if (typeof window !== 'undefined') {
        return { success: false, error: 'Service role not available on client side', method: 'service_role' }
      }

      const serviceClient = createServiceRoleClient()

      const profileData = {
        id: userData.id,
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        username: this.generateUsername(userData.name, userData.email),
        prn: userData.prn?.trim() || null,
        department: userData.department?.trim() || null,
        role: userData.role || 'student',
        streak: 0,
        points: 0,
        badges: [],  // Empty array for text[] type
        approval_status: 'pending',
        profile_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await serviceClient
        .from('users')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message, method: 'service_role' }
      }

      return { success: true, data, method: 'service_role' }
    } catch (error) {
      console.log('Service role exception:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Service role method failed',
        method: 'service_role'
      }
    }
  }

  /**
   * Method 4: Try API endpoint fallback
   */
  private async tryApiEndpoint(userData: UserCreationData): Promise<UserCreationResult> {
    try {
      console.log('Attempting API endpoint method...')
      
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.id,
          name: userData.name,
          email: userData.email,
          prn: userData.prn,
          department: userData.department,
          role: userData.role || 'student'
        })
      })

      if (!response.ok) {
        return { 
          success: false, 
          error: `API responded with ${response.status}`,
          method: 'api_endpoint'
        }
      }

      const result = await response.json()
      
      if (result.success) {
        return { success: true, data: result.data, method: 'api_endpoint' }
      } else {
        return { success: false, error: result.error || 'API endpoint failed', method: 'api_endpoint' }
      }
    } catch (error) {
      console.log('API endpoint exception:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'API endpoint failed',
        method: 'api_endpoint'
      }
    }
  }

  /**
   * Generate a unique username from name and email
   */
  private generateUsername(name: string, email: string): string {
    const nameLetters = name.split(' ').map(n => n.charAt(0).toLowerCase()).join('')
    const emailLetters = email.split('@')[0].substring(0, 3).toLowerCase()
    const timestamp = Date.now().toString().slice(-4)
    return `${nameLetters}${emailLetters}${timestamp}`
  }

  /**
   * Verify user profile exists and has required data
   */
  async verifyUserProfile(userId: string): Promise<{ exists: boolean; data?: any; missingFields?: string[] }> {
    try {
      const supabase = this.getSupabaseClient()
      
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, prn, department, role, approval_status')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return { exists: false }
      }

      const missingFields: string[] = []
      if (!data.prn) missingFields.push('prn')
      if (!data.department) missingFields.push('department')

      return {
        exists: true,
        data,
        missingFields: missingFields.length > 0 ? missingFields : undefined
      }
    } catch (error) {
      console.error('Error verifying user profile:', error)
      return { exists: false }
    }
  }
}

// Singleton instances for different contexts
export const clientUserCreationService = new UserCreationService(false)
export const serverUserCreationService = new UserCreationService(true)

// Default export for backward compatibility
export default clientUserCreationService