/**
 * Validation Middleware for API Routes
 * 
 * This file provides middleware functions for validating API requests.
 * It handles validation errors and returns appropriate HTTP responses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

/**
 * Validation error response type
 */
export interface ValidationErrorResponse {
  success: false
  error: string
  errors?: Array<{
    field: string
    message: string
  }>
}

/**
 * Format Zod validation errors into user-friendly messages
 */
export function formatZodErrors(error: ZodError<any>): ValidationErrorResponse {
  const errors = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message
  }))

  return {
    success: false,
    error: 'Validation failed',
    errors
  }
}

/**
 * Validate request body against a Zod schema
 * 
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated data or null if validation fails
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)
    
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse = formatZodErrors(error)
      return {
        success: false,
        response: NextResponse.json(errorResponse, { status: 400 })
      }
    }
    
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: 'Invalid JSON in request body'
          },
          { status: 400 }
        )
      }
    }
    
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Failed to parse request body'
        },
        { status: 400 }
      )
    }
  }
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @param request - Next.js request object
 * @param schema - Zod schema to validate against
 * @returns Validated data or null if validation fails
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const { searchParams } = new URL(request.url)
    const params: Record<string, string> = {}
    
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    
    const validatedData = schema.parse(params)
    
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse = formatZodErrors(error)
      return {
        success: false,
        response: NextResponse.json(errorResponse, { status: 400 })
      }
    }
    
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters'
        },
        { status: 400 }
      )
    }
  }
}

/**
 * Validate path parameters against a Zod schema
 * 
 * @param params - Path parameters object
 * @param schema - Zod schema to validate against
 * @returns Validated data or null if validation fails
 */
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const validatedData = schema.parse(params)
    
    return {
      success: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse = formatZodErrors(error)
      return {
        success: false,
        response: NextResponse.json(errorResponse, { status: 400 })
      }
    }
    
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Invalid path parameters'
        },
        { status: 400 }
      )
    }
  }
}

/**
 * Sanitize HTML to prevent XSS attacks
 * 
 * @param html - HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
    .trim()
}

/**
 * Sanitize user input to prevent XSS attacks
 * 
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim()
}

/**
 * Validate and sanitize email
 * 
 * @param email - Email string
 * @returns Sanitized email or null if invalid
 */
export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = email.toLowerCase().trim()
  
  if (!emailRegex.test(sanitized)) {
    return null
  }
  
  return sanitized
}

/**
 * Validate UUID format
 * 
 * @param uuid - UUID string
 * @returns True if valid UUID, false otherwise
 */
export function isValidUuid(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Create a validation error response
 * 
 * @param message - Error message
 * @param errors - Optional array of field-specific errors
 * @returns NextResponse with validation error
 */
export function createValidationErrorResponse(
  message: string,
  errors?: Array<{ field: string; message: string }>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      errors
    },
    { status: 400 }
  )
}

/**
 * Create a success response
 * 
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with success data
 */
export function createSuccessResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data
    },
    { status }
  )
}

/**
 * Create an error response
 * 
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error
 */
export function createErrorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status }
  )
}

/**
 * Wrapper function for API route handlers with validation
 * 
 * @param handler - API route handler function
 * @param options - Validation options
 * @returns Wrapped handler with validation
 */
export function withValidation<TBody = unknown, TQuery = unknown, TParams = unknown>(
  handler: (
    request: NextRequest,
    context: {
      body?: TBody
      query?: TQuery
      params?: TParams
    }
  ) => Promise<NextResponse>,
  options?: {
    bodySchema?: z.ZodSchema<TBody>
    querySchema?: z.ZodSchema<TQuery>
    paramsSchema?: z.ZodSchema<TParams>
  }
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<Record<string, string | string[]>> }
  ): Promise<NextResponse> => {
    try {
      const validatedContext: {
        body?: TBody
        query?: TQuery
        params?: TParams
      } = {}

      // Validate request body
      if (options?.bodySchema) {
        const bodyValidation = await validateRequestBody(request, options.bodySchema)
        if (!bodyValidation.success) {
          return bodyValidation.response
        }
        validatedContext.body = bodyValidation.data
      }

      // Validate query parameters
      if (options?.querySchema) {
        const queryValidation = validateQueryParams(request, options.querySchema)
        if (!queryValidation.success) {
          return queryValidation.response
        }
        validatedContext.query = queryValidation.data
      }

      // Validate path parameters
      if (options?.paramsSchema && context?.params) {
        const resolvedParams = await context.params
        const paramsValidation = validatePathParams(resolvedParams, options.paramsSchema)
        if (!paramsValidation.success) {
          return paramsValidation.response
        }
        validatedContext.params = paramsValidation.data
      }

      // Call the handler with validated data
      return await handler(request, validatedContext)
    } catch (error) {
      console.error('API route error:', error)
      return createErrorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      )
    }
  }
}
