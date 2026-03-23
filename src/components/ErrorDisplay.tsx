'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Info, AlertCircle, XCircle, RefreshCw } from 'lucide-react'
import { formatErrorForDisplay, getErrorSeverity } from '@/lib/error-handling/user-friendly-errors'

interface ErrorDisplayProps {
  error: any
  context?: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorDisplay({ 
  error, 
  context, 
  onRetry, 
  onDismiss,
  className = '' 
}: ErrorDisplayProps) {
  const { title, message, suggestion, canRetry } = formatErrorForDisplay(error, context)
  const severity = getErrorSeverity(error)

  const severityConfig = {
    info: {
      icon: Info,
      className: 'border-blue-500/30 bg-blue-500/10',
      iconClassName: 'text-blue-400'
    },
    warning: {
      icon: AlertTriangle,
      className: 'border-yellow-500/30 bg-yellow-500/10',
      iconClassName: 'text-yellow-400'
    },
    error: {
      icon: AlertCircle,
      className: 'border-red-500/30 bg-red-500/10',
      iconClassName: 'text-red-400'
    },
    critical: {
      icon: XCircle,
      className: 'border-red-600/30 bg-red-600/10',
      iconClassName: 'text-red-500'
    }
  }

  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <Alert className={`${config.className} ${className}`}>
      <Icon className={`h-4 w-4 ${config.iconClassName}`} />
      <AlertTitle className="text-white font-semibold">{title}</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p className="text-sm text-white/80">{message}</p>
          <p className="text-sm text-white/60 italic">{suggestion}</p>
          
          {(canRetry && onRetry) || onDismiss ? (
            <div className="flex gap-2 pt-2">
              {canRetry && onRetry && (
                <Button 
                  onClick={onRetry} 
                  size="sm"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              )}
              {onDismiss && (
                <Button 
                  onClick={onDismiss} 
                  size="sm"
                  variant="ghost"
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  Dismiss
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </AlertDescription>
    </Alert>
  )
}

export default ErrorDisplay
