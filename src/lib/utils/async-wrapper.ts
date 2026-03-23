/**
 * Async Function Wrapper Utilities
 * 
 * Utilities for wrapping async functions with consistent error handling,
 * logging, and retry logic.
 */

import { ErrorHandler } from '@/lib/error-handler'
import {
  logError,
  isRetryableError,
  retryWithBackoff,
  type ErrorContext
} from './error-handling'

/**
 * Wrap an async API route handler with error handling
 * 
 * @param handler - Async handler function
 * @param context - Context for error logging
 * @returns Wrapped handler with error handling
 * 
 * @example
 * export const GET = wrapApiHandler(async (request) => {
 *   const data = await fetchData()
 *   return createSuccessResponse(data)
 * }, 'GET /api/users')
 */
export function wrapApiHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  context: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await handler(...args)
    } catch (error) {
      // Log error with context
      ErrorHandler.logError(error, context)
      
      // Re-throw to be handled by API response utilities
      throw error
    }
  }) as T
}

/**
 * Wrap an async service method with error handling and retry logic
 * 
 * @param fn - Async service method
 * @param context - Context for error logging
 * @param options - Options for retry logic
 * @returns Wrapped method with error handling and retry
 * 
 * @example
 * const fetchUser = wrapServiceMethod(
 *   async (id: string) => {
 *     return await supabase.from('users').select().eq('id', id).single()
 *   },
 *   'UserService.fetchUser',
 *   { maxRetries: 3 }
 * )
 */
export function wrapServiceMethod<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string,
  options: {
    maxRetries?: number
    baseDelay?: number
    enableRetry?: boolean
  } = {}
): T {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    enableRetry = true
  } = options

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const executeWithLogging = async (): Promise<ReturnType<T>> => {
      try {
        return await fn(...args)
      } catch (error) {
        // Log error with context
        ErrorHandler.logError(error, context)
        throw error
      }
    }

    // If retry is enabled and error is retryable, use retry logic
    if (enableRetry) {
      return await retryWithBackoff(executeWithLogging, maxRetries, baseDelay)
    }

    // Otherwise, just execute with logging
    return await executeWithLogging()
  }) as T
}

/**
 * Wrap an async database operation with error handling
 * 
 * @param fn - Async database operation
 * @param context - Context for error logging
 * @returns Wrapped operation with error handling
 * 
 * @example
 * const createUser = wrapDatabaseOperation(
 *   async (data: UserData) => {
 *     return await supabase.from('users').insert(data).select().single()
 *   },
 *   'Database.createUser'
 * )
 */
export function wrapDatabaseOperation<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      const result = await fn(...args)
      
      // Check for Supabase error in result
      if (result?.error) {
        throw result.error
      }
      
      return result
    } catch (error) {
      // Log database error
      ErrorHandler.logError(error, `Database: ${context}`)
      
      // Enhance error message for database errors
      const enhancedError = new Error(
        `Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      enhancedError.stack = error instanceof Error ? error.stack : undefined
      
      throw enhancedError
    }
  }) as T
}

/**
 * Wrap an async external API call with error handling and retry
 * 
 * @param fn - Async external API call
 * @param serviceName - Name of external service
 * @param options - Options for retry logic
 * @returns Wrapped call with error handling and retry
 * 
 * @example
 * const submitToJudge0 = wrapExternalApiCall(
 *   async (code: string) => {
 *     return await fetch('https://judge0.com/api/submissions', {
 *       method: 'POST',
 *       body: JSON.stringify({ code })
 *     })
 *   },
 *   'Judge0',
 *   { maxRetries: 5, baseDelay: 2000 }
 * )
 */
export function wrapExternalApiCall<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  serviceName: string,
  options: {
    maxRetries?: number
    baseDelay?: number
    timeout?: number
  } = {}
): T {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    timeout = 30000
  } = options

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const executeWithTimeout = async (): Promise<ReturnType<T>> => {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${serviceName} request timed out after ${timeout}ms`))
        }, timeout)
      })

      // Race between actual call and timeout
      return await Promise.race([
        fn(...args),
        timeoutPromise
      ])
    }

    try {
      return await retryWithBackoff(executeWithTimeout, maxRetries, baseDelay)
    } catch (error) {
      // Log external service error
      ErrorHandler.logError(error, `External Service: ${serviceName}`)
      
      // Enhance error message
      const enhancedError = new Error(
        `${serviceName} service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      enhancedError.stack = error instanceof Error ? error.stack : undefined
      
      throw enhancedError
    }
  }) as T
}

/**
 * Execute multiple async operations in parallel with error handling
 * 
 * @param operations - Array of async operations
 * @param context - Context for error logging
 * @returns Array of results (null for failed operations)
 * 
 * @example
 * const [users, problems, contests] = await executeParallel([
 *   () => fetchUsers(),
 *   () => fetchProblems(),
 *   () => fetchContests()
 * ], 'Dashboard.loadData')
 */
export async function executeParallel<T>(
  operations: Array<() => Promise<T>>,
  context: string
): Promise<Array<T | null>> {
  const results = await Promise.allSettled(
    operations.map(op => op())
  )

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      // Log error but don't throw
      ErrorHandler.logError(
        result.reason,
        `${context} - Operation ${index + 1}`
      )
      return null
    }
  })
}

/**
 * Execute async operations with a fallback value
 * 
 * @param fn - Async operation
 * @param fallback - Fallback value if operation fails
 * @param context - Context for error logging
 * @returns Operation result or fallback value
 * 
 * @example
 * const userCount = await withFallback(
 *   () => countUsers(),
 *   0,
 *   'Dashboard.getUserCount'
 * )
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    // Log error
    ErrorHandler.logError(error, context)
    
    // Return fallback
    console.log(`Using fallback value for ${context}`)
    return fallback
  }
}
