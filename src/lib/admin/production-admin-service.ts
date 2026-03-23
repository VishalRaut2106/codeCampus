/**
 * Production Admin Service
 * Secure, maintainable, and production-ready admin data service
 * 
 * IMPORTANT: This service should be used server-side only with service role client
 * to bypass RLS policies and avoid infinite recursion issues.
 */

import { createClient } from '@/lib/supabase/client'
import { createServiceRoleClient } from '@/lib/supabase/server-safe'

export interface AdminStats {
  totalStudents: number
  pendingApprovals: number
  totalContests: number
  activeContests: number
  totalProblems: number
  totalSubmissions: number
}

export interface Student {
  id: string
  name: string
  email: string
  prn?: string
  department?: string
  role: string
  approval_status: string
  streak?: number
  points?: number
  badges?: any[]
  created_at: string
}

export interface Contest {
  id: string
  name: string
  start_time: string
  end_time: string
  created_at: string
}

export class ProductionAdminService {
  private supabase
  private adminClient

  constructor(useServiceRole: boolean = false) {
    this.supabase = createClient()
    // Use service role client for admin operations to bypass RLS
    this.adminClient = useServiceRole ? createServiceRoleClient() : this.supabase
  }

  /**
   * Fetch comprehensive admin dashboard data
   * Uses service role client to bypass RLS and avoid infinite recursion
   */
  async fetchAdminData(): Promise<{
    success: boolean
    data?: {
      stats: AdminStats
      students: Student[]
      contests: Contest[]
    }
    error?: string
  }> {
    try {
      // Verify admin access first using regular client
      const { data: currentUser, error: userError } = await this.supabase
        .from('users')
        .select('role, approval_status')
        .eq('id', (await this.supabase.auth.getUser()).data.user?.id)
        .single()

      if (userError || !currentUser || currentUser.role !== 'admin' || currentUser.approval_status !== 'approved') {
        return {
          success: false,
          error: 'Insufficient permissions. Admin access required.'
        }
      }

      // Use admin client (service role) for data fetching to bypass RLS
      const [
        studentsResult,
        pendingResult,
        contestsResult,
        problemsResult,
        submissionsResult
      ] = await Promise.all([
        this.adminClient
          .from('users')
          .select('id, name, email, prn, department, role, approval_status, streak, points, badges, created_at', { count: 'exact' })
          .eq('role', 'student'),
        
        this.adminClient
          .from('users')
          .select('id', { count: 'exact' })
          .eq('role', 'student')
          .eq('approval_status', 'pending'),
        
        this.adminClient
          .from('contests')
          .select('id, name, start_time, end_time, created_at', { count: 'exact' }),
        
        this.adminClient
          .from('problems')
          .select('id', { count: 'exact' }),
        
        this.adminClient
          .from('submissions')
          .select('id', { count: 'exact' })
      ])

      // Check for errors
      if (studentsResult.error) {
        throw new Error(`Failed to fetch students: ${studentsResult.error.message}`)
      }
      if (contestsResult.error) {
        throw new Error(`Failed to fetch contests: ${contestsResult.error.message}`)
      }

      // Calculate active contests
      const now = new Date()
      const activeContests = contestsResult.data?.filter(contest => {
        const startTime = new Date(contest.start_time)
        const endTime = new Date(contest.end_time)
        return now >= startTime && now <= endTime
      }).length || 0

      const stats: AdminStats = {
        totalStudents: studentsResult.count || 0,
        pendingApprovals: pendingResult.count || 0,
        totalContests: contestsResult.count || 0,
        activeContests,
        totalProblems: problemsResult.count || 0,
        totalSubmissions: submissionsResult.count || 0
      }

      return {
        success: true,
        data: {
          stats,
          students: studentsResult.data || [],
          contests: contestsResult.data || []
        }
      }

    } catch (error) {
      console.error('Production admin service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get pending students for approval
   * Uses service role client to bypass RLS
   */
  async getPendingStudents(): Promise<{
    success: boolean
    data?: Student[]
    error?: string
  }> {
    try {
      const { data, error } = await this.adminClient
        .from('users')
        .select('id, name, email, prn, department, role, approval_status, streak, points, badges, created_at')
        .eq('role', 'student')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch pending students: ${error.message}`)
      }

      return {
        success: true,
        data: data || []
      }

    } catch (error) {
      console.error('Error fetching pending students:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Approve a student
   * Uses service role client to bypass RLS
   */
  async approveStudent(studentId: string, adminId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await this.adminClient
        .from('users')
        .update({
          approval_status: 'approved',
          approved_by: adminId,
          approved_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .eq('role', 'student')

      if (error) {
        throw new Error(`Failed to approve student: ${error.message}`)
      }

      return { success: true }

    } catch (error) {
      console.error('Error approving student:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Reject a student
   * Uses service role client to bypass RLS
   */
  async rejectStudent(studentId: string, adminId: string, reason?: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await this.adminClient
        .from('users')
        .update({
          approval_status: 'rejected',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          rejection_reason: reason || 'Rejected by admin'
        })
        .eq('id', studentId)
        .eq('role', 'student')

      if (error) {
        throw new Error(`Failed to reject student: ${error.message}`)
      }

      return { success: true }

    } catch (error) {
      console.error('Error rejecting student:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get user profile by ID
   * Uses service role client to bypass RLS
   */
  async getUserProfile(userId: string): Promise<{
    success: boolean
    data?: Student
    error?: string
  }> {
    try {
      const { data, error } = await this.adminClient
        .from('users')
        .select('id, name, email, prn, role, approval_status, streak, points, badges, created_at')
        .eq('id', userId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch user profile: ${error.message}`)
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
}
