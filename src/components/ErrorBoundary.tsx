'use client'

import React, { Component, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { errorLogger } from '@/lib/error-handling/error-logging-service'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with centralized logging service
    const errorId = errorLogger.logComponentError(
      error,
      'ErrorBoundary',
      undefined,
      'Component Render Error'
    )

    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null,
      errorId
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Something went wrong</p>
                  <p className="text-sm text-muted-foreground">
                    An error occurred while loading this page. This might be due to a database configuration issue.
                  </p>
                  
                  {this.state.errorId && (
                    <p className="text-xs text-muted-foreground">
                      Error ID: {this.state.errorId}
                    </p>
                  )}
                  
                  {this.state.error && (
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium">Error details</summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                        {this.state.error.message}
                        {this.state.errorInfo && (
                          <>
                            {'\n\nComponent Stack:'}
                            {this.state.errorInfo}
                          </>
                        )}
                      </pre>
                    </details>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button onClick={this.handleReset} size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    <Button 
                      onClick={() => window.location.href = '/dashboard/admin?tab=setup'} 
                      variant="outline" 
                      size="sm"
                    >
                      Check Database Setup
                    </Button>
                  </div>
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

export default ErrorBoundary