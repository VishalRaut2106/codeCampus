/**
 * Request Deduplication Middleware
 * Prevents duplicate API calls by tracking in-flight requests
 * Requirements: 5.6
 */

interface InFlightRequest {
  promise: Promise<any>
  timestamp: number
}

class RequestDeduplicator {
  private inFlightRequests: Map<string, InFlightRequest> = new Map()
  private readonly deduplicationWindow: number = 100 // 100ms window

  /**
   * Generate a unique key for a request based on endpoint and parameters
   */
  private generateKey(endpoint: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : ''
    return `${endpoint}:${paramString}`
  }

  /**
   * Clean up expired requests from the cache
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.inFlightRequests.forEach((request, key) => {
      if (now - request.timestamp > this.deduplicationWindow) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => this.inFlightRequests.delete(key))
  }

  /**
   * Execute a request with deduplication
   * If a duplicate request is in-flight, wait for the original to complete
   */
  async deduplicate<T>(
    endpoint: string,
    fetcher: () => Promise<T>,
    params?: Record<string, any>
  ): Promise<T> {
    // Clean up expired requests
    this.cleanup()

    const key = this.generateKey(endpoint, params)
    const existingRequest = this.inFlightRequests.get(key)

    // If duplicate request exists, wait for it to complete
    if (existingRequest) {
      try {
        return await existingRequest.promise
      } catch (error) {
        // If the original request failed, remove it and retry
        this.inFlightRequests.delete(key)
        throw error
      }
    }

    // Create new request
    const promise = fetcher()
    this.inFlightRequests.set(key, {
      promise,
      timestamp: Date.now(),
    })

    try {
      const result = await promise
      // Keep the result in cache for the deduplication window
      setTimeout(() => {
        this.inFlightRequests.delete(key)
      }, this.deduplicationWindow)
      return result
    } catch (error) {
      // Remove failed request immediately
      this.inFlightRequests.delete(key)
      throw error
    }
  }

  /**
   * Clear all in-flight requests
   */
  clear(): void {
    this.inFlightRequests.clear()
  }

  /**
   * Get statistics about deduplication
   */
  getStats(): {
    inFlightCount: number
    keys: string[]
  } {
    return {
      inFlightCount: this.inFlightRequests.size,
      keys: Array.from(this.inFlightRequests.keys()),
    }
  }
}

// Singleton instance
const requestDeduplicator = new RequestDeduplicator()

export default requestDeduplicator

/**
 * Helper function to wrap fetch calls with deduplication
 */
export async function deduplicatedFetch<T>(
  endpoint: string,
  options?: RequestInit,
  params?: Record<string, any>
): Promise<T> {
  return requestDeduplicator.deduplicate(
    endpoint,
    async () => {
      const response = await fetch(endpoint, options)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    },
    params
  )
}
