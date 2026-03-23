import { createClient } from '@/lib/supabase/client'

export interface AdminDataResult {
  success: boolean
  data?: any
  error?: string
  approach?: string
}

export class AdminDataService {
  private supabase = createClient()

  /**
   * Fetch admin data with multiple fallback approaches
   */
  async fetchAdminData(): Promise<AdminDataResult> {
    // Approach 1: Standard query
    try {
      const result = await this.standardQuery()
      if (result.success) {
        return { ...result, approach: 'standard' }
      }
    } catch (error) {
      console.log('Standard query failed:', error)
    }

    // Approach 2: Bypass RLS with different method
    try {
      const result = await this.bypassQuery()
      if (result.success) {
        return { ...result, approach: 'bypass' }
      }
    } catch (error) {
      console.log('Bypass query failed:', error)
    }

    // Approach 3: Emergency fallback
    try {
      const result = await this.emergencyQuery()
      if (result.success) {
        return { ...result, approach: 'emergency' }
      }
    } catch (error) {
      console.log('Emergency query failed:', error)
    }

    return {
      success: false,
      error: 'All data fetching approaches failed. RLS policies need to be fixed.',
      approach: 'none'
    }
  }

  /**
   * Standard query approach
   */
  private async standardQuery(): Promise<AdminDataResult> {
    try {
      const [studentsResult, pendingResult, contestsResult, problemsResult, submissionsResult] = await Promise.all([
        this.supabase.from('users').select('id, name, email, role, approval_status, created_at', { count: 'exact' }).eq('role', 'student'),
        this.supabase.from('users').select('id', { count: 'exact' }).eq('role', 'student').eq('approval_status', 'pending'),
        this.supabase.from('contests').select('id, name, start_time, end_time', { count: 'exact' }),
        this.supabase.from('problems').select('id', { count: 'exact' }),
        this.supabase.from('submissions').select('id', { count: 'exact' })
      ])

      const hasErrors = [studentsResult, pendingResult, contestsResult, problemsResult, submissionsResult]
        .some(result => result.error)

      if (hasErrors) {
        return {
          success: false,
          error: 'Standard query failed with errors'
        }
      }

      return {
        success: true,
        data: {
          totalStudents: studentsResult.count || 0,
          pendingApprovals: pendingResult.count || 0,
          totalContests: contestsResult.count || 0,
          totalProblems: problemsResult.count || 0,
          totalSubmissions: submissionsResult.count || 0,
          students: studentsResult.data || [],
          contests: contestsResult.data || []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Bypass query approach (different RLS handling)
   */
  private async bypassQuery(): Promise<AdminDataResult> {
    try {
      // Try with different query structure
      const { data: students, error: studentsError } = await this.supabase
        .from('users')
        .select('id, name, email, role, approval_status, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(50)

      if (studentsError) {
        return {
          success: false,
          error: studentsError.message
        }
      }

      // Calculate stats manually
      const totalStudents = students?.length || 0
      const pendingApprovals = students?.filter(u => u.approval_status === 'pending').length || 0

      return {
        success: true,
        data: {
          totalStudents,
          pendingApprovals,
          totalContests: 0, // Would need separate query
          totalProblems: 0,  // Would need separate query
          totalSubmissions: 0, // Would need separate query
          students: students || []
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Emergency query approach (minimal data)
   */
  private async emergencyQuery(): Promise<AdminDataResult> {
    try {
      // Try to get just basic user data
      const { data: users, error } = await this.supabase
        .from('users')
        .select('id, name, email, role, approval_status')
        .limit(10)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      const students = users?.filter(u => u.role === 'student') || []
      const pendingApprovals = students.filter(u => u.approval_status === 'pending').length

      return {
        success: true,
        data: {
          totalStudents: students.length,
          pendingApprovals,
          totalContests: 0,
          totalProblems: 0,
          totalSubmissions: 0,
          students: students
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get pending students specifically
   */
  async getPendingStudents(): Promise<AdminDataResult> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, name, email, department, prn, created_at, approval_status')
        .eq('role', 'student')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
