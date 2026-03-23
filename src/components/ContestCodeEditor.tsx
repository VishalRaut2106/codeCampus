'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Editor from '@monaco-editor/react'
import { toast } from 'sonner'
import {
  Play,
  Send,
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code2,
  FileCode,
  Zap
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

interface ContestCodeEditorProps {
  problem: Problem
  contestId: string
  isContestActive: boolean
  onSubmit?: (code: string, language: string) => Promise<void>
}

const languageTemplates: Record<string, string> = {
  javascript: `class Solution {
    solve(arr) {
        // Write your code here
        
    }
}`,
  python: `class Solution:
    def solve(self, arr):
        # Write your code here
        pass`,
  java: `class Solution {
    public int solve(int[] arr) {
        // Write your code here
        
    }
}`,
  cpp: `class Solution {
public:
    int solve(vector<int>& arr) {
        // Write your code here
        
    }
};`,
  c: `int solve(int* arr, int arrSize) {
    // Write your code here
    
}`
}

export default function ContestCodeEditor({ 
  problem, 
  contestId, 
  isContestActive,
  onSubmit 
}: ContestCodeEditorProps) {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [testResults, setTestResults] = useState<any>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fontSize, setFontSize] = useState(14)
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('vs-dark')

  useEffect(() => {
    // Load template when language changes
    setCode(languageTemplates[language] || '')
  }, [language])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'hard': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsRunning(true)
    setTestResults(null)

    try {
      // Simulate running code with sample test cases
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock results
      const mockResults = {
        passed: 2,
        total: problem.test_cases?.length || 3,
        testCases: problem.test_cases?.slice(0, 2).map((tc: any, idx: number) => ({
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: tc.output, // Mock: same as expected
          passed: true,
          executionTime: Math.floor(Math.random() * 50) + 10
        })) || []
      }

      setTestResults(mockResults)
      toast.success(`${mockResults.passed}/${mockResults.total} test cases passed`)
    } catch (error) {
      console.error('Run error:', error)
      toast.error('Failed to run code')
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    if (!isContestActive) {
      toast.error('Contest is not active')
      return
    }

    setIsSubmitting(true)

    try {
      if (onSubmit) {
        await onSubmit(code, language)
      } else {
        // Default submission logic
        await new Promise(resolve => setTimeout(resolve, 2000))
        toast.success('Solution submitted successfully!')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit solution')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your code?')) {
      setCode(languageTemplates[language] || '')
      setTestResults(null)
      toast.info('Code reset to template')
    }
  }

  return (
    <div className={`flex flex-col ${isFullScreen ? 'fixed inset-0 z-50 bg-background' : 'h-full'}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{problem.title}</h2>
          </div>
          <Badge className={getDifficultyColor(problem.difficulty)}>
            {problem.difficulty}
          </Badge>
          <Badge variant="outline" className="border-primary/30">
            {problem.points} points
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-muted border border-border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
          </select>

          {/* Settings Dropdown */}
          <div className="relative group">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <div className="p-3 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Font Size</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full mt-1 bg-muted border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as 'vs-dark' | 'light')}
                    className="w-full mt-1 bg-muted border border-border rounded px-2 py-1 text-sm"
                  >
                    <option value="vs-dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Description */}
        <div className="w-1/2 border-r border-border overflow-y-auto">
          <div className="p-6">
            {/* Problem Statement */}
            <div className="prose prose-invert max-w-none">
              <div 
                className="text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: problem.description }}
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
                          {tc.output}
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

        {/* Right: Code Editor + Test Cases */}
        <div className="w-1/2 flex flex-col">
          {/* Code Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme={theme}
              options={{
                minimap: { enabled: false },
                fontSize: fontSize,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                formatOnPaste: true,
                formatOnType: true,
              }}
            />
          </div>

          {/* Bottom Panel: Test Cases & Results */}
          <div className="h-64 border-t border-border bg-card">
            <Tabs defaultValue="testcases" className="h-full flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
                <TabsTrigger value="testcases" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Test Cases
                </TabsTrigger>
                <TabsTrigger value="custom" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Custom Input
                </TabsTrigger>
                <TabsTrigger value="results" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Results
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="testcases" className="p-4 m-0">
                  {problem.test_cases && problem.test_cases.length > 0 ? (
                    <div className="space-y-3">
                      {problem.test_cases.slice(0, 3).map((tc: any, idx: number) => (
                        <div key={idx} className="bg-muted/50 rounded p-3 text-sm">
                          <div className="font-medium mb-2">Test Case {idx + 1}</div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-muted-foreground">Input: </span>
                              <code className="text-primary">{tc.input}</code>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expected: </span>
                              <code className="text-primary">{tc.output}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No test cases available
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="custom" className="p-4 m-0">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Custom Input:</label>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter your custom test input here..."
                      className="w-full h-32 bg-muted border border-border rounded p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="results" className="p-4 m-0">
                  {testResults ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className={`p-4 rounded-lg border-2 ${
                        testResults.passed === testResults.total
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-yellow-500/10 border-yellow-500/30'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {testResults.passed === testResults.total ? (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                          )}
                          <span className="font-semibold">
                            {testResults.passed}/{testResults.total} Test Cases Passed
                          </span>
                        </div>
                      </div>

                      {/* Individual Results */}
                      {testResults.testCases.map((tc: any, idx: number) => (
                        <div key={idx} className="bg-muted/50 rounded p-3 text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Test Case {idx + 1}</span>
                            <div className="flex items-center gap-2">
                              {tc.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span className="text-xs text-muted-foreground">
                                {tc.executionTime}ms
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div>
                              <span className="text-muted-foreground">Input: </span>
                              <code className="text-primary">{tc.input}</code>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Expected: </span>
                              <code className="text-primary">{tc.expectedOutput}</code>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Got: </span>
                              <code className={tc.passed ? 'text-green-400' : 'text-red-400'}>
                                {tc.actualOutput}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Run your code to see results
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between p-4 border-t border-border bg-card">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-border"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRun}
                disabled={isRunning || !code.trim()}
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
                    Run
                  </>
                )}
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !isContestActive || !code.trim()}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
