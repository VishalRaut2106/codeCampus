'use client'

import { CheckCircle, Check, Trophy, Star, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SuccessConfirmationProps {
  title: string
  message?: string
  icon?: 'check' | 'trophy' | 'star' | 'zap'
  onClose?: () => void
  action?: {
    label: string
    onClick: () => void
  }
}

export function SuccessConfirmation({
  title,
  message,
  icon = 'check',
  onClose,
  action
}: SuccessConfirmationProps) {
  const icons = {
    check: CheckCircle,
    trophy: Trophy,
    star: Star,
    zap: Zap
  }

  const Icon = icons[icon]

  return (
    <Card className="glass-card border-green-500/30 bg-green-500/10">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-green-400" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-white">{title}</h3>
            {message && (
              <p className="text-sm text-white/80">{message}</p>
            )}
            {(action || onClose) && (
              <div className="flex gap-2 pt-2">
                {action && (
                  <Button
                    onClick={action.onClick}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {action.label}
                  </Button>
                )}
                {onClose && (
                  <Button
                    onClick={onClose}
                    size="sm"
                    variant="ghost"
                    className="text-white/60 hover:text-white"
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Inline success indicator
export function InlineSuccess({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-green-400">
      <Check className="h-4 w-4" />
      <span>{message}</span>
    </div>
  )
}

// Success badge
export function SuccessBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
      <Check className="h-3 w-3" />
      {children}
    </div>
  )
}

// Animated success checkmark
export function AnimatedCheckmark({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-green-500/20 flex items-center justify-center animate-scale-in`}>
      <CheckCircle className={`${sizeClasses[size]} text-green-400`} />
    </div>
  )
}

// Success modal overlay
export function SuccessModal({
  title,
  message,
  onClose,
  action
}: SuccessConfirmationProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="glass-card max-w-md w-full mx-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <AnimatedCheckmark size="lg" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              {message && (
                <p className="text-white/80">{message}</p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              {action && (
                <Button
                  onClick={action.onClick}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {action.label}
                </Button>
              )}
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-white/20"
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
