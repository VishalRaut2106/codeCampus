'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Editor, { Monaco } from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Play, Send, RotateCcw, Save, Keyboard } from 'lucide-react'
import type { ProgrammingLanguage } from '@/types'
import {
  getTemplate,
  saveCode,
  loadCode,
  autoSave as setupAutoSave,
} from '@/lib/editor'
import { toast } from 'sonner'

/**
 * Enhanced Code Editor Props
 */
export interface EnhancedCodeEditorProps {
  problemId: string
  language: ProgrammingLanguage
  onLanguageChange: (language: ProgrammingLanguage) => void
  onCodeChange: (code: string) => void
  onRun: () => void
  onSubmit: () => void
  isRunning: boolean
  isSubmitting: boolean
  readOnly?: boolean
  height?: string
}

/**
 * Supported languages for the editor
 */
const SUPPORTED_LANGUAGES: { value: ProgrammingLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
]

/**
 * EnhancedCodeEditor Component
 * 
 * A LeetCode-style code editor with Monaco integration, featuring:
 * - Language selection with templates
 * - Auto-save functionality
 * - Code persistence across language switches
 * - Keyboard shortcuts
 * - Reset to template
 */
export default function EnhancedCodeEditor({
  problemId,
  language,
  onLanguageChange,
  onCodeChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  readOnly = false,
  height = '60vh',
}: EnhancedCodeEditorProps) {
  const [code, setCode] = useState<string>('')
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false)
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const autoSaveCleanupRef = useRef<(() => void) | null>(null)

  /**
   * Load code from localStorage or template
   */
  const loadCodeForLanguage = useCallback(
    async (lang: ProgrammingLanguage) => {
      setIsLoadingTemplate(true)
      try {
        // Try to load saved code first
        const savedCode = loadCode(problemId, lang)

        if (savedCode) {
          setCode(savedCode)
          onCodeChange(savedCode)
        } else {
          // Load template if no saved code
          const template = getTemplate(problemId, lang)
          setCode(template)
          onCodeChange(template)
        }
      } catch (error) {
        console.error('Failed to load code:', error)
        toast.error('Failed to load code')
      } finally {
        setIsLoadingTemplate(false)
      }
    },
    [problemId, onCodeChange]
  )

  /**
   * Initialize code on mount and language change
   */
  useEffect(() => {
    loadCodeForLanguage(language)
  }, [language, loadCodeForLanguage])

  /**
   * Set up auto-save
   */
  useEffect(() => {
    // Clean up previous auto-save
    if (autoSaveCleanupRef.current) {
      autoSaveCleanupRef.current()
    }

    // Set up new auto-save (every 30 seconds)
    autoSaveCleanupRef.current = setupAutoSave(
      problemId,
      language,
      () => code,
      30000
    )

    // Update last saved timestamp
    const interval = setInterval(() => {
      if (code) {
        setLastSavedAt(new Date())
      }
    }, 30000)

    return () => {
      if (autoSaveCleanupRef.current) {
        autoSaveCleanupRef.current()
      }
      clearInterval(interval)
    }
  }, [problemId, language, code])

  /**
   * Handle editor mount
   */
  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure Monaco theme
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
      },
    })

    monaco.editor.setTheme('codepvg-dark')

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!isRunning) {
        onRun()
      }
    })

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => {
        if (!isSubmitting) {
          onSubmit()
        }
      }
    )

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleManualSave()
    })

    // Add ? key for shortcuts help (when editor is not focused on typing)
    editor.addCommand(monaco.KeyCode.Shift | monaco.KeyCode.Slash, () => {
      setShowShortcutsDialog(true)
    })
  }

  /**
   * Handle code change
   */
  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || ''
    setCode(newCode)
    onCodeChange(newCode)
  }

  /**
   * Handle language change
   */
  const handleLanguageChange = (newLanguage: ProgrammingLanguage) => {
    // Save current code before switching
    if (code) {
      saveCode(problemId, language, code)
    }

    // Change language
    onLanguageChange(newLanguage)
  }

  /**
   * Handle manual save
   */
  const handleManualSave = () => {
    if (code) {
      saveCode(problemId, language, code)
      setLastSavedAt(new Date())
      toast.success('Code saved successfully')
    }
  }

  /**
   * Handle reset to template
   */
  const handleResetToTemplate = () => {
    const template = getTemplate(problemId, language)
    setCode(template)
    onCodeChange(template)
    saveCode(problemId, language, template)
    setShowResetDialog(false)
    toast.success('Code reset to template')
  }

  /**
   * Format last saved time
   */
  const formatLastSaved = () => {
    if (!lastSavedAt) return 'Not saved'

    const now = new Date()
    const diff = Math.floor((now.getTime() - lastSavedAt.getTime()) / 1000)

    if (diff < 60) return 'Saved just now'
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)}m ago`
    return `Saved ${Math.floor(diff / 3600)}h ago`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetDialog(true)}
            disabled={readOnly || isLoadingTemplate}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          {/* Manual Save Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={readOnly || !code}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Last Saved Indicator */}
          <span className="text-xs text-muted-foreground">
            {formatLastSaved()}
          </span>

          {/* Keyboard Shortcuts Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcutsDialog(true)}
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </Button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height={height}
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">
                  {isLoadingTemplate ? 'Loading template...' : 'Loading editor...'}
                </p>
              </div>
            </div>
          }
          options={{
            minimap: { enabled: window.innerWidth > 768 },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: readOnly || isRunning || isSubmitting,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            padding: { top: 16, bottom: 16 },
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between p-3 border-t border-border bg-card">
        <div className="text-xs text-muted-foreground">
          Press Ctrl+Enter to run, Ctrl+Shift+Enter to submit
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onRun}
            disabled={isRunning || !code.trim() || readOnly}
            variant="outline"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Code
              </>
            )}
          </Button>

          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !code.trim() || readOnly}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
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

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace your current code with the default template for{' '}
              {SUPPORTED_LANGUAGES.find((l) => l.value === language)?.label}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetToTemplate}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Keyboard Shortcuts Dialog */}
      <AlertDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keyboard Shortcuts</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Run Code</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">
                Ctrl + Enter
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Submit Code</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">
                Ctrl + Shift + Enter
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Save Code</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">
                Ctrl + S
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Toggle Comment</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">
                Ctrl + /
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Show Shortcuts</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">?</kbd>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
