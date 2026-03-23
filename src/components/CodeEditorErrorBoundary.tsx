'use client'

import React, { Component, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Code } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class CodeEditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CodeEditor error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 min-h-[400px]">
          <div className="max-w-md w-full">
            <Alert className="glass-card border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-red-400" />
                    <p className="font-semibold text-white">Code Editor Error</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The code editor encountered an error and needs to be reloaded.
                  </p>
                  
                  {this.state.error && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium text-white/80 hover:text-white">
                        Technical details
                      </summary>
                      <pre className="mt-2 p-2 bg-black/30 rounded text-xs overflow-auto max-h-32">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                  
                  <Button 
                    onClick={this.handleReset} 
                    size="sm"
                    className="w-full glass-button"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reload Editor
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default CodeEditorErrorBoundary
