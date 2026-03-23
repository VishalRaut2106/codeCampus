/**
 * API Response Utilities
 * 
 * Common utility functions for creating consistent API responses across all endpoints.
 * Provides standardized success and error responses with proper status codes.
 */

import { NextResponse } from 'next/server'

/**
 * Standard API response interface
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

/**
 * Create a success response
 * 
 * @param data - Response data
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success data
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

/**
 * Create an error response
 * 
 * @param error - Error object or message
 * @param status - HTTP status code (default: 500)
 * @param logContext - Optional context for logging
 * @returns NextResponse with error details
 */
export function createErrorResponse(
  error: Error | string,
  status: number = 500,
  logContext?: string
): NextResponse<APIResponse> {
  const errorMessage = error instanceof Error ? error.message : error
  
  // Log error with context
  if (logContext) {
    console.error(`[${logContext}] Error:`, error)
  } else {
    console.error('API Error:', error)
  }
  
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    },
    { status }
  )
}

/**
 * Create a validation error response
 * 
 * @param errors - Validation error messages
 * @returns NextResponse with validation errors
 */
export function createValidationErrorResponse(
  errors: string | string[]
): NextResponse<APIResponse> {
  const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors
  
  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    },
    { status: 400 }
  )
}

/**
 * Create an unauthorized response
 * 
 * @param message - Optional custom message
 * @returns NextResponse with 401 status
 */
export function createUnauthorizedResponse(
  message: string = 'Authentication required'
): NextResponse<APIResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    },
    { status: 401 }
  )
}

/**
 * Create a forbidden response
 * 
 * @param message - Optional custom message
 * @returns NextResponse with 403 status
 */
export function createForbiddenResponse(
  message: string = 'Insufficient permissions'
): NextResponse<APIResponse> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    },
    { status: 403 }
  )
}

/**
 * Create a not found response
 * 
 * @param resource - Resource that was not found
 * @returns NextResponse with 404 status
 */
export function createNotFoundResponse(
  resource: string = 'Resource'
): NextResponse<APIResponse> {
  return NextResponse.json(
    {
      success: false,
      error: `${resource} not found`,
      timestamp: new Date().toISOString()
    },
    { status: 404 }
  )
}

/**
 * Create a rate limit response
 * 
 * @param retryAfter - Seconds until retry is allowed
 * @returns NextResponse with 429 status
 */
export function createRateLimitResponse(
  retryAfter?: number
): NextResponse<APIResponse> {
  const headers: Record<string, string> = {}
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString()
  }
  
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString()
    },
    { status: 429, headers }
  )
}

/**
 * Wrap an async API handler with error handling
 * 
 * @param handler - Async function to execute
 * @param context - Context for error logging
 * @returns Promise<NextResponse>
 */
export async function withErrorHandling(
  handler: () => Promise<NextResponse>,
  context?: string
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    return createErrorResponse(error as Error, 500, context)
  }
}
