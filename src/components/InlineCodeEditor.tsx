'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import CodeMirrorEditor from './editor/CodeMirrorEditor'
import ConsoleOutput from './editor/ConsoleOutput'
import { ThemeProvider } from './editor/ThemeContext'

interface InlineCodeEditorProps {
  initialCode?: string
  language?: string
  onCodeChange?: (code: string) => void
  onSubmit?: (code: string, language: string) => void
  contestMode?: boolean
  timeRemaining?: number
  problemTitle?: string
  problemId?: string
  problemMetadata?: {
    function_name?: string
    parameters?: any[]
    return_type?: string
    code_snippets?: Record<string, string>
  }
  testCases?: Array<{
    input: string
    expectedOutput: string
  }>
}

interface RunResult {
  status: string;
  passedTests?: number;
  totalTests?: number;
  testResults?: any[];
  executionTime?: number;
  memory?: number;
  error?: string;
}

export default function InlineCodeEditor(props: InlineCodeEditorProps) {
  return (
    <ThemeProvider>
      <InlineCodeEditorContent {...props} />
    </ThemeProvider>
  )
}

function InlineCodeEditorContent({
  initialCode = '',
  language = 'python',
  onCodeChange,
  onSubmit,
  contestMode = false,
  timeRemaining,
  problemTitle = 'Solution',
  problemId,
  problemMetadata,
  testCases = []
}: InlineCodeEditorProps) {
  const getBoilerplate = (lang: string, title: string) => {
    // 1. Try to use specific code snippet from metadata if available
    if (problemMetadata?.code_snippets) {
      const snippets = problemMetadata.code_snippets
      const langMap: Record<string, string> = {
        'python': 'python3',
        'javascript': 'javascript',
        'cpp': 'cpp',
        'java': 'java',
        'c': 'c'
      }
      const targetLang = langMap[lang] || lang
      if (snippets[targetLang]) return snippets[targetLang]
    }

    // 2. Fallback to generating from metadata name/params
    const functionName = problemMetadata?.function_name || title.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'solution'
    const className = title.replace(/[^a-zA-Z0-9]/g, '') || 'Solution'

    const templates: Record<string, string> = {
      python: `class Solution:\n    def ${functionName}(self, ${problemMetadata?.parameters?.map(p => p.name).join(', ') || 'input_data'}):\n        # Write your solution here\n        pass`,
      java: `class Solution {\n    public ${problemMetadata?.return_type || 'String'} ${functionName}(${problemMetadata?.parameters?.map(p => `${p.type || 'Object'} ${p.name}`).join(', ') || 'String input'}) {\n        // Write your solution here\n        return null;\n    }\n}`,
      cpp: `class Solution {\npublic:\n    ${problemMetadata?.return_type || 'string'} ${functionName}(${problemMetadata?.parameters?.map(p => `${p.type || 'string'} ${p.name}`).join(', ') || 'string input'}) {\n        // Write your solution here\n        return "";\n    }\n};`,
      c: `${problemMetadata?.return_type || 'char*'} ${functionName}(${problemMetadata?.parameters?.map(p => `${p.type || 'char*'} ${p.name}`).join(', ') || 'char* input'}) {\n    // Write your solution here\n    return "";\n}`,
      javascript: `/**\n * @param {${problemMetadata?.parameters?.map(p => p.type || 'any').join(', ') || 'any'}} input\n * @return {${problemMetadata?.return_type || 'any'}}\n */\nvar ${functionName} = function(${problemMetadata?.parameters?.map(p => p.name).join(', ') || 'input'}) {\n    // Write your solution here\n    \n};`
    }

    return templates[lang] || templates.python
  }

  const [code, setCode] = useState(initialCode || getBoilerplate(language, problemTitle))
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [submissionResult, setSubmissionResult] = useState<RunResult | null>(null)
  const [showPanel, setShowPanel] = useState(false)

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'javascript', label: 'JavaScript' }
  ]

  const handleLanguageChange = (newLang: string) => {
    if (code !== getBoilerplate(selectedLanguage, problemTitle)) {
      if (!confirm('Changing language will reset your code. Continue?')) {
        return
      }
    }
    setSelectedLanguage(newLang)
    setCode(getBoilerplate(newLang, problemTitle))
  }

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsRunning(true)
    setShowPanel(true)
    setRunResult(null)
    setSubmissionResult(null)

    try {
      const response = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          problemId: problemId || 'test-problem',
          code,
          language: selectedLanguage,
          dryRun: true
        })
      })

      const result = await response.json()

      if (result.success && result.results) {
        const passedTests = result.results.filter((r: any) => r.status === 'passed').length
        const totalTests = result.results.length

        const mappedRunResult: RunResult = {
          status: passedTests === totalTests ? 'Accepted' : 'Wrong Answer',
          passedTests,
          totalTests,
          testResults: result.results.map((r: any) => ({
            input: r.input || testCases[r.idx - 1]?.input || '',
            expectedOutput: r.expected,
            actualOutput: r.output,
            passed: r.status === 'passed',
            executionTime: parseFloat(r.time) * 1000,
            memory: r.memory,
            error: r.error
          })),
          executionTime: result.results.reduce((acc: number, r: any) => acc + (parseFloat(r.time) || 0), 0) * 1000,
          memory: Math.max(...result.results.map((r: any) => r.memory || 0)),
          error: result.error
        }

        setRunResult(mappedRunResult)

        if (passedTests === totalTests) {
          toast.success(`✅ All ${totalTests} test cases passed!`)
        } else {
          toast.error(`❌ ${totalTests - passedTests} test cases failed`)
        }
      } else {
        setRunResult({
          status: 'Error',
          error: result.error || 'Unknown error occurred'
        })
        toast.error('Failed to execute code')
      }
    } catch (error) {
      console.error('Run code error:', error)
      setRunResult({
        status: 'Error',
        error: 'Network error or server unavailable'
      })
      toast.error('Failed to run code')
    } finally {
      setIsRunning(false)
    }
  }

  const handleFinalSubmit = async () => {
    if (!runResult || runResult.status !== 'Accepted') {
      toast.error('Please run and pass all test cases before submitting')
      return
    }

    setIsSubmitting(true)
    setSubmissionResult(null)

    try {
      if (onSubmit) {
        await onSubmit(code, selectedLanguage)
      }

      // We can also simulate/handle actual submission feedback here if needed
      setSubmissionResult(runResult) // For now, just show the last run result as submission result
      toast.success('Solution submitted successfully!')
    } catch (error) {
      toast.error('Submission failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg overflow-hidden border-border">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {contestMode && timeRemaining !== undefined && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${timeRemaining < 300 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-white/60'
              }`}>
              <Clock className="h-3.5 w-3.5" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
          )}

          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-8 w-32 bg-muted/50 border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="h-8 px-3 text-xs"
          >
            {isRunning ? (
              <Clock className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1.5 text-green-500" />
            )}
            Run
          </Button>
          <Button
            size="sm"
            onClick={handleFinalSubmit}
            disabled={isRunning || isSubmitting || !runResult || runResult.status !== 'Accepted'}
            className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
          >
            Submit
          </Button>
        </div>
      </div>

      {/* CodeMirror Editor */}
      <div className="relative flex-1 overflow-hidden">
        <CodeMirrorEditor
          value={code}
          onChange={(val) => {
            setCode(val)
            onCodeChange?.(val)
          }}
          language={selectedLanguage}
          height="100%"
          disabled={isRunning || isSubmitting}
        />
      </div>

      {/* Console Output Panel */}
      <div className={`transition-all duration-300 ease-in-out ${showPanel ? 'h-[340px]' : 'h-10'}`}>
        <ConsoleOutput
          running={isRunning}
          submitting={isSubmitting}
          runResult={runResult}
          submissionResult={submissionResult}
          publicTestCases={testCases.map(tc => ({ ...tc, output: tc.expectedOutput, isPublic: true }))}
        />
      </div>
    </div>
  )
}
