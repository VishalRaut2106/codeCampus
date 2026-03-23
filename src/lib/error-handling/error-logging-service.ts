// Centralized Error Logging Service for CodePVG
// Logs all errors with context and sends to monitoring services

export interface ErrorContext {
  userId?: string
  endpoint?: string
  timestamp: Date
  userAgent?: string
  url?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

export interface LoggedError {
  id: string
  error: Error
  context: ErrorContext
  stackTrace?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class ErrorLoggingService {
  private errors: LoggedError[] = []
  private maxStoredErrors = 100
  private monitoringEnabled = false

  constructor() {
    // Check if monitoring service is configured
    this.monitoringEnabled = this.isMonitoringConfigured()
  }

  private isMonitoringConfigured(): boolean {
    // Check for Sentry, LogRocket, or other monitoring service configuration
    if (typeof window === 'undefined') {
      return false
    }
    
    return !!(
      (window as any).Sentry ||
      (window as any).LogRocket
    )
  }

  /**
   * Log an error with full context
   */
  logError(
    error: Error,
    context: Partial<ErrorContext> = {},
    severity: LoggedError['severity'] = 'medium'
  ): string {
    const errorId = this.generateErrorId()
    
    const fullContext: ErrorContext = {
      timestamp: new Date(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...context
    }

    const loggedError: LoggedError = {
      id: errorId,
      error,
      context: fullContext,
      stackTrace: error.stack,
      severity
    }

    // Store error locally
    this.storeError(loggedError)

    // Log to console with formatting
    this.consoleLog(loggedError)

    // Send to monitoring service if available
    if (this.monitoringEnabled) {
      this.sendToMonitoring(loggedError)
    }

    // Send to backend logging endpoint
    this.sendToBackend(loggedError)

    return errorId
  }

  /**
   * Log API errors specifically
   */
  logAPIError(
    error: Error,
    endpoint: string,
    userId?: string,
    metadata?: Record<string, any>
  ): string {
    return this.logError(
      error,
      {
        endpoint,
        userId,
        metadata,
        component: 'API'
      },
      'high'
    )
  }

  /**
   * Log component errors
   */
  logComponentError(
    error: Error,
    component: string,
    userId?: string,
    action?: string
  ): string {
    return this.logError(
      error,
      {
        component,
        userId,
        action
      },
      'medium'
    )
  }

  /**
   * Log critical errors that require immediate attention
   */
  logCriticalError(
    error: Error,
    context: Partial<ErrorContext> = {}
  ): string {
    return this.logError(error, context, 'critical')
  }

  /**
   * Get all logged errors
   */
  getErrors(): LoggedError[] {
    return [...this.errors]
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: LoggedError['severity']): LoggedError[] {
    return this.errors.filter(e => e.severity === severity)
  }

  /**
   * Clear all stored errors
   */
  clearErrors(): void {
    this.errors = []
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number
    bySeverity: Record<LoggedError['severity'], number>
    byComponent: Record<string, number>
  } {
    const stats = {
      total: this.errors.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byComponent: {} as Record<string, number>
    }

    this.errors.forEach(error => {
      stats.bySeverity[error.severity]++
      
      const component = error.context.component || 'unknown'
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1
    })

    return stats
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private storeError(error: LoggedError): void {
    this.errors.unshift(error)
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors)
    }
  }

  private consoleLog(error: LoggedError): void {
    const severityColors = {
      low: '#3b82f6',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    }

    const color = severityColors[error.severity]

    console.group(
      `%c[${error.severity.toUpperCase()}] Error ${error.id}`,
      `color: ${color}; font-weight: bold;`
    )
    
    console.error('Error:', error.error)
    console.log('Context:', error.context)
    
    if (error.stackTrace) {
      console.log('Stack Trace:', error.stackTrace)
    }
    
    console.groupEnd()
  }

  private sendToMonitoring(error: LoggedError): void {
    try {
      // Send to Sentry if available
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error.error, {
          level: error.severity === 'critical' ? 'fatal' : error.severity,
          tags: {
            component: error.context.component,
            endpoint: error.context.endpoint
          },
          user: error.context.userId ? { id: error.context.userId } : undefined,
          extra: error.context.metadata
        })
      }

      // Send to LogRocket if available
      if (typeof window !== 'undefined' && (window as any).LogRocket) {
        (window as any).LogRocket.captureException(error.error, {
          tags: {
            severity: error.severity,
            component: error.context.component
          },
          extra: error.context
        })
      }
    } catch (monitoringError) {
      console.error('Failed to send error to monitoring service:', monitoringError)
    }
  }

  private async sendToBackend(error: LoggedError): Promise<void> {
    try {
      // Send error to backend logging endpoint
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errorId: error.id,
          message: error.error.message,
          stack: error.stackTrace,
          severity: error.severity,
          context: error.context
        })
      }).catch(() => {
        // Silently fail if backend logging is unavailable
        // We don't want logging failures to break the app
      })
    } catch (backendError) {
      // Silently fail - logging should never break the app
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLoggingService()

// Setup global error handlers
export function setupGlobalErrorLogging() {
  if (typeof window !== 'undefined') {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      errorLogger.logError(
        event.error || new Error(event.message),
        {
          component: 'Global',
          action: 'Uncaught Error',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        },
        'high'
      )
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      errorLogger.logError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'Global',
          action: 'Unhandled Promise Rejection'
        },
        'high'
      )
    })
  }
}
