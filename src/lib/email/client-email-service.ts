/**
 * Client-side email service
 * Safe for use in client components
 */

import { createClient } from '@/lib/supabase/client'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'welcome' | 'approval' | 'rejection' | 'notification'
}

export class ClientEmailService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      // For now, just log the email (in production, you'd integrate with an email service)
      console.log(`Welcome email would be sent to: ${userEmail} for user: ${userName}`)
      
      // In a real implementation, you'd call an email service API here
      // const response = await fetch('/api/send-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: userEmail,
      //     subject: 'Welcome to the Platform!',
      //     template: 'welcome',
      //     data: { name: userName }
      //   })
      // })

      return { success: true }

    } catch (error) {
      console.error('Error sending welcome email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Send approval email to user
   */
  async sendApprovalEmail(userEmail: string, userName: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      console.log(`Approval email would be sent to: ${userEmail} for user: ${userName}`)
      
      return { success: true }

    } catch (error) {
      console.error('Error sending approval email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Send rejection email to user
   */
  async sendRejectionEmail(userEmail: string, userName: string, reason?: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      console.log(`Rejection email would be sent to: ${userEmail} for user: ${userName}, reason: ${reason}`)
      
      return { success: true }

    } catch (error) {
      console.error('Error sending rejection email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get email templates
   */
  async getEmailTemplates(): Promise<{
    success: boolean
    data?: EmailTemplate[]
    error?: string
  }> {
    try {
      const { data, error } = await this.supabase
        .from('email_templates')
        .select('*')
        .order('name')

      if (error) {
        throw new Error(`Failed to fetch email templates: ${error.message}`)
      }

      return {
        success: true,
        data: data || []
      }

    } catch (error) {
      console.error('Error fetching email templates:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }
}
