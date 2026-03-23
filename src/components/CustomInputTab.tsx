"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, X, Play, FileText } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface CustomInputTabProps {
  problemId: string
  onRunCustomInput: (input: string) => void
  customOutput?: string
  isRunning?: boolean
  className?: string
}

interface CustomTestCase {
  id: string
  input: string
  output?: string
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

const getStorageKey = (problemId: string) => `codcampus_custom_inputs_${problemId}`

const saveCustomInputs = (problemId: string, inputs: CustomTestCase[]) => {
  try {
    const data = {
      problemId,
      inputs,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(getStorageKey(problemId), JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save custom inputs:', error)
  }
}

const loadCustomInputs = (problemId: string): CustomTestCase[] => {
  try {
    const stored = localStorage.getItem(getStorageKey(problemId))
    if (stored) {
      const data = JSON.parse(stored)
      return data.inputs || []
    }
  } catch (error) {
    console.warn('Failed to load custom inputs:', error)
  }
  return []
}

// ============================================================================
// CUSTOM TEST CASE COMPONENT
// ============================================================================

interface CustomTestCaseProps {
  testCase: CustomTestCase
  onUpdate: (id: string, input: string) => void
  onRemove: (id: string) => void
  onRun: (input: string) => void
  isRunning: boolean
  isActive: boolean
}

function CustomTestCaseItem({ 
  testCase, 
  onUpdate, 
  onRemove, 
  onRun, 
  isRunning, 
  isActive 
}: CustomTestCaseProps) {
  const [input, setInput] = useState(testCase.input)

  const handleInputChange = (value: string) => {
    setInput(value)
    onUpdate(testCase.id, value)
  }

  return (
    <Card className={cn(
      'border transition-colors',
      isActive ? 'border-blue-500/50 bg-blue-500/5' : 'border-gray-600'
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Test Case {testCase.id}</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRun(input)}
              disabled={isRunning || !input.trim()}
              className="h-7 px-2 text-xs"
            >
              {isRunning ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b border-green-400" />
              ) : (
                <Play className="h-3 w-3" />
              )}
              Run
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemove(testCase.id)}
              className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Input */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Input:
          </label>
          <textarea
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter your test input here..."
            className="w-full h-24 p-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-300 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Output */}
        {testCase.output !== undefined && (
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Output:
            </label>
            <pre className="p-2 bg-gray-900 border border-gray-600 rounded text-sm text-green-400 whitespace-pre-wrap min-h-[60px]">
              {testCase.output || 'No output'}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CustomInputTab({ 
  problemId, 
  onRunCustomInput, 
  customOutput, 
  isRunning = false,
  className 
}: CustomInputTabProps) {
  const [testCases, setTestCases] = useState<CustomTestCase[]>([])
  const [activeTestCase, setActiveTestCase] = useState<string | null>(null)

  // Load saved inputs on mount
  useEffect(() => {
    const savedInputs = loadCustomInputs(problemId)
    if (savedInputs.length > 0) {
      setTestCases(savedInputs)
      setActiveTestCase(savedInputs[0].id)
    } else {
      // Create initial test case
      const initialCase: CustomTestCase = {
        id: '1',
        input: ''
      }
      setTestCases([initialCase])
      setActiveTestCase('1')
    }
  }, [problemId])

  // Save inputs whenever they change
  useEffect(() => {
    if (testCases.length > 0) {
      saveCustomInputs(problemId, testCases)
    }
  }, [testCases, problemId])

  // Update output for active test case
  useEffect(() => {
    if (activeTestCase && customOutput !== undefined) {
      setTestCases(prev => prev.map(tc => 
        tc.id === activeTestCase 
          ? { ...tc, output: customOutput }
          : tc
      ))
    }
  }, [customOutput, activeTestCase])

  const addTestCase = () => {
    const newId = (Math.max(...testCases.map(tc => parseInt(tc.id))) + 1).toString()
    const newTestCase: CustomTestCase = {
      id: newId,
      input: ''
    }
    setTestCases(prev => [...prev, newTestCase])
    setActiveTestCase(newId)
  }

  const removeTestCase = (id: string) => {
    if (testCases.length <= 1) return // Keep at least one test case
    
    setTestCases(prev => prev.filter(tc => tc.id !== id))
    
    if (activeTestCase === id) {
      const remaining = testCases.filter(tc => tc.id !== id)
      setActiveTestCase(remaining[0]?.id || null)
    }
  }

  const updateTestCase = (id: string, input: string) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === id ? { ...tc, input } : tc
    ))
  }

  const runTestCase = (input: string) => {
    onRunCustomInput(input)
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-white">Custom Test Cases</h3>
          <Badge variant="outline" className="text-xs">
            {testCases.length} case{testCases.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={addTestCase}
          className="h-7 px-2 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Test Case
        </Button>
      </div>

      {/* Test Cases */}
      <div className="space-y-3">
        {testCases.map((testCase) => (
          <CustomTestCaseItem
            key={testCase.id}
            testCase={testCase}
            onUpdate={updateTestCase}
            onRemove={removeTestCase}
            onRun={(input) => {
              setActiveTestCase(testCase.id)
              runTestCase(input)
            }}
            isRunning={isRunning}
            isActive={activeTestCase === testCase.id}
          />
        ))}
      </div>

      {/* Help Text */}
      <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
        <div className="flex items-start space-x-2">
          <span className="text-blue-400 text-sm">💡</span>
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Custom Input Guide:</p>
            <ul className="space-y-1 text-xs">
              <li>• Create multiple test cases to verify your solution</li>
              <li>• Input format should match the problem requirements</li>
              <li>• Use the "Run" button to test individual cases</li>
              <li>• Your inputs are automatically saved for this problem</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomInputTab