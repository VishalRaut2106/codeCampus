'use client'

import BaseCodeEditor from '@/components/BaseCodeEditor'
import realtimeSubscriptionManager from '@/lib/realtime/subscription-manager'
import { useState } from 'react'
import type { RealtimeExecutionStatus } from '@/lib/editor/types'

interface Problem {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  time_limit: number
  memory_limit: number
  test_cases: any[]
}

interface ProblemEditorFinalProps {
  problem: Problem
  onSubmit: (code: string, language: string) => Promise<void>
}

export default function ProblemEditorFinal({ problem, onSubmit }: ProblemEditorFinalProps) {
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeExecutionStatus | null>(null)
  
  const handleRun = async (code: string, language: string) => {
    setRealtimeStatus({ status: 'queued', message: 'Initializing...', progress: 0 })
    
    // Generate ID client-side to listen before triggering execution
    const submissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Subscribe to realtime updates
    const subId = realtimeSubscriptionManager.subscribe({
      table: 'submission_status_updates',
      filter: `submission_id=eq.${submissionId}`,
      event: 'INSERT',
      callback: (payload) => {
        const update = payload.new
        if (update) {
          setRealtimeStatus({
            status: update.status,
            message: update.message,
            progress: update.progress,
            payload: update.payload
          })
        }
      }
    })

    try {
      const res = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          problemId: problem.id, 
          code, 
          language, 
          dryRun: true,
          submissionId 
        })
      })
      
      const ct = res.headers.get('content-type') || ''
      const data = ct.includes('application/json') 
        ? await res.json() 
        : { success: false, error: await res.text() }
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Run failed')
      }
      
      const results = {
        passed: data.results?.filter((r: any) => r.status === 'passed').length || 0,
        total: data.results?.length || 0,
        testCases: data.results?.map((r: any) => ({
          input: r.input,
          expectedOutput: r.expected,
          actualOutput: r.output,
          passed: r.status === 'passed',
          error: r.error
        })) || []
      }
  
      return results
    } finally {
      // Cleanup subscription after short delay to ensure final status is seen
      setTimeout(() => {
        realtimeSubscriptionManager.unsubscribe(subId)
        setRealtimeStatus(null) 
      }, 1000)
    }
  }

  const handleSubmit = async (code: string, language: string) => {
    await onSubmit(code, language)
  }

  return (
    <BaseCodeEditor
      problem={problem}
      onRun={handleRun}
      onSubmit={handleSubmit}
      isContestMode={false}
      isContestActive={true}
      realtimeStatus={realtimeStatus}
    />
  )
}
