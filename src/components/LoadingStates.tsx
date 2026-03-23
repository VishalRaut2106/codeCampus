'use client'

import { Loader2 } from 'lucide-react'

// Loading Spinner
export function LoadingSpinner({ size = 'md', className = '' }: { 
  size?: 'sm' | 'md' | 'lg'
  className?: string 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

// Full Page Loading
export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-[#00C896]" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

// Card Loading Skeleton
export function CardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-white/10 rounded w-3/4"></div>
        <div className="h-4 bg-white/10 rounded w-1/2"></div>
        <div className="h-4 bg-white/10 rounded w-5/6"></div>
      </div>
    </div>
  )
}

// Table Loading Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded">
          <div className="h-10 w-10 bg-white/10 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Button Loading State
export function ButtonLoading({ children, loading, ...props }: any) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}

// Inline Loading
export function InlineLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <LoadingSpinner size="sm" />
      <span>{message}</span>
    </div>
  )
}

// Progress Bar
export function ProgressBar({ 
  progress, 
  message 
}: { 
  progress: number
  message?: string 
}) {
  return (
    <div className="space-y-2">
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#00C896] to-[#00A076] transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {Math.round(progress)}%
      </p>
    </div>
  )
}

// Overlay Loading
export function OverlayLoading({ message = 'Processing...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-8 flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-[#00C896]" />
        <p className="text-white font-medium">{message}</p>
      </div>
    </div>
  )
}

// Skeleton Text
export function SkeletonText({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number
  className?: string 
}) {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-white/10 rounded"
          style={{ width: `${Math.random() * 30 + 60}%` }}
        />
      ))}
    </div>
  )
}

// Avatar Skeleton
export function AvatarSkeleton() {
  return (
    <div className="h-10 w-10 bg-white/10 rounded-full animate-pulse" />
  )
}

// Grid Skeleton
export function GridSkeleton({ 
  items = 6, 
  columns = 3 
}: { 
  items?: number
  columns?: number 
}) {
  return (
    <div 
      className="grid gap-4 animate-pulse"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="glass-card p-6">
          <div className="space-y-4">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
