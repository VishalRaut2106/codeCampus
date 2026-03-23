/**
 * Real-time Submission Status Service
 * 
 * Provides real-time feedback for code submissions
 * Broadcasts status updates via Supabase real-time channels
 * 
 * Requirements: 9.8
 */

import { createClient } from '@/lib/supabase/client'

export type SubmissionStatus = 
  | 'queued'
  | 'executing'
  | 'passed'
  | 'failed'
  | 'error'

export interface SubmissionStatusUpdate {
  submissionId: string
  userId: string
  problemId: string
  status: SubmissionStatus
  progress?: number // 0-100
  message?: string
  testCasesPassed?: number
  totalTestCases?: number
  timestamp: number
}

class RealtimeSubmissionStatus {
  private supabase = createClient()
  private statusChannels: Map<string, any> = new Map()

  /**
   * Broadcast a submission status update
   * This is called from the server-side submission handler
   */
  async broadcastStatus(update: SubmissionStatusUpdate): Promise<void> {
    try {
      // Insert into a submissions_status table for real-time broadcasting
      // Note: This requires a submissions_status table in Supabase
      const { error } = await this.supabase
        .from('submission_status_updates')
        .insert({
          submission_id: update.submissionId,
          user_id: update.userId,
          problem_id: update.problemId,
          status: update.status,
          progress: update.progress,
          message: update.message,
          test_cases_passed: update.testCasesPassed,
          total_test_cases: update.totalTestCases,
          created_at: new Date(update.timestamp).toISOString()
        })

      if (error) {
        console.error('Error broadcasting submission status:', error)
      }
    } catch (error) {
      console.error('Error in broadcastStatus:', error)
    }
  }

  /**
   * Subscribe to submission status updates for a specific user
   * Returns unsubscribe function
   */
  subscribeToUserSubmissions(
    userId: string,
    callback: (update: SubmissionStatusUpdate) => void
  ): () => void {
    const channelName = `submission-status-${userId}`
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submission_status_updates',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const data = payload.new as any
          const update: SubmissionStatusUpdate = {
            submissionId: data.submission_id,
            userId: data.user_id,
            problemId: data.problem_id,
            status: data.status,
            progress: data.progress,
            message: data.message,
            testCasesPassed: data.test_cases_passed,
            totalTestCases: data.total_test_cases,
            timestamp: new Date(data.created_at).getTime()
          }
          callback(update)
        }
      )
      .subscribe()

    this.statusChannels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      this.supabase.removeChannel(channel)
      this.statusChannels.delete(channelName)
    }
  }

  /**
   * Subscribe to submission status updates for a specific submission
   * Returns unsubscribe function
   */
  subscribeToSubmission(
    submissionId: string,
    callback: (update: SubmissionStatusUpdate) => void
  ): () => void {
    const channelName = `submission-${submissionId}`
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submission_status_updates',
          filter: `submission_id=eq.${submissionId}`
        },
        (payload) => {
          const data = payload.new as any
          const update: SubmissionStatusUpdate = {
            submissionId: data.submission_id,
            userId: data.user_id,
            problemId: data.problem_id,
            status: data.status,
            progress: data.progress,
            message: data.message,
            testCasesPassed: data.test_cases_passed,
            totalTestCases: data.total_test_cases,
            timestamp: new Date(data.created_at).getTime()
          }
          callback(update)
        }
      )
      .subscribe()

    this.statusChannels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      this.supabase.removeChannel(channel)
      this.statusChannels.delete(channelName)
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    for (const channel of this.statusChannels.values()) {
      this.supabase.removeChannel(channel)
    }
    this.statusChannels.clear()
  }
}

// Singleton instance
export const realtimeSubmissionStatus = new RealtimeSubmissionStatus()

/**
 * Helper function to create status updates
 */
export function createStatusUpdate(
  submissionId: string,
  userId: string,
  problemId: string,
  status: SubmissionStatus,
  options?: {
    progress?: number
    message?: string
    testCasesPassed?: number
    totalTestCases?: number
  }
): SubmissionStatusUpdate {
  return {
    submissionId,
    userId,
    problemId,
    status,
    progress: options?.progress,
    message: options?.message,
    testCasesPassed: options?.testCasesPassed,
    totalTestCases: options?.totalTestCases,
    timestamp: Date.now()
  }
}
