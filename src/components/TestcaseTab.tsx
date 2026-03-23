"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { TestCaseResult } from '@/lib/editor/types'
import { ChevronDown, ChevronRight } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface TestcaseTabProps {
  testCases: TestCaseResult[]
  className?: string
}

// ============================================================================
// INDIVIDUAL TEST CASE COMPONENT
// ============================================================================

interface TestCaseItemProps {
  testCase: TestCaseResult
  isExpanded: boolean
  onToggle: () => void
}

function TestCaseItem({ testCase, isExpanded, onToggle }: TestCaseItemProps) {
  const { index, passed, input, expectedOutput, actualOutput, executionTime, memoryUsed, error, suggestion } = testCase

  // Highlight differences between expected and actual output
  const renderOutputComparison = () => {
    if (passed) {
      return (
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-300">Output:</span>
            <pre className="mt-1 p-2 bg-gray-800 rounded text-sm text-green-400 whitespace-pre-wrap">
              {actualOutput}
            </pre>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div>
          <span className="text-sm font-medium text-gray-300">Expected:</span>
          <pre className="mt-1 p-2 bg-gray-800 rounded text-sm text-green-400 whitespace-pre-wrap">
            {expectedOutput}
          </pre>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-300">Your Output:</span>
          <pre className="mt-1 p-2 bg-gray-800 rounded text-sm text-red-400 whitespace-pre-wrap">
            {actualOutput}
          </pre>
        </div>
        {/* Highlight differences */}
        <div className="text-xs text-yellow-400">
          ⚠ Output mismatch detected
        </div>
      </div>
    )
  }

  return (
    <Card className={cn(
      'border transition-colors',
      passed 
        ? 'border-green-500/30 bg-green-500/5' 
        : 'border-red-500/30 bg-red-500/5'
    )}>
      <CardHeader 
        className="pb-2 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <span className="font-medium text-white">
              Test Case {index + 1}
            </span>
            <Badge 
              variant={passed ? 'default' : 'destructive'}
              className={cn(
                passed 
                  ? 'bg-green-600 text-white border-green-500' 
                  : 'bg-red-600 text-white border-red-500'
              )}
            >
              {passed ? 'Passed' : 'Failed'}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span>{executionTime}ms</span>
            <span>{memoryUsed}KB</span>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Input */}
            <div>
              <span className="text-sm font-medium text-gray-300">Input:</span>
              <pre className="mt-1 p-2 bg-gray-800 rounded text-sm text-gray-300 whitespace-pre-wrap">
                {input}
              </pre>
            </div>

            {/* Output Comparison */}
            {renderOutputComparison()}

            {/* Error Message */}
            {error && (
              <div>
                <span className="text-sm font-medium text-red-400">Error:</span>
                <pre className="mt-1 p-2 bg-red-900/20 border border-red-500/30 rounded text-sm text-red-300 whitespace-pre-wrap">
                  {error}
                </pre>
              </div>
            )}

            {/* Suggestion */}
            {suggestion && (
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400 text-sm">💡</span>
                  <div>
                    <span className="text-sm font-medium text-blue-300">Suggestion:</span>
                    <p className="text-sm text-blue-200 mt-1">{suggestion}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TestcaseTab({ testCases, className }: TestcaseTabProps) {
  const [expandedCases, setExpandedCases] = useState<Set<number>>(new Set())

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedCases)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedCases(newExpanded)
  }

  const passedCount = testCases.filter(tc => tc.passed).length
  const totalCount = testCases.length

  if (testCases.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <span className="text-gray-400">No test cases available</span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary */}
      <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
        <span className="text-sm text-gray-300">
          {passedCount}/{totalCount} test cases passed
        </span>
        <div className="flex space-x-2">
          <button
            onClick={() => setExpandedCases(new Set(testCases.map((_, i) => i)))}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Expand All
          </button>
          <span className="text-gray-500">|</span>
          <button
            onClick={() => setExpandedCases(new Set())}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Test Cases */}
      <div className="space-y-3">
        {testCases.map((testCase, index) => (
          <TestCaseItem
            key={index}
            testCase={testCase}
            isExpanded={expandedCases.has(index)}
            onToggle={() => toggleExpanded(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default TestcaseTab