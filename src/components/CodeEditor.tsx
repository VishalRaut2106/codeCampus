'use client'

import { useEffect, useRef, useState } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LANGUAGES } from '@/lib/judge0/client'
import { toast } from 'sonner'
import CodeEditorErrorBoundary from '@/components/CodeEditorErrorBoundary'
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  FileText
} from 'lucide-react'

interface CodeEditorProps {
  initialCode?: string
  language?: string
  readOnly?: boolean
  onCodeChange?: (code: string) => void
  onSubmit?: (code: string, language: string) => void
  contestMode?: boolean
  timeRemaining?: number
  testCases?: Array<{
    input: string
    expectedOutput: string
    description?: string
  }>
}

interface ExecutionResult {
  status: 'success' | 'error' | 'running'
  statusDescription?: string
  output?: string
  error?: string
  executionTime?: string
  memory?: number
}

export default function CodeEditor({
  initialCode = '',
  language = 'javascript',
  readOnly = false,
  onCodeChange,
  onSubmit,
  contestMode = false,
  timeRemaining,
  testCases = []
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [isRunning, setIsRunning] = useState(false)
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null)
  const [showTestCases, setShowTestCases] = useState(false)
  const editorRef = useRef<any>(null)

  // Disable copy-paste in contest mode
  useEffect(() => {
    if (contestMode && editorRef.current) {
      const editor = editorRef.current

      const handlePaste = (e: ClipboardEvent) => {
        e.preventDefault()
        toast.error('Copy-paste is disabled during contests')
      }

      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault()
        toast.error('Copy is disabled during contests')
      }

      editor.onDidPaste(handlePaste)
      editor.onDidCopy(handleCopy)

      return () => {
        editor.removeAllListeners('paste')
        editor.removeAllListeners('copy')
      }
    }
  }, [contestMode])

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor

    // Configure Monaco Editor
    monaco.editor.defineTheme('codepvg-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
      ],
      colors: {
        'editor.background': '#101418',
        'editor.foreground': '#ffffff',
        'editor.lineHighlightBackground': '#1a1f25',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41',
      }
    })

    monaco.editor.setTheme('codepvg-dark')
  }

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first')
      return
    }

    setIsRunning(true)
    setExecutionResult({ status: 'running' })

    try {
      // Ensure selectedLanguage is properly formatted to get the language ID
      const languageNormalized = selectedLanguage.toLowerCase();
      const languageInfo = LANGUAGES[languageNormalized];
      if (!languageInfo) {
        throw new Error(`Unsupported language: ${selectedLanguage}`);
      }

      // Execute code via server-side API so that code wrapping (Solution class -> main) works properly
      const response = await fetch('/api/judge0/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageInfo.id,
          stdin: testCases.length > 0 ? testCases[0].input : undefined,
          expected_output: testCases.length > 0 ? testCases[0].expectedOutput : undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Execution failed');
      }

      if (result.status?.id === 3) { // Accepted
        setExecutionResult({
          status: 'success',
          statusDescription: result.status?.description || 'Accepted',
          output: result.stdout || 'Code executed successfully (No Output)',
          executionTime: result.time,
          memory: result.memory
        })
      } else {
        setExecutionResult({
          status: 'error',
          statusDescription: result.status?.description || 'Error',
          error: result.compile_output || result.stderr || result.message || result.status?.description || 'Execution failed',
          output: result.stdout,
          executionTime: result.time,
          memory: result.memory
        })
      }
    } catch (error) {
      console.error('Execution error:', error)
      setExecutionResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting')
      return
    }

    if (onSubmit) {
      onSubmit(code, selectedLanguage)
    } else {
      toast.success('Code submitted successfully!')
    }
  }



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <CodeEditorErrorBoundary>
      <div className="space-y-4">
      {/* Editor Controls */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00C896]" />
              Code Editor
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {contestMode && timeRemaining !== undefined && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  timeRemaining < 300 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white/80'
                }`}>
                  <Clock className="h-4 w-4" />
                  {formatTime(timeRemaining)}
                </div>
              )}

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-full sm:w-40 glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGES).map(([key, lang]) => (
                    <SelectItem key={key} value={key}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>


            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="relative">
            <Editor
              height="60vh"
              language={selectedLanguage}
              value={code}
              onChange={(value) => {
                setCode(value || '')
                onCodeChange?.(value || '')
              }}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: window.innerWidth > 768 },
                fontSize: window.innerWidth < 640 ? 12 : 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                readOnly: readOnly || isRunning,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                folding: true,
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                padding: { top: 16, bottom: 16 },
              }}
              loading={
                <div className="flex items-center justify-center h-[60vh] glass-card">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C896]"></div>
                    <p className="text-sm text-muted-foreground">Loading editor...</p>
                  </div>
                </div>
              }
            />

            {/* Contest mode overlay */}
            {contestMode && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Contest Mode
                  </Badge>
                </div>
                {timeRemaining !== undefined && timeRemaining < 300 && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse">
                      Time Running Out!
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleRunCode}
            disabled={isRunning || !code.trim()}
            className="glass-button w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Code
              </>
            )}
          </Button>

          {contestMode && (
            <Button
              onClick={handleSubmit}
              disabled={!code.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Solution
            </Button>
          )}
        </div>

        {testCases.length > 0 && (
          <Button
            variant="outline"
            onClick={() => setShowTestCases(!showTestCases)}
            className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Test Cases ({testCases.length})
          </Button>
        )}
      </div>

      {/* Test Cases Panel */}
      {showTestCases && testCases.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Test Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testCases.map((testCase, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg">
                  <h4 className="font-medium mb-2">Test Case {index + 1}</h4>
                  {testCase.description && (
                    <p className="text-sm text-muted-foreground mb-2">{testCase.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-green-400">Input:</p>
                      <pre className="mt-1 p-2 bg-black/30 rounded text-xs overflow-x-auto">
                        {testCase.input}
                      </pre>
                    </div>
                    <div>
                      <p className="font-medium text-blue-400">Expected Output:</p>
                      <pre className="mt-1 p-2 bg-black/30 rounded text-xs overflow-x-auto">
                        {testCase.expectedOutput}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Execution Results - Popup from bottom */}
      {executionResult && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
          <Card className={`glass-card rounded-t-xl rounded-b-none border-t-2 ${
            executionResult.status === 'success' ? 'border-t-green-500' : 'border-t-red-500'
          }`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className={`flex items-center gap-2 text-base ${
                  executionResult.status === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {executionResult.status === 'success' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  Status: {executionResult.statusDescription || (executionResult.status === 'success' ? 'Accepted' : 'Execution Failed')}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExecutionResult(null)}
                  className="h-8 w-8 p-0"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {(executionResult.output && !executionResult.error) && (
                  <div>
                    <p className="font-medium text-green-400 mb-2 text-sm">Output:</p>
                    <pre className="p-3 bg-black/30 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                      {executionResult.output}
                    </pre>
                  </div>
                )}

                {executionResult.error && (
                  <div>
                    <p className="font-medium text-red-400 mb-2 text-sm">Output:</p>
                    <pre className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                      {executionResult.error}
                    </pre>
                  </div>
                )}

                {(executionResult.executionTime || executionResult.memory) && (
                  <div className="flex flex-col gap-1 mt-4 text-sm text-muted-foreground">
                    {executionResult.executionTime && (
                      <span className="flex items-center gap-1">
                        Time: {executionResult.executionTime}s
                      </span>
                    )}
                    {executionResult.memory && (
                      <span className="flex items-center gap-1">
                        Memory: {executionResult.memory} KB
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </CodeEditorErrorBoundary>
  )
}
