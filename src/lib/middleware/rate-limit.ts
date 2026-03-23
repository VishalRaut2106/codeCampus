/**
 * Rate Limiting Middleware for CodePVG
 * 
 * This middleware implements rate limiting to prevent abuse and DoS attacks.
 * It uses an in-memory store for simplicity, but can be extended to use Redis for production.
 * 
 * Features:
 * - Per-user rate limiting
 * - Per-IP rate limiting (fallback for unauthenticated users)
 * - Configurable limits and windows
 * - Automatic cleanup of expired entries
 * - Clear error messages with retry-after headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number
  
  /**
   * Time window in milliseconds
   */
  windowMs: number
  
  /**
   * Custom error message
   */
  message?: string
  
  /**
   * Skip rate limiting for certain conditions
   */
  skip?: (request: NextRequest) => boolean | Promise<boolean>
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number
  resetTime: number
}

/**
 * In-memory store for rate limiting
 * In production, consider using Redis for distributed rate limiting
 */
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  /**
   * Get rate limit entry for a key
   */
  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key)
    
    // Remove expired entries
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key)
      return undefined
    }
    
    return entry
  }

  /**
   * Set rate limit entry for a key
   */
  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry)
  }

  /**
   * Increment request count for a key
   */
  increment(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now()
    const entry = this.get(key)

    if (!entry) {
      // Create new entry
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs
      }
      this.set(key, newEntry)
      return newEntry
    }

    // Increment existing entry
    entry.count++
    this.set(key, entry)
    return entry
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.store.delete(key)
    }

    if (keysToDelete.length > 0) {
      console.log(`[Rate Limit] Cleaned up ${keysToDelete.length} expired entries`)
    }
  }

  /**
   * Get store size (for monitoring)
   */
  size(): number {
    return this.store.size
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Destroy the store and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore()

/**
 * Get client identifier (user ID or IP address)
 */
async function getClientIdentifier(request: NextRequest): Promise<string> {
  try {
    // Try to get authenticated user ID
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user?.id) {
      return `user:${user.id}`
    }
  } catch (error) {
    // Fall through to IP-based identification
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return `ip:${ip}`
}

/**
 * Create rate limit middleware
 * 
 * @param config - Rate limit configuration
 * @returns Middleware function
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Check if rate limiting should be skipped
    if (config.skip && await config.skip(request)) {
      return null // Continue to next middleware/handler
    }

    // Get client identifier
    const identifier = await getClientIdentifier(request)
    const key = `${request.nextUrl.pathname}:${identifier}`

    // Increment request count
    const entry = rateLimitStore.increment(key, config.windowMs)

    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const resetTime = Math.ceil((entry.resetTime - Date.now()) / 1000)
      
      return NextResponse.json(
        {
          success: false,
          error: config.message || 'Too many requests. Please try again later.',
          retryAfter: resetTime
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetTime.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString()
          }
        }
      )
    }

    // Add rate limit headers to response
    const remaining = config.maxRequests - entry.count
    
    // Return null to continue to next middleware/handler
    // Headers will be added by the wrapper function
    return null
  }
}

/**
 * Wrap API handler with rate limiting
 * 
 * @param handler - API route handler
 * @param config - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  config: RateLimitConfig
): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest

    // Apply rate limiting
    const rateLimitResponse = await createRateLimiter(config)(request)
    
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Get client identifier for headers
    const identifier = await getClientIdentifier(request)
    const key = `${request.nextUrl.pathname}:${identifier}`
    const entry = rateLimitStore.get(key)

    // Call the original handler
    const response = await handler(...args)

    // Add rate limit headers to response
    if (entry) {
      const remaining = Math.max(0, config.maxRequests - entry.count)
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', remaining.toString())
      response.headers.set('X-RateLimit-Reset', entry.resetTime.toString())
    }

    return response
  }) as T
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  /**
   * Strict rate limit for submissions (10 per minute)
   */
  submissions: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many submissions. Please wait before submitting again.'
  },

  /**
   * Standard rate limit for API calls (100 per minute)
   */
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.'
  },

  /**
   * Lenient rate limit for read operations (200 per minute)
   */
  read: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests. Please slow down.'
  },

  /**
   * Strict rate limit for authentication (5 per minute)
   */
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many login attempts. Please try again later.'
  },

  /**
   * Very strict rate limit for password reset (3 per hour)
   */
  passwordReset: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset attempts. Please try again later.'
  },

  /**
   * Moderate rate limit for admin operations (50 per minute)
   */
  admin: {
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many admin operations. Please slow down.'
  }
} as const

/**
 * Get rate limit store (for monitoring)
 */
export function getRateLimitStore(): RateLimitStore {
  return rateLimitStore
}

/**
 * Clear rate limit store (for testing)
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear()
}

/**
 * Example usage:
 * 
 * // In your API route:
 * import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limit'
 * 
 * export const POST = withRateLimit(
 *   async (request: NextRequest) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true })
 *   },
 *   rateLimitConfigs.submissions
 * )
 * 
 * // Or with custom config:
 * export const POST = withRateLimit(
 *   async (request: NextRequest) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true })
 *   },
 *   {
 *     maxRequests: 10,
 *     windowMs: 60 * 1000,
 *     message: 'Custom rate limit message',
 *     skip: async (request) => {
 *       // Skip rate limiting for admins
 *       const supabase = createClient()
 *       const { data: { user } } = await supabase.auth.getUser()
 *       if (!user) return false
 *       
 *       const { data: profile } = await supabase
 *         .from('users')
 *         .select('role')
 *         .eq('id', user.id)
 *         .single()
 *       
 *       return profile?.role === 'admin'
 *     }
 *   }
 * )
 */
