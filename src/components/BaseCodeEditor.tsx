'use client'

import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { cleanHtml } from '@/lib/utils/html-cleaner'
import { toast } from 'sonner'
import CodeEditorErrorBoundary from '@/components/CodeEditorErrorBoundary'
import { RealtimeExecutionStatus } from '@/lib/editor/types'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  Send,
  CheckCircle,
  XCircle,
  Clock
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
}

interface BaseCodeEditorProps {
  problem: Problem
  onRun: (code: string, language: string) => Promise<any>
  onSubmit: (code: string, language: string) => Promise<void>
  isContestMode?: boolean
  isContestActive?: boolean
  realtimeStatus?: RealtimeExecutionStatus | null
}

const languageTemplates: Record<string, string> = {
  javascript: `function solve(input) {
    // Write your code here
    
    return result;
}`,
  python: `def solve(input):
    # Write your code here
    
    return result`,
  java: `class Solution {
    public static void solve(String input) {
        // Write your code here
        
    }
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here
    
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    // Write your code here
    
    return 0;
}`
}

export default function BaseCodeEditor({
  problem,
  onRun,
  onSubmit,
  isContestMode = false,
  isContestActive = true,
  realtimeStatus
}: BaseCodeEditorProps) {
  const [leftWidth, setLeftWidth] = useState(40)
  const [isResizing, setIsResizing] = useState(false)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [allTestsPassed, setAllTestsPassed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCode(languageTemplates[language] || '')
    setTestResults(null)
    setAllTestsPassed(false)
  }, [language])

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

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsRunning(true)
    setTestResults(null)
    setAllTestsPassed(false)

    try {
      const results = await onRun(code, language)
      setTestResults(results)
      const allPassed = results.passed === results.total
      setAllTestsPassed(allPassed)
      
      if (allPassed) {
        toast.success(`✅ All ${results.total} test cases passed!`)
      } else {
        toast.error(`❌ ${results.passed}/${results.total} test cases passed`)
      }
    } catch (error) {
      console.error('Run error:', error)
      toast.error('Failed to run code')
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!allTestsPassed) {
      toast.error('Please run and pass all test cases before submitting')
      return
    }

    if (isContestMode && !isContestActive) {
      toast.error('Contest is not active')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(code, language)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit solution')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CodeEditorErrorBoundary>
      <div ref={containerRef} className="flex flex-col h-[calc(100vh-250px)]">
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Description */}
        <div 
          className="overflow-y-auto border-r border-border bg-card"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="p-6">
            <div className="prose prose-invert max-w-none">
              <div 
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: cleanHtml(problem.description) }}
              />
            </div>

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
                          {tc.expected_output || tc.output}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Constraints:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Time Limit: {problem.time_limit}ms</li>
                <li>• Memory Limit: {problem.memory_limit}MB</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Resizer */}
        <div
          className="relative w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors group"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-8 bg-primary rounded-full" />
          </div>
        </div>

        {/* Right: Editor */}
        <div 
          className="flex flex-col"
          style={{ width: `${100 - leftWidth}%` }}
        >
          {/* Editor Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-muted border border-border rounded px-3 py-1.5 text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>

          {/* Realtime Status */}
          {isRunning && realtimeStatus && (
            <div className="border-t border-border bg-card p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-blue-400 capitalize">
                    {realtimeStatus.status}...
                  </span>
                  <span className="text-muted-foreground">
                    {realtimeStatus.progress}%
                  </span>
                </div>
                <Progress value={realtimeStatus.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {realtimeStatus.message}
                </p>
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults && (
            <div className="border-t border-border bg-card p-4 max-h-48 overflow-y-auto">
              <div className={`flex items-center gap-2 mb-3 ${
                allTestsPassed ? 'text-green-400' : 'text-red-400'
              }`}>
                {allTestsPassed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-semibold">
                  {testResults.passed}/{testResults.total} Test Cases Passed
                </span>
              </div>
              
              {!allTestsPassed && testResults.testCases && (
                <div className="space-y-2 text-sm">
                  {testResults.testCases.filter((tc: any) => !tc.passed).map((tc: any, idx: number) => (
                    <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded p-2">
                      <div className="font-medium text-red-400">Test Case {idx + 1} Failed</div>
                      {tc.error && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Error: {tc.error}
                        </div>
                      )}
                      {!tc.error && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Expected: {tc.expectedOutput} | Got: {tc.actualOutput}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between p-4 border-t border-border bg-card">
        <div className="text-sm text-muted-foreground">
          {problem.points} points • {problem.difficulty}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            variant="outline"
            className="border-border"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Code
              </>
            )}
          </Button>

          {allTestsPassed && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
    </CodeEditorErrorBoundary>
  )
}
