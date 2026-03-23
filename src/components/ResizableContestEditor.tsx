'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const InlineCodeEditor = dynamic(() => import('@/components/InlineCodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[#1e1e1e] text-muted-foreground">
      Loading Editor...
    </div>
  )
})
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cleanHtml } from '@/lib/utils/html-cleaner'
import {
  ChevronLeft,
  ChevronRight,
  Code2
} from 'lucide-react'

interface Problem {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  time_limit: number
  memory_limit: number
  test_cases: any[]
  function_name?: string
  parameters?: any[]
  return_type?: string
  code_snippets?: Record<string, string>
}

interface ResizableContestEditorProps {
  problem: Problem
  contestId: string
  isContestActive: boolean
  timeRemaining?: number
  onSubmit?: (code: string, language: string) => void
  currentProblemIndex?: number
  totalProblems?: number
  onPreviousProblem?: () => void
  onNextProblem?: () => void
  onBackToContest?: () => void
}

export default function ResizableContestEditor({
  problem,
  contestId,
  isContestActive,
  timeRemaining,
  onSubmit,
  currentProblemIndex,
  totalProblems,
  onPreviousProblem,
  onNextProblem,
  onBackToContest
}: ResizableContestEditorProps) {
  const [leftWidth, setLeftWidth] = useState(40) // percentage - 40% description, 60% editor
  const [isResizing, setIsResizing] = useState(false)
  const [view, setView] = useState<'problem' | 'code'>('problem') // Mobile view state
  const containerRef = useRef<HTMLDivElement>(null)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      // Constrain between 20% and 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const adjustWidth = (delta: number) => {
    const newWidth = leftWidth + delta
    if (newWidth >= 20 && newWidth <= 80) {
      setLeftWidth(newWidth)
    }
  }

  return (
    <div
      ref={containerRef}
      className="editor-fullscreen flex flex-col fixed top-16 left-0 right-0 bottom-0 z-40 bg-background"
    >
      {/* Mobile Tabs */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-50 flex border-t border-border bg-background">
        <button
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${view === 'problem' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setView('problem')}
        >
          Problem
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium border-b-2 ${view === 'code' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
          onClick={() => setView('code')}
        >
          Code
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative pb-12 lg:pb-0">
        {/* Left Panel: Problem Description */}
        <div
          className={`overflow-y-auto border-b lg:border-b-0 lg:border-r border-border bg-card h-full lg:h-full lg:block w-full lg:w-[var(--left-width)] ${view === 'problem' ? 'block' : 'hidden'}`}
          style={{ '--left-width': `${leftWidth}%` } as React.CSSProperties}
        >
          {/* Problem Header with Navigation */}
          <div className="sticky top-0 z-10 bg-card border-b border-border">
            {/* Navigation Bar */}
            {totalProblems && totalProblems > 1 && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPreviousProblem}
                  disabled={!currentProblemIndex || currentProblemIndex === 0}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Prev
                </Button>

                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-muted-foreground hidden sm:block">
                    {(currentProblemIndex || 0) + 1} / {totalProblems}
                  </div>
                  {/* Back to List Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs border-primary/20 bg-primary/5 hover:bg-primary/10"
                    onClick={onBackToContest}
                  >
                    All Problems
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNextProblem}
                  disabled={currentProblemIndex === undefined || currentProblemIndex >= totalProblems - 1}
                  className="h-7 px-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Title */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">{problem.title}</h2>
                <Badge className={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty}
                </Badge>
                <Badge variant="outline" className="border-primary/30 text-xs">
                  {problem.points} pts
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Problem Statement */}
            <div className="prose prose-invert max-w-none">
              <div
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: cleanHtml(problem.description) }}
              />
            </div>

            {/* Examples */}
            {problem.test_cases && problem.test_cases.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Examples:</h3>
                <div className="space-y-4">
                  {problem.test_cases.slice(0, 2).map((tc: any, idx: number) => (
                    <div key={idx} className="bg-muted/50 rounded-lg p-4 border border-border">
                      <div className="mb-3">
                        <span className="text-sm font-medium text-muted-foreground">Input:</span>
                        <pre className="mt-1 p-3 bg-black/30 rounded text-sm font-mono overflow-x-auto">
                          {tc.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Output:</span>
                        <pre className="mt-1 p-3 bg-black/30 rounded text-sm font-mono overflow-x-auto">
                          {tc.output || tc.expected_output || tc.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Constraints */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Constraints:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Time Limit: {problem.time_limit}ms</li>
                <li>• Memory Limit: {problem.memory_limit}MB</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resizer (Hidden on Mobile) */}
        <div
          className="hidden lg:block relative w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors group"
          onMouseDown={handleMouseDown}
        >
          {/* Resize Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-8 bg-primary rounded-full" />
          </div>

          {/* Quick Adjust Buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => adjustWidth(-10)}
              title="Decrease description width"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => adjustWidth(10)}
              title="Increase description width"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Panel: Code Editor (Locked on Mobile) */}
        <div
          className={`flex-1 overflow-hidden relative lg:bg-transparent h-full lg:h-full lg:block w-full lg:w-[var(--right-width)] ${view === 'code' ? 'block' : 'hidden'}`}
          style={{ '--right-width': `${100 - leftWidth}%` } as React.CSSProperties}
        >
          <div className="h-full">
            <InlineCodeEditor
              initialCode=""
              language="python"
              problemTitle={problem.title}
              problemId={problem.id}
              problemMetadata={{
                function_name: problem.function_name,
                parameters: problem.parameters,
                return_type: problem.return_type,
                code_snippets: problem.code_snippets
              }}
              contestMode={isContestActive}
              timeRemaining={timeRemaining}
              testCases={problem.test_cases?.map((tc: any) => ({
                input: tc.input,
                expectedOutput: tc.output || tc.expected_output || tc.expectedOutput
              })) || []}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
