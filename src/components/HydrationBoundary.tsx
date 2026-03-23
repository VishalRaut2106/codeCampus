'use client'

import { useHydration } from '@/hooks/useHydration'

interface HydrationBoundaryProps {
  children: React.ReactNode
}

export default function HydrationBoundary({ children }: HydrationBoundaryProps) {
  const isHydrated = useHydration()

  // Show loading state during hydration to prevent flash
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
