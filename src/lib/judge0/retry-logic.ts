/**
 * Retry Logic for Judge0 API Calls
 * 
 * Implements exponential backoff retry strategy for handling transient failures
 * 
 * Requirements: 4.5
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  shouldRetry?: (error: any) => boolean
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 8000,
    shouldRetry = defaultShouldRetry
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // If this is the last attempt or error is not retryable, throw
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }

      // Calculate delay with exponential backoff: baseDelay * 2^attempt
      const exponentialDelay = baseDelay * Math.pow(2, attempt)
      const delay = Math.min(exponentialDelay, maxDelay)
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay
      const finalDelay = delay + jitter

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(finalDelay)}ms`)

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay))
    }
  }

  throw lastError
}

/**
 * Default retry logic - retry on network errors and 5xx status codes
 */
function defaultShouldRetry(error: any): boolean {
  // Retry on network errors
  if (error.message?.includes('fetch failed') || 
      error.message?.includes('network') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ETIMEDOUT')) {
    return true
  }

  // Retry on rate limiting (429) - check both message and status
  if (error.message?.includes('429') || 
      error.message?.includes('Too Many Requests') ||
      error.status === 429) {
    return true
  }

  // Retry on server errors (5xx) - check both message and status
  if (error.message?.includes('500') || 
      error.message?.includes('502') ||
      error.message?.includes('503') ||
      error.message?.includes('504') ||
      error.status === 500 ||
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504) {
    return true
  }

  // Don't retry on client errors (4xx except 429) - check both message and status
  if (error.message?.includes('400') ||
      error.message?.includes('401') ||
      error.message?.includes('403') ||
      error.message?.includes('404') ||
      error.status === 400 ||
      error.status === 401 ||
      error.status === 403 ||
      error.status === 404) {
    return false
  }

  // Retry on timeout errors
  if (error.message?.includes('timeout')) {
    return true
  }

  // Default: don't retry
  return false
}

/**
 * Judge0-specific retry logic
 */
export function shouldRetryJudge0Error(error: any): boolean {
  // Use default retry logic
  if (defaultShouldRetry(error)) {
    return true
  }

  // Judge0-specific: retry on "No token received" errors
  if (error.message?.includes('No token received')) {
    return true
  }

  // Judge0-specific: retry on "Invalid response format" errors
  if (error.message?.includes('Invalid response format')) {
    return true
  }

  return false
}
