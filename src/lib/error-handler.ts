// Comprehensive Error Handler for codCampus
// Handles all types of errors with proper logging and user feedback

import { getUserFriendlyError, sanitizeErrorMessage } from './error-handling/user-friendly-errors'

export interface ErrorInfo {
  code?: string
  message: string
  details?: string
  hint?: string
  timestamp: string
  context?: string
  userId?: string
  userFriendlyMessage?: string
}

export class ErrorHandler {
  static logError(error: any, context: string, userId?: string): ErrorInfo {
    // Handle completely empty or malformed error objects
    if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
      const emptyErrorInfo: ErrorInfo = {
        code: 'EMPTY_ERROR',
        message: 'Empty or malformed error object received',
        details: 'This usually indicates a Supabase client initialization issue or network problem',
        hint: 'Check your Supabase configuration and network connection',
        timestamp: new Date().toISOString(),
        context,
        userId,
        userFriendlyMessage: 'Database connection issue detected. Please check your internet connection and try again.'
      }

      console.error(`[${context}] Empty error object detected:`, {
        ...emptyErrorInfo,
        originalError: error,
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : 'null/undefined'
      })

      return emptyErrorInfo
    }

    // Get user-friendly message
    const friendlyError = getUserFriendlyError(error)

    const errorInfo: ErrorInfo = {
      code: error?.code || 'unknown',
      message: error?.message || 'Unknown error occurred',
      details: error?.details || 'No additional details available',
      hint: error?.hint || 'No hints available',
      timestamp: new Date().toISOString(),
      context,
      userId,
      userFriendlyMessage: friendlyError.message
    }

    // Enhanced logging with better error inspection
    if (error && Object.keys(error).length > 0) {
      try {
        console.error(`[${context}] Error occurred:`, {
          ...errorInfo,
          fullError: error,
          errorString: String(error),
          errorJSON: JSON.stringify(error, null, 2),
          errorConstructor: error?.constructor?.name,
          errorPrototype: Object.getPrototypeOf(error),
          errorDescriptors: Object.getOwnPropertyDescriptors(error)
        })
      } catch (inspectionError) {
        console.error(`[${context}] Error occurred (inspection failed):`, {
          ...errorInfo,
          fullError: error,
          errorString: String(error),
          inspectionError: inspectionError
        })
      }
    } else {
      console.error(`[${context}] Empty error object - RLS policy infinite recursion detected:`, {
        ...errorInfo,
        errorType: 'Empty Object',
        likelyCause: 'RLS Policy Infinite Recursion',
        recommendation: 'Run EMERGENCY_RLS_FIX.sql script in Supabase SQL Editor',
        fixSteps: [
          '1. Go to Supabase Dashboard → SQL Editor',
          '2. Copy and paste EMERGENCY_RLS_FIX.sql',
          '3. Run the script and wait for success',
          '4. Refresh the application'
        ]
      })
    }

    return errorInfo
  }

  static getErrorMessage(error: any, context: string): string {
    // Get user-friendly error message
    const friendlyError = getUserFriendlyError(error)
    return friendlyError.message
  }

  static getUserFriendlyMessage(error: any): string {
    const friendlyError = getUserFriendlyError(error)
    return friendlyError.message
  }

  static getSanitizedMessage(error: any): string {
    return sanitizeErrorMessage(error)
  }

  static isRetryableError(error: any): boolean {
    const friendlyError = getUserFriendlyError(error)
    return friendlyError.isRetryable
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attempt), 30000)
  }
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandler() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      ErrorHandler.logError(event.error, 'Global Error Handler')
    })

    window.addEventListener('unhandledrejection', (event) => {
      ErrorHandler.logError(event.reason, 'Unhandled Promise Rejection')
    })
  }
}
