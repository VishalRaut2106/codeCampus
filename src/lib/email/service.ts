// Email service for CodePVG notifications using Supabase Auth

import { createClient } from '@/lib/supabase/server'
import { generateWelcomeEmail, generateApprovalEmail, generateContestReminderEmail, generateStreakMilestoneEmail, generateContestResultsEmail, EmailTemplate } from './templates'

export class EmailService {
  private supabase: any

  constructor() {
    this.supabase = null // Will be initialized when needed
  }

  /**
   * Send email using Supabase Auth admin functions
   */
  private async sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
    try {
      // For development/testing, we'll use console.log
      // In production, you'd use a proper email service like SendGrid, Mailgun, etc.
      // or Supabase's built-in email functionality if available

      console.log('📧 Email would be sent:', {
        to,
        subject: template.subject,
        html: template.html.substring(0, 200) + '...' // Log first 200 chars for debugging
      })

      // For now, we'll simulate successful sending
      // In production, replace this with actual email sending logic
      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const template = generateWelcomeEmail(name)
    return this.sendEmail(email, template)
  }

  /**
   * Send approval email when account is approved
   */
  async sendApprovalEmail(email: string, name: string): Promise<boolean> {
    const template = generateApprovalEmail(name)
    return this.sendEmail(email, template)
  }

  /**
   * Send contest reminder email
   */
  async sendContestReminderEmail(email: string, name: string, contestName: string, startTime: string): Promise<boolean> {
    const template = generateContestReminderEmail(name, contestName, startTime)
    return this.sendEmail(email, template)
  }

  /**
   * Send streak milestone email
   */
  async sendStreakMilestoneEmail(email: string, name: string, streakDays: number): Promise<boolean> {
    const template = generateStreakMilestoneEmail(name, streakDays)
    return this.sendEmail(email, template)
  }

  /**
   * Send contest results email
   */
  async sendContestResultsEmail(email: string, name: string, contestName: string, rank: number, score: number): Promise<boolean> {
    const template = generateContestResultsEmail(name, contestName, rank, score)
    return this.sendEmail(email, template)
  }

  /**
   * Send restriction email
   */
  async sendRestrictionEmail(email: string, name: string, reason: string): Promise<boolean> {
    const { generateRestrictionEmail } = await import('./templates')
    const template = generateRestrictionEmail(name, reason)
    return this.sendEmail(email, template)
  }

  /**
   * Send revocation email
   */
  async sendRevocationEmail(email: string, name: string): Promise<boolean> {
    const { generateRevocationEmail } = await import('./templates')
    const template = generateRevocationEmail(name)
    return this.sendEmail(email, template)
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      })

      if (error) {
        console.error('Error sending password reset email:', error)
        return false
      }

      console.log('📧 Password reset email sent to:', email)
      return true
    } catch (error) {
      console.error('Error sending password reset email:', error)
      return false
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        console.error('Error sending email verification:', error)
        return false
      }

      console.log('📧 Email verification sent to:', email)
      return true
    } catch (error) {
      console.error('Error sending email verification:', error)
      return false
    }
  }
}

// Create singleton instance
export const emailService = new EmailService()
