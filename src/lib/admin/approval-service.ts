import { createClient } from '@/lib/supabase/client'

export interface PendingUser {
  id: string
  name: string
  email: string
  department?: string
  prn?: string
  github_url?: string
  linkedin_url?: string
  instagram_url?: string
  created_at: string
  approval_status: 'pending' | 'approved' | 'rejected'
  streak?: number
  points?: number
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
}

export interface ApprovalAction {
  userId: string
  action: 'approve' | 'reject'
  reason?: string
  approvedBy: string
}

export class AdminApprovalService {
  private supabase = createClient()

  /**
   * Get all pending user approvals
   */
  async getPendingUsers(): Promise<PendingUser[]> {
    try {
      // Use API endpoint instead of direct database query to bypass RLS
      const response = await fetch('/api/students')
      const result = await response.json()
      
      if (!result.success) {
        console.error('Error fetching users from API:', result.error)
        throw new Error(result.error)
      }
      
      // Filter for pending users
      const pendingUsers = (result.data || []).filter(
        (user: PendingUser) => user.approval_status === 'pending'
      )
      
      return pendingUsers
    } catch (error) {
      console.error('Error fetching pending users:', error)
      return []
    }
  }

  /**
   * Get all users with their approval status
   */
  async getAllUsers(): Promise<PendingUser[]> {
    try {
      // Use API endpoint instead of direct database query to bypass RLS
      const response = await fetch('/api/students')
      const result = await response.json()
      
      if (!result.success) {
        console.error('Error fetching users from API:', result.error)
        throw new Error(result.error)
      }
      
      console.log('Fetched users for admin via API:', result.data?.length || 0, 'users')
      return result.data || []
    } catch (error) {
      console.error('Error fetching users:', error)
      return []
    }
  }

  /**
   * Approve a user
   */
  async approveUser(userId: string, approvedBy: string): Promise<boolean> {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          userId: userId
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve user')
      }

      // Send approval email notification
      await this.sendApprovalEmail(userId)
      
      return true
    } catch (error) {
      console.error('Error approving user:', error)
      return false
    }
  }

  /**
   * Reject a user
   */
  async rejectUser(userId: string, approvedBy: string, reason?: string): Promise<boolean> {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          userId: userId,
          reason: reason || 'Rejected by admin'
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject user')
      }

      // Send rejection email notification
      await this.sendRejectionEmail(userId, reason)
      
      return true
    } catch (error) {
      console.error('Error rejecting user:', error)
      return false
    }
  }

  /**
   * Get user approval status
   */
  async getUserApprovalStatus(userId: string): Promise<'pending' | 'approved' | 'rejected' | null> {
    try {
      console.log('Fetching approval status for user:', userId)
      
      const { data, error } = await this.supabase
        .from('users')
        .select('approval_status')
        .eq('id', userId)
        .single()

      if (error) {
        // Handle empty error objects (RLS recursion)
        if (!error || Object.keys(error).length === 0) {
          console.error('RLS policy error detected - empty error object. Run CRITICAL_FIX_NOW.sql immediately!')
          return null
        }
        
        // Handle specific error codes
        if (error.code === 'PGRST116') {
          console.error('Table does not exist - database setup required')
          return null
        }
        
        console.error('Error fetching approval status:', error.message || error)
        throw error
      }
      
      console.log('Approval status fetched successfully:', data?.approval_status)
      return data?.approval_status || null
    } catch (error) {
      console.error('Exception in getUserApprovalStatus:', error)
      return null
    }
  }

  /**
   * Check if user is approved
   */
  async isUserApproved(userId: string): Promise<boolean> {
    const status = await this.getUserApprovalStatus(userId)
    return status === 'approved'
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats(): Promise<{
    total: number
    pending: number
    approved: number
    rejected: number
  }> {
    try {
      // Use API endpoint instead of direct database query to bypass RLS
      // Use dedicated stats endpoint optimization
      const response = await fetch('/api/dashboard-stats')
      const result = await response.json()
      
      if (!result.success) {
        console.error('Error fetching stats from API:', result.error)
        return { total: 0, pending: 0, approved: 0, rejected: 0 }
      }

      // Ensure the API returns the format we need, or map it
      // Assuming dashboard-stats returns { totalStudents, pendingApprovals, ... }
      // We'll map it to our interface
      const data = result.data
      const stats = {
        total: data.totalStudents || 0,
        pending: data.pendingApprovals || 0,
        approved: (data.totalStudents || 0) - (data.pendingApprovals || 0) - (data.rejectedCount || 0), // Estimate if exact not available
        rejected: data.rejectedCount || 0
      }

      console.log('Approval stats via API:', stats)
      return stats
    } catch (error) {
      console.error('Error fetching approval stats:', error)
      return { total: 0, pending: 0, approved: 0, rejected: 0 }
    }
  }

  /**
   * Send approval email notification
   */
  private async sendApprovalEmail(userId: string): Promise<void> {
    try {
      // Get user details
      const { data: user } = await this.supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single()

      if (!user) return

      // In a real implementation, you would send an email here
      // For now, we'll just log it
      console.log(`Approval email sent to ${user.email} for ${user.name}`)
      
      // You can integrate with email services like:
      // - Resend
      // - SendGrid
      // - AWS SES
      // - Nodemailer
    } catch (error) {
      console.error('Error sending approval email:', error)
    }
  }

  /**
   * Send rejection email notification
   */
  private async sendRejectionEmail(userId: string, reason?: string): Promise<void> {
    try {
      // Get user details
      const { data: user } = await this.supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single()

      if (!user) return

      // In a real implementation, you would send an email here
      console.log(`Rejection email sent to ${user.email} for ${user.name}. Reason: ${reason || 'No reason provided'}`)
    } catch (error) {
      console.error('Error sending rejection email:', error)
    }
  }
}
