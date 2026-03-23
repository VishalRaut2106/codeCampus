/**
 * Cache Manager Service
 * In-memory cache with TTL support and statistics tracking
 * Requirements: 5.3
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
  createdAt: number
}

interface CacheStats {
  hits: number
  misses: number
  sets: number
  invalidations: number
  hitRate: number
  missRate: number
  size: number
}

interface CacheConfig {
  key: string
  ttl: number // Time to live in seconds
  staleWhileRevalidate?: boolean
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private stats: Omit<CacheStats, 'hitRate' | 'missRate' | 'size'> = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
  }

  /**
   * Get a value from the cache
   * Returns null if key doesn't exist or has expired
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    const now = Date.now()
    if (now > entry.expiresAt) {
      // Entry has expired, remove it
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.value as T
  }

  /**
   * Set a value in the cache with TTL
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    const now = Date.now()
    const expiresAt = now + ttl * 1000 // Convert seconds to milliseconds

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: now,
    })

    this.stats.sets++
  }

  /**
   * Invalidate a single cache key
   */
  async invalidate(key: string): Promise<void> {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.invalidations++
    }
  }

  /**
   * Invalidate multiple cache keys matching a pattern
   * Pattern can use wildcards: "user:*" matches "user:123", "user:456", etc.
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    )

    let count = 0
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => {
      this.cache.delete(key)
      count++
    })

    this.stats.invalidations += count
    return count
  }

  /**
   * Get a value from cache or fetch it if not present
   * Automatically caches the fetched value
   */
  async getOrFetch<T>(
    config: CacheConfig,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(config.key)
    if (cached !== null) {
      return cached
    }

    // Fetch the value
    const value = await fetcher()

    // Store in cache
    await this.set(config.key, value, config.ttl)

    return value
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.stats.invalidations += size
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now()
    let count = 0
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach((key) => {
      this.cache.delete(key)
      count++
    })

    return count
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 10000) / 100, // Percentage with 2 decimals
      missRate: Math.round(missRate * 10000) / 100,
      size: this.cache.size,
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
    }
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Check if a key exists in cache (without affecting stats)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Get the remaining TTL for a key in seconds
   * Returns -1 if key doesn't exist or has expired
   */
  getTTL(key: string): number {
    const entry = this.cache.get(key)
    if (!entry) return -1

    const now = Date.now()
    if (now > entry.expiresAt) {
      this.cache.delete(key)
      return -1
    }

    return Math.ceil((entry.expiresAt - now) / 1000)
  }
}

// Singleton instance
const cacheManager = new CacheManager()

// Auto-cleanup expired entries every 60 seconds
if (typeof window === 'undefined') {
  // Only run cleanup on server-side
  setInterval(() => {
    cacheManager.cleanup()
  }, 60000)
}

export default cacheManager
export { CacheManager, type CacheConfig, type CacheStats }
