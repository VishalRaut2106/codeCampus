/**
 * React Hook for Real-time Submission Status
 * 
 * Provides real-time updates for code submissions
 * 
 * Requirements: 9.8
 */

import { useEffect, useState, useCallback } from 'react'
import { realtimeSubmissionStatus, type SubmissionStatusUpdate, type SubmissionStatus } from '@/lib/submissions/realtime-status'

interface UseSubmissionStatusOptions {
  userId?: string
  submissionId?: string
  onStatusChange?: (update: SubmissionStatusUpdate) => void
}

interface SubmissionStatusState {
  status: SubmissionStatus | null
  progress: number
  message: string
  testCasesPassed: number
  totalTestCases: number
  isExecuting: boolean
  lastUpdate: number | null
}

export function useSubmissionStatus(options: UseSubmissionStatusOptions = {}) {
  const { userId, submissionId, onStatusChange } = options

  const [state, setState] = useState<SubmissionStatusState>({
    status: null,
    progress: 0,
    message: '',
    testCasesPassed: 0,
    totalTestCases: 0,
    isExecuting: false,
    lastUpdate: null
  })

  const handleUpdate = useCallback((update: SubmissionStatusUpdate) => {
    setState({
      status: update.status,
      progress: update.progress || 0,
      message: update.message || '',
      testCasesPassed: update.testCasesPassed || 0,
      totalTestCases: update.totalTestCases || 0,
      isExecuting: update.status === 'queued' || update.status === 'executing',
      lastUpdate: update.timestamp
    })

    // Call optional callback
    if (onStatusChange) {
      onStatusChange(update)
    }
  }, [onStatusChange])

  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    if (userId) {
      // Subscribe to all submissions for this user
      unsubscribe = realtimeSubmissionStatus.subscribeToUserSubmissions(userId, handleUpdate)
    } else if (submissionId) {
      // Subscribe to a specific submission
      unsubscribe = realtimeSubmissionStatus.subscribeToSubmission(submissionId, handleUpdate)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId, submissionId, handleUpdate])

  const reset = useCallback(() => {
    setState({
      status: null,
      progress: 0,
      message: '',
      testCasesPassed: 0,
      totalTestCases: 0,
      isExecuting: false,
      lastUpdate: null
    })
  }, [])

  return {
    ...state,
    reset
  }
}
