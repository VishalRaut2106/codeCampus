/**
 * Debounced Real-time Subscription Manager
 * Adds debouncing to prevent UI thrashing from rapid updates
 * Requirements: 8.4
 */

import realtimeSubscriptionManager, { SubscriptionConfig } from './subscription-manager'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface DebouncedSubscriptionConfig extends Omit<SubscriptionConfig, 'callback'> {
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
  debounceMs?: number
  batchUpdates?: boolean
}

interface PendingUpdate {
  payload: RealtimePostgresChangesPayload<any>
  timestamp: number
}

class DebouncedSubscriptionManager {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map()
  private pendingUpdates: Map<string, PendingUpdate[]> = new Map()
  private subscriptionIds: Map<string, string> = new Map()
  private readonly DEFAULT_DEBOUNCE_MS = 300

  /**
   * Subscribe with debouncing
   * Returns a unique subscription ID for cleanup
   */
  subscribe(config: DebouncedSubscriptionConfig): string {
    const debounceMs = config.debounceMs ?? this.DEFAULT_DEBOUNCE_MS
    const batchUpdates = config.batchUpdates ?? true
    const debouncedCallback = this.createDebouncedCallback(
      config.callback,
      debounceMs,
      batchUpdates
    )

    // Subscribe using the base subscription manager
    const subscriptionId = realtimeSubscriptionManager.subscribe({
      table: config.table,
      schema: config.schema,
      event: config.event,
      filter: config.filter,
      callback: debouncedCallback,
    })

    // Track this subscription
    this.subscriptionIds.set(subscriptionId, subscriptionId)

    console.log(
      `[DebouncedManager] Created debounced subscription ${subscriptionId} with ${debounceMs}ms delay`
    )

    return subscriptionId
  }

  /**
   * Unsubscribe from debounced updates
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    // Clear any pending debounce timer
    const timer = this.debounceTimers.get(subscriptionId)
    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(subscriptionId)
    }

    // Clear pending updates
    this.pendingUpdates.delete(subscriptionId)

    // Unsubscribe from base manager
    await realtimeSubscriptionManager.unsubscribe(subscriptionId)

    // Remove from tracking
    this.subscriptionIds.delete(subscriptionId)

    console.log(`[DebouncedManager] Unsubscribed ${subscriptionId}`)
  }

  /**
   * Unsubscribe all debounced subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    console.log(`[DebouncedManager] Unsubscribing all ${this.subscriptionIds.size} subscriptions`)

    // Clear all timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer)
    }
    this.debounceTimers.clear()
    this.pendingUpdates.clear()

    // Unsubscribe all from base manager
    const ids = Array.from(this.subscriptionIds.keys())
    for (const id of ids) {
      await realtimeSubscriptionManager.unsubscribe(id)
    }

    this.subscriptionIds.clear()
  }

  /**
   * Get statistics about debounced subscriptions
   */
  getStats(): {
    activeSubscriptions: number
    pendingTimers: number
    pendingUpdatesCount: number
  } {
    let totalPendingUpdates = 0
    for (const updates of this.pendingUpdates.values()) {
      totalPendingUpdates += updates.length
    }

    return {
      activeSubscriptions: this.subscriptionIds.size,
      pendingTimers: this.debounceTimers.size,
      pendingUpdatesCount: totalPendingUpdates,
    }
  }

  /**
   * Create a debounced callback function
   */
  private createDebouncedCallback(
    originalCallback: (payload: RealtimePostgresChangesPayload<any>) => void,
    debounceMs: number,
    batchUpdates: boolean
  ): (payload: RealtimePostgresChangesPayload<any>) => void {
    // Generate a unique key for this callback
    const callbackKey = `callback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return (payload: RealtimePostgresChangesPayload<any>) => {
      // Store the update
      if (batchUpdates) {
        const pending = this.pendingUpdates.get(callbackKey) || []
        pending.push({
          payload,
          timestamp: Date.now(),
        })
        this.pendingUpdates.set(callbackKey, pending)
      }

      // Clear existing timer
      const existingTimer = this.debounceTimers.get(callbackKey)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      // Set new timer
      const timer = setTimeout(() => {
        if (batchUpdates) {
          // Get all pending updates
          const pending = this.pendingUpdates.get(callbackKey) || []

          if (pending.length > 0) {
            console.log(
              `[DebouncedManager] Processing ${pending.length} batched updates for ${callbackKey}`
            )

            // Call the original callback with the most recent payload
            // (or you could pass all payloads if the callback supports batching)
            const mostRecent = pending[pending.length - 1]
            try {
              originalCallback(mostRecent.payload)
            } catch (error) {
              console.error(`[DebouncedManager] Error in debounced callback:`, error)
            }

            // Clear pending updates
            this.pendingUpdates.delete(callbackKey)
          }
        } else {
          // Just call the callback with the latest payload
          try {
            originalCallback(payload)
          } catch (error) {
            console.error(`[DebouncedManager] Error in debounced callback:`, error)
          }
        }

        // Remove timer
        this.debounceTimers.delete(callbackKey)
      }, debounceMs)

      this.debounceTimers.set(callbackKey, timer)
    }
  }
}

// Singleton instance
const debouncedSubscriptionManager = new DebouncedSubscriptionManager()

export default debouncedSubscriptionManager
