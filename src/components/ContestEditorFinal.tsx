'use client'

import BaseCodeEditor from '@/components/BaseCodeEditor'

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

interface ContestEditorFinalProps {
  problem: Problem
  contestId: string
  isContestActive: boolean
  timeRemaining?: number
  onSubmit?: (code: string, language: string) => Promise<void>
}

export default function ContestEditorFinal({
  problem,
  contestId,
  isContestActive,
  onSubmit
}: ContestEditorFinalProps) {
  
  const handleRun = async (code: string, language: string) => {
    // Mock test execution for contest
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockResults = {
      passed: problem.test_cases?.length || 0,
      total: problem.test_cases?.length || 0,
      testCases: problem.test_cases?.map((tc: any) => ({
        input: tc.input,
        expectedOutput: tc.output,
        actualOutput: tc.output,
        passed: true
      })) || []
    }

    return mockResults
  }

  const handleSubmit = async (code: string, language: string) => {
    if (onSubmit) {
      await onSubmit(code, language)
    }
  }

  return (
    <BaseCodeEditor
      problem={problem}
      onRun={handleRun}
      onSubmit={handleSubmit}
      isContestMode={true}
      isContestActive={isContestActive}
    />
  )
}
