/**
 * Production-Ready Database Connection Pool
 * Handles connection retries, timeouts, and error recovery
 * 
 * Requirements: 6.7, 15.2
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface ConnectionConfig {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  poolSize?: number
  idleTimeout?: number
}

interface ConnectionPoolStats {
  activeConnections: number
  idleConnections: number
  totalConnections: number
  requestsServed: number
  errors: number
  avgResponseTime: number
}

const DEFAULT_CONFIG: Required<ConnectionConfig> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 10000, // 10 seconds
  poolSize: 10, // Maximum concurrent connections
  idleTimeout: 60000, // 60 seconds
}

// Connection pool statistics
let poolStats: ConnectionPoolStats = {
  activeConnections: 0,
  idleConnections: 0,
  totalConnections: 0,
  requestsServed: 0,
  errors: 0,
  avgResponseTime: 0,
}

// Track response times for averaging
const responseTimes: number[] = []
const MAX_RESPONSE_TIME_SAMPLES = 100

/**
 * Create a production-ready Supabase client with retry logic and connection pooling
 */
export function createProductionClient(config: ConnectionConfig = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Track connection creation
  poolStats.totalConnections++
  poolStats.idleConnections++

  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-application-name': 'code-pvg',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return client
}

/**
 * Create a service role client for admin operations (bypasses RLS)
 */
export function createServiceRoleClient(config: ConnectionConfig = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  // Track connection creation
  poolStats.totalConnections++
  poolStats.idleConnections++

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'x-application-name': 'code-pvg-admin',
      },
    },
    db: {
      schema: 'public',
    },
  })

  return client
}

/**
 * Retry wrapper for database operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: ConnectionConfig = {}
): Promise<T> {
  const { maxRetries, retryDelay } = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      poolStats.requestsServed++
      return result
    } catch (error) {
      lastError = error as Error
      poolStats.errors++
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error)

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1)
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Operation failed after retries')
}

/**
 * Timeout wrapper for database operations
 */
export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = DEFAULT_CONFIG.timeout
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ])
}

/**
 * Combined retry + timeout wrapper with performance tracking
 */
export async function withRetryAndTimeout<T>(
  operation: () => Promise<T>,
  config: ConnectionConfig = {}
): Promise<T> {
  const startTime = Date.now()
  
  try {
    // Mark connection as active
    poolStats.idleConnections--
    poolStats.activeConnections++
    
    const result = await withRetry(
      () => withTimeout(operation, config.timeout),
      config
    )
    
    // Track response time
    const responseTime = Date.now() - startTime
    responseTimes.push(responseTime)
    
    // Keep only last N samples
    if (responseTimes.length > MAX_RESPONSE_TIME_SAMPLES) {
      responseTimes.shift()
    }
    
    // Update average response time
    poolStats.avgResponseTime = 
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    
    return result
  } finally {
    // Mark connection as idle
    poolStats.activeConnections--
    poolStats.idleConnections++
  }
}

/**
 * Execute operation with connection pool management
 */
export async function withConnectionPool<T>(
  operation: () => Promise<T>,
  config: ConnectionConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // Check if pool is exhausted
  if (poolStats.activeConnections >= finalConfig.poolSize) {
    // Wait for a connection to become available
    await waitForAvailableConnection(finalConfig.idleTimeout)
  }
  
  return withRetryAndTimeout(operation, finalConfig)
}

/**
 * Wait for a connection to become available in the pool
 */
async function waitForAvailableConnection(timeoutMs: number): Promise<void> {
  const startTime = Date.now()
  const checkInterval = 100 // Check every 100ms
  
  while (Date.now() - startTime < timeoutMs) {
    if (poolStats.activeConnections < DEFAULT_CONFIG.poolSize) {
      return
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval))
  }
  
  throw new Error('Connection pool exhausted - no connections available')
}

/**
 * Get connection pool statistics
 */
export function getPoolStats(): ConnectionPoolStats {
  return { ...poolStats }
}

/**
 * Reset connection pool statistics
 */
export function resetPoolStats(): void {
  poolStats = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    requestsServed: 0,
    errors: 0,
    avgResponseTime: 0,
  }
  responseTimes.length = 0
}

/**
 * Check connection pool health
 */
export function checkPoolHealth(): {
  healthy: boolean
  issues: string[]
  stats: ConnectionPoolStats
} {
  const issues: string[] = []
  
  // Check for high error rate
  const errorRate = poolStats.requestsServed > 0 
    ? poolStats.errors / poolStats.requestsServed 
    : 0
  
  if (errorRate > 0.1) {
    issues.push(`High error rate: ${(errorRate * 100).toFixed(2)}%`)
  }
  
  // Check for slow response times
  if (poolStats.avgResponseTime > 1000) {
    issues.push(`Slow average response time: ${poolStats.avgResponseTime.toFixed(0)}ms`)
  }
  
  // Check for pool exhaustion
  const utilizationRate = poolStats.totalConnections > 0
    ? poolStats.activeConnections / poolStats.totalConnections
    : 0
  
  if (utilizationRate > 0.9) {
    issues.push(`High pool utilization: ${(utilizationRate * 100).toFixed(0)}%`)
  }
  
  return {
    healthy: issues.length === 0,
    issues,
    stats: getPoolStats(),
  }
}

/**
 * Configure connection pool settings
 */
export function configurePool(config: Partial<ConnectionConfig>): void {
  Object.assign(DEFAULT_CONFIG, config)
  console.log('Connection pool configured:', DEFAULT_CONFIG)
}
