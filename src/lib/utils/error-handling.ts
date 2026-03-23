/**
 * Error Handling Utilities
 * 
 * Comprehensive error handling utilities for async functions.
 * Provides consistent error handling, logging, and user-friendly error messages.
 */

/**
 * Custom error classes for different error types
 */

/**
 * Base application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404)
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409)
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429)
  }
}

/**
 * External service error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `${service} service unavailable`, 502)
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(`Database error: ${message}`, 500)
  }
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  userId?: string
  endpoint?: string
  method?: string
  params?: Record<string, any>
  timestamp?: string
  [key: string]: any
}

/**
 * Log error with context
 * 
 * @param error - Error to log
 * @param context - Additional context
 */
export function logError(error: Error | AppError, context?: ErrorContext): void {
  const errorInfo = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    statusCode: error instanceof AppError ? error.statusCode : 500,
    isOperational: error instanceof AppError ? error.isOperational : false,
    context: {
      ...context,
      timestamp: new Date().toISOString()
    }
  }

  // Log to console (in production, this would go to a logging service)
  if (errorInfo.statusCode >= 500) {
    console.error('🔴 Server Error:', errorInfo)
  } else if (errorInfo.statusCode >= 400) {
    console.warn('🟡 Client Error:', errorInfo)
  } else {
    console.log('ℹ️ Error:', errorInfo)
  }

  // In production, send to error tracking service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error, { contexts: { custom: context } })
  }
}

/**
 * Get user-friendly error message
 * 
 * @param error - Error object
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError): string {
  // If it's an AppError, use its message (already user-friendly)
  if (error instanceof AppError) {
    return error.message
  }

  // Map common error patterns to user-friendly messages
  const errorMessage = error.message.toLowerCase()

  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your internet connection and try again.'
  }

  if (errorMessage.includes('timeout')) {
    return 'Request timed out. Please try again.'
  }

  if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
    return 'Please log in to continue.'
  }

  if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
    return 'You do not have permission to perform this action.'
  }

  if (errorMessage.includes('not found')) {
    return 'The requested resource was not found.'
  }

  if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
    return 'This item already exists.'
  }

  if (errorMessage.includes('invalid')) {
    return 'Invalid input. Please check your data and try again.'
  }

  if (errorMessage.includes('database') || errorMessage.includes('sql')) {
    return 'Database error. Please try again later.'
  }

  // Default message for unknown errors
  return 'An unexpected error occurred. Please try again later.'
}

/**
 * Determine if error should be retried
 * 
 * @param error - Error object
 * @returns True if error is retryable
 */
export function isRetryableError(error: Error | AppError): boolean {
  if (error instanceof AppError) {
    // Don't retry client errors (4xx)
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return false
    }
    // Retry server errors (5xx) except for specific cases
    return error.statusCode >= 500
  }

  const errorMessage = error.message.toLowerCase()

  // Retry network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return true
  }

  // Retry timeout errors
  if (errorMessage.includes('timeout')) {
    return true
  }

  // Retry rate limit errors (with backoff)
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    return true
  }

  // Don't retry by default
  return false
}

/**
 * Retry an async function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Promise with function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry if it's not a retryable error
      if (!isRetryableError(lastError)) {
        throw lastError
      }

      // Don't retry if we've exhausted all attempts
      if (attempt === maxRetries) {
        throw lastError
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Wrap an async function with error handling
 * 
 * @param fn - Async function to wrap
 * @param context - Error context
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Omit<ErrorContext, 'timestamp'>
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error as Error, context)
      throw error
    }
  }) as T
}

/**
 * Wrap an async function with retry logic
 * 
 * @param fn - Async function to wrap
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Wrapped function with retry logic
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3,
  baseDelay: number = 1000
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return await retryWithBackoff(() => fn(...args), maxRetries, baseDelay)
  }) as T
}

/**
 * Safe async function execution with fallback
 * 
 * @param fn - Async function to execute
 * @param fallback - Fallback value if function fails
 * @param context - Error context
 * @returns Function result or fallback value
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: ErrorContext
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logError(error as Error, context)
    return fallback
  }
}

/**
 * Validate and throw if condition is false
 * 
 * @param condition - Condition to check
 * @param message - Error message
 * @param ErrorClass - Error class to throw (default: ValidationError)
 */
export function assert(
  condition: boolean,
  message: string,
  ErrorClass: typeof AppError = ValidationError
): asserts condition {
  if (!condition) {
    throw new ErrorClass(message)
  }
}

/**
 * Validate required fields
 * 
 * @param data - Data object to validate
 * @param requiredFields - Array of required field names
 * @throws ValidationError if any required field is missing
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`
    )
  }
}
