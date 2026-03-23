'use client'

import { useEffect } from 'react'
import { animationController } from '@/lib/animations/gsap'

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize GSAP animations
    animationController.init()

    // Cleanup on unmount
    return () => {
      animationController.destroy()
    }
  }, [])

  return <>{children}</>
}
