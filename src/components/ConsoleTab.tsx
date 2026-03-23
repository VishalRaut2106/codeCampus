"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ConsoleOutput } from '@/lib/editor/types'
import { Terminal, AlertCircle, CheckCircle } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface ConsoleTabProps {
  consoleOutput: ConsoleOutput
  className?: string
}

// ============================================================================
// OUTPUT SECTION COMPONENT
// ============================================================================

interface OutputSectionProps {
  title: string
  content: string
  type: 'stdout' | 'stderr' | 'compile'
  icon: React.ReactNode
}

function OutputSection({ title, content, type, icon }: OutputSectionProps) {
  if (!content || content.trim() === '') {
    return null
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'stdout':
        return {
          border: 'border-green-500/30',
          bg: 'bg-green-500/5',
          text: 'text-green-300',
          badge: 'bg-green-600 text-white border-green-500'
        }
      case 'stderr':
        return {
          border: 'border-red-500/30',
          bg: 'bg-red-500/5',
          text: 'text-red-300',
          badge: 'bg-red-600 text-white border-red-500'
        }
      case 'compile':
        return {
          border: 'border-orange-500/30',
          bg: 'bg-orange-500/5',
          text: 'text-orange-300',
          badge: 'bg-orange-600 text-white border-orange-500'
        }
      default:
        return {
          border: 'border-gray-500/30',
          bg: 'bg-gray-500/5',
          text: 'text-gray-300',
          badge: 'bg-gray-600 text-white border-gray-500'
        }
    }
  }

  const styles = getTypeStyles()

  // Extract line numbers from error messages
  const formatContentWithLineNumbers = (content: string) => {
    // Common patterns for line numbers in error messages
    const lineNumberPatterns = [
      /line (\d+)/gi,
      /at line (\d+)/gi,
      /:(\d+):/g,
      /\(line (\d+)\)/gi
    ]

    let formattedContent = content
    
    lineNumberPatterns.forEach(pattern => {
      formattedContent = formattedContent.replace(pattern, (match, lineNum) => {
        return `<span class="bg-yellow-600/30 text-yellow-300 px-1 rounded">${match}</span>`
      })
    })

    return formattedContent
  }

  return (
    <Card className={cn('border', styles.border, styles.bg)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white flex items-center space-x-2">
            {icon}
            <span>{title}</span>
          </CardTitle>
          <Badge className={styles.badge}>
            {content.split('\n').length} lines
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <pre 
          className={cn(
            'p-3 bg-gray-900 rounded text-sm whitespace-pre-wrap font-mono overflow-x-auto',
            styles.text
          )}
          dangerouslySetInnerHTML={{ 
            __html: type === 'stderr' || type === 'compile' 
              ? formatContentWithLineNumbers(content)
              : content
          }}
        />
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConsoleTab({ consoleOutput, className }: ConsoleTabProps) {
  const { stdout, stderr, compileOutput } = consoleOutput

  const hasOutput = stdout || stderr || compileOutput

  if (!hasOutput) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="flex flex-col items-center space-y-2">
          <Terminal className="h-8 w-8 text-gray-500" />
          <span className="text-gray-400">No console output</span>
          <span className="text-sm text-gray-500">
            Run your code to see output, errors, and compilation messages
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Compilation Output */}
      {compileOutput && (
        <OutputSection
          title="Compilation Output"
          content={compileOutput}
          type="compile"
          icon={<AlertCircle className="h-4 w-4" />}
        />
      )}

      {/* Standard Output */}
      {stdout && (
        <OutputSection
          title="Standard Output (stdout)"
          content={stdout}
          type="stdout"
          icon={<CheckCircle className="h-4 w-4" />}
        />
      )}

      {/* Standard Error */}
      {stderr && (
        <OutputSection
          title="Standard Error (stderr)"
          content={stderr}
          type="stderr"
          icon={<AlertCircle className="h-4 w-4" />}
        />
      )}

      {/* Help Text */}
      <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
        <div className="flex items-start space-x-2">
          <span className="text-blue-400 text-sm">💡</span>
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Console Output Guide:</p>
            <ul className="space-y-1 text-xs">
              <li>• <span className="text-green-300">stdout</span>: Normal program output (print statements, return values)</li>
              <li>• <span className="text-red-300">stderr</span>: Runtime errors and warnings</li>
              <li>• <span className="text-orange-300">Compilation</span>: Syntax errors and compilation messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsoleTab