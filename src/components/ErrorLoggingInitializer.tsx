'use client'

import { useEffect } from 'react'
import { setupGlobalErrorLogging } from '@/lib/error-handling/error-logging-service'

export function ErrorLoggingInitializer() {
  useEffect(() => {
    // Initialize global error logging on client side only
    setupGlobalErrorLogging()
  }, [])

  return null
}
