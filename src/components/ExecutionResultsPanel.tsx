"use client"

import React, { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ExecutionResults, ExecutionStatus } from '@/lib/editor/types'
import TestcaseTab from './TestcaseTab'
import ConsoleTab from './ConsoleTab'
import CustomInputTab from './CustomInputTab'

// ============================================================================
// TYPES
// ============================================================================

export interface ExecutionResultsPanelProps {
  results: ExecutionResults | null
  isRunning: boolean
  executionType: 'run' | 'submit'
  problemId: string
  onRunCustomInput: (input: string) => void
  customOutput?: string
  className?: string
}

// ============================================================================
// STATUS BADGE COMPONENT
// ============================================================================

interface StatusBadgeProps {
  status: ExecutionStatus
  className?: string
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: ExecutionStatus) => {
    switch (status) {
      case 'accepted':
        return {
          text: 'Accepted',
          variant: 'default' as const,
          className: 'bg-green-600 text-white border-green-500'
        }
      case 'wrong_answer':
        return {
          text: 'Wrong Answer',
          variant: 'destructive' as const,
          className: 'bg-red-600 text-white border-red-500'
        }
      case 'compilation_error':
        return {
          text: 'Compilation Error',
          variant: 'destructive' as const,
          className: 'bg-orange-600 text-white border-orange-500'
        }
      case 'runtime_error':
        return {
          text: 'Runtime Error',
          variant: 'destructive' as const,
          className: 'bg-red-700 text-white border-red-600'
        }
      case 'time_limit_exceeded':
        return {
          text: 'Time Limit Exceeded',
          variant: 'secondary' as const,
          className: 'bg-yellow-600 text-white border-yellow-500'
        }
      case 'memory_limit_exceeded':
        return {
          text: 'Memory Limit Exceeded',
          variant: 'secondary' as const,
          className: 'bg-purple-600 text-white border-purple-500'
        }
      default:
        return {
          text: 'Unknown',
          variant: 'outline' as const,
          className: 'bg-gray-600 text-white border-gray-500'
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.text}
    </Badge>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExecutionResultsPanel({
  results,
  isRunning,
  executionType,
  problemId,
  onRunCustomInput,
  customOutput,
  className
}: ExecutionResultsPanelProps) {
  const [activeTab, setActiveTab] = useState('testcase')

  // Show loading state
  if (isRunning) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
              <span className="text-gray-300">
                {executionType === 'run' ? 'Running...' : 'Submitting...'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state
  if (!results) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <span className="text-gray-400">
              Click "Run" to test your code or "Submit" for final submission
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        {/* Status Badge and Summary */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <StatusBadge status={results.status} />
            <span className="text-sm text-gray-300">
              {results.passedTestCases}/{results.totalTestCases} test cases passed
            </span>
          </div>
          <div className="text-sm text-gray-400">
            Runtime: {results.executionTime}ms | Memory: {results.memoryUsed}KB
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="testcase">Testcase</TabsTrigger>
            <TabsTrigger value="console">Console</TabsTrigger>
            <TabsTrigger value="custom">Custom Input</TabsTrigger>
          </TabsList>

          <TabsContent value="testcase" className="mt-4">
            <TestcaseTab testCases={results.testCases} />
          </TabsContent>

          <TabsContent value="console" className="mt-4">
            <ConsoleTab consoleOutput={results.consoleOutput} />
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <CustomInputTab
              problemId={problemId}
              onRunCustomInput={onRunCustomInput}
              customOutput={customOutput}
              isRunning={isRunning}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default ExecutionResultsPanel