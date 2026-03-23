/**
 * Production-Ready Error Handling System
 * Provides consistent error responses and logging for 1000+ users
 */

import { NextResponse } from 'next/server'

export enum ErrorCode {
  // Authentication Errors (1xxx)
  AUTH_INVALID_CREDENTIALS = 1001,
  AUTH_SESSION_EXPIRED = 1002,
  AUTH_UNAUTHORIZED = 1003,
  AUTH_EMAIL_NOT_VERIFIED = 1004,
  AUTH_ACCOUNT_PENDING = 1005,
  AUTH_ACCOUNT_REJECTED = 1006,

  // Database Errors (2xxx)
  DB_CONNECTION_FAILED = 2001,
  DB_QUERY_FAILED = 2002,
  DB_TIMEOUT = 2003,
  DB_CONSTRAINT_VIOLATION = 2004,
  DB_NOT_FOUND = 2005,

  // Validation Errors (3xxx)
  VALIDATION_INVALID_INPUT = 3001,
  VALIDATION_MISSING_FIELD = 3002,
  VALIDATION_INVALID_FORMAT = 3003,

  // Rate Limiting (4xxx)
  RATE_LIMIT_EXCEEDED = 4001,

  // Server Errors (5xxx)
  SERVER_INTERNAL_ERROR = 5001,
  SERVER_SERVICE_UNAVAILABLE = 5002,
}

export interface AppError {
  code: ErrorCode
  message: string
  details?: any
  statusCode: number
  userMessage: string
}

export class ProductionError extends Error {
  code: ErrorCode
  statusCode: number
  userMessage: string
  details?: any

  constructor(error: AppError) {
    super(error.message)
    this.name = 'ProductionError'
    this.code = error.code
    this.statusCode = error.statusCode
    this.userMessage = error.userMessage
    this.details = error.details
  }
}

/**
 * Create standardized error responses
 */
export function createErrorResponse(error: ProductionError | Error, statusCode: number = 500) {
  if (error instanceof ProductionError) {
    // Log for monitoring
    console.error(`[${error.code}] ${error.message}`, error.details)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.userMessage,
          ...(process.env.NODE_ENV === 'development' && {
            details: error.details,
            stack: error.stack,
          }),
        },
      },
      { status: error.statusCode }
    )
  }

  // Generic error
  console.error('Unhandled error:', error)

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ErrorCode.SERVER_INTERNAL_ERROR,
        message: 'An unexpected error occurred. Please try again.',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          stack: error.stack,
        }),
      },
    },
    { status: statusCode }
  )
}

/**
 * Database error handler
 */
export function handleDatabaseError(error: any): ProductionError {
  console.error('Database error:', error)

  // Connection errors
  if (error.message?.includes('connection') || error.message?.includes('timeout')) {
    return new ProductionError({
      code: ErrorCode.DB_CONNECTION_FAILED,
      message: 'Database connection failed',
      details: error.message,
      statusCode: 503,
      userMessage: 'Unable to connect to the database. Please try again in a moment.',
    })
  }

  // Constraint violations
  if (error.code === '23505' || error.message?.includes('duplicate')) {
    return new ProductionError({
      code: ErrorCode.DB_CONSTRAINT_VIOLATION,
      message: 'Duplicate entry',
      details: error.message,
      statusCode: 409,
      userMessage: 'This record already exists.',
    })
  }

  // Not found
  if (error.code === 'PGRST116' || error.message?.includes('not found')) {
    return new ProductionError({
      code: ErrorCode.DB_NOT_FOUND,
      message: 'Record not found',
      details: error.message,
      statusCode: 404,
      userMessage: 'The requested resource was not found.',
    })
  }

  // Generic database error
  return new ProductionError({
    code: ErrorCode.DB_QUERY_FAILED,
    message: 'Database query failed',
    details: error.message,
    statusCode: 500,
    userMessage: 'A database error occurred. Please try again.',
  })
}

/**
 * Authentication error handler
 */
export function handleAuthError(error: any): ProductionError {
  console.error('Auth error:', error)

  if (error.message?.includes('Invalid login credentials')) {
    return new ProductionError({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      message: 'Invalid credentials',
      details: error.message,
      statusCode: 401,
      userMessage: 'Invalid email or password.',
    })
  }

  if (error.message?.includes('Email not confirmed')) {
    return new ProductionError({
      code: ErrorCode.AUTH_EMAIL_NOT_VERIFIED,
      message: 'Email not verified',
      details: error.message,
      statusCode: 403,
      userMessage: 'Please verify your email address before logging in.',
    })
  }

  return new ProductionError({
    code: ErrorCode.AUTH_UNAUTHORIZED,
    message: 'Authentication failed',
    details: error.message,
    statusCode: 401,
    userMessage: 'Authentication failed. Please try again.',
  })
}

/**
 * Validation error handler
 */
export function handleValidationError(field: string, message: string): ProductionError {
  return new ProductionError({
    code: ErrorCode.VALIDATION_INVALID_INPUT,
    message: `Validation failed for ${field}`,
    details: { field, message },
    statusCode: 400,
    userMessage: message,
  })
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(data: T, message?: string, statusCode: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: statusCode }
  )
}
