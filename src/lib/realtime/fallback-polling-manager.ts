/**
 * Fallback Polling Manager
 * Provides polling fallback when WebSocket connections fail
 * Requirements: 8.7
 */

import realtimeSubscriptionManager, { SubscriptionConfig } from './subscription-manager'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'polling'

interface FallbackConfig extends SubscriptionConfig {
  pollingInterval?: number
  maxReconnectAttempts?: number
  onConnectionStatusChange?: (status: ConnectionStatus) => void
  pollingFetcher?: () => Promise<any>
}

interface ActiveFallbackSubscription {
  subscriptionId: string | null
  pollingIntervalId: NodeJS.Timeout | null
  reconnectAttempts: number
  reconnectTimeoutId: NodeJS.Timeout | null
  status: ConnectionStatus
  config: FallbackConfig
}

class FallbackPollingManager {
  private subscriptions: Map<string, ActiveFallbackSubscription> = new Map()
  private readonly DEFAULT_POLLING_INTERVAL = 30000 // 30 seconds
  private readonly DEFAULT_MAX_RECONNECT_ATTEMPTS = 5
  private readonly BASE_RECONNECT_DELAY = 1000 // 1 second

  /**
   * Subscribe with fallback polling support
   * Returns a unique subscription ID for cleanup
   */
  subscribe(config: FallbackConfig): string {
    const fallbackId = this.generateFallbackId()
    const pollingInterval = config.pollingInterval ?? this.DEFAULT_POLLING_INTERVAL
    const maxReconnectAttempts = config.maxReconnectAttempts ?? this.DEFAULT_MAX_RECONNECT_ATTEMPTS

    // Wrap the original callback to detect connection issues
    const wrappedCallback = this.createConnectionAwareCallback(
      fallbackId,
      config.callback,
      config.onConnectionStatusChange
    )

    // Try to establish real-time connection
    let subscriptionId: string | null = null
    try {
      subscriptionId = realtimeSubscriptionManager.subscribe({
        ...config,
        callback: wrappedCallback,
      })

      // Store subscription info
      this.subscriptions.set(fallbackId, {
        subscriptionId,
        pollingIntervalId: null,
        reconnectAttempts: 0,
        reconnectTimeoutId: null,
        status: 'connected',
        config,
      })

      this.notifyStatusChange(fallbackId, 'connected')
      console.log(`[FallbackManager] Established real-time connection for ${fallbackId}`)
    } catch (error) {
      console.error(`[FallbackManager] Failed to establish real-time connection:`, error)

      // Store subscription info without real-time
      this.subscriptions.set(fallbackId, {
        subscriptionId: null,
        pollingIntervalId: null,
        reconnectAttempts: 0,
        reconnectTimeoutId: null,
        status: 'disconnected',
        config,
      })

      // Start polling immediately
      this.startPolling(fallbackId, pollingInterval)
    }

    return fallbackId
  }

  /**
   * Unsubscribe from fallback subscription
   */
  async unsubscribe(fallbackId: string): Promise<void> {
    const subscription = this.subscriptions.get(fallbackId)
    if (!subscription) {
      console.warn(`[FallbackManager] Subscription ${fallbackId} not found`)
      return
    }

    // Stop polling
    if (subscription.pollingIntervalId) {
      clearInterval(subscription.pollingIntervalId)
    }

    // Stop reconnect attempts
    if (subscription.reconnectTimeoutId) {
      clearTimeout(subscription.reconnectTimeoutId)
    }

    // Unsubscribe from real-time if active
    if (subscription.subscriptionId) {
      await realtimeSubscriptionManager.unsubscribe(subscription.subscriptionId)
    }

    this.subscriptions.delete(fallbackId)
    console.log(`[FallbackManager] Unsubscribed ${fallbackId}`)
  }

  /**
   * Unsubscribe all fallback subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    console.log(`[FallbackManager] Unsubscribing all ${this.subscriptions.size} subscriptions`)

    const ids = Array.from(this.subscriptions.keys())
    for (const id of ids) {
      await this.unsubscribe(id)
    }
  }

  /**
   * Get connection status for a subscription
   */
  getConnectionStatus(fallbackId: string): ConnectionStatus | null {
    const subscription = this.subscriptions.get(fallbackId)
    return subscription ? subscription.status : null
  }

  /**
   * Get statistics about fallback subscriptions
   */
  getStats(): {
    totalSubscriptions: number
    connectedCount: number
    pollingCount: number
    reconnectingCount: number
    disconnectedCount: number
  } {
    let connectedCount = 0
    let pollingCount = 0
    let reconnectingCount = 0
    let disconnectedCount = 0

    for (const sub of this.subscriptions.values()) {
      switch (sub.status) {
        case 'connected':
          connectedCount++
          break
        case 'polling':
          pollingCount++
          break
        case 'reconnecting':
          reconnectingCount++
          break
        case 'disconnected':
          disconnectedCount++
          break
      }
    }

    return {
      totalSubscriptions: this.subscriptions.size,
      connectedCount,
      pollingCount,
      reconnectingCount,
      disconnectedCount,
    }
  }

  /**
   * Manually trigger reconnection for a subscription
   */
  async reconnect(fallbackId: string): Promise<void> {
    const subscription = this.subscriptions.get(fallbackId)
    if (!subscription) {
      console.warn(`[FallbackManager] Subscription ${fallbackId} not found`)
      return
    }

    console.log(`[FallbackManager] Manual reconnection triggered for ${fallbackId}`)
    await this.attemptReconnect(fallbackId)
  }

  /**
   * Create a connection-aware callback wrapper
   */
  private createConnectionAwareCallback(
    fallbackId: string,
    originalCallback: (payload: RealtimePostgresChangesPayload<any>) => void,
    onStatusChange?: (status: ConnectionStatus) => void
  ): (payload: RealtimePostgresChangesPayload<any>) => void {
    return (payload: RealtimePostgresChangesPayload<any>) => {
      const subscription = this.subscriptions.get(fallbackId)
      if (!subscription) return

      // If we were polling and received a real-time update, switch back to connected
      if (subscription.status === 'polling') {
        this.stopPolling(fallbackId)
        this.updateStatus(fallbackId, 'connected')
        console.log(`[FallbackManager] Switched back to real-time for ${fallbackId}`)
      }

      // Reset reconnect attempts on successful update
      subscription.reconnectAttempts = 0

      // Call original callback
      try {
        originalCallback(payload)
      } catch (error) {
        console.error(`[FallbackManager] Error in callback:`, error)
      }
    }
  }

  /**
   * Start polling for updates
   */
  private startPolling(fallbackId: string, interval: number): void {
    const subscription = this.subscriptions.get(fallbackId)
    if (!subscription) return

    // Stop any existing polling
    if (subscription.pollingIntervalId) {
      clearInterval(subscription.pollingIntervalId)
    }

    console.log(`[FallbackManager] Starting polling for ${fallbackId} every ${interval}ms`)

    // Start polling
    const pollingIntervalId = setInterval(async () => {
      console.log(`[FallbackManager] Polling for updates on ${subscription.config.table}`)

      // If a custom polling fetcher is provided, use it
      if (subscription.config.pollingFetcher) {
        try {
          const data = await subscription.config.pollingFetcher()
          // Simulate a real-time payload
          const simulatedPayload: any = {
            eventType: 'polling',
            new: data,
            old: null,
            table: subscription.config.table,
          }
          subscription.config.callback(simulatedPayload)
        } catch (error) {
          console.error(`[FallbackManager] Polling error:`, error)
        }
      }

      // Attempt to reconnect to real-time
      await this.attemptReconnect(fallbackId)
    }, interval)

    subscription.pollingIntervalId = pollingIntervalId
    this.updateStatus(fallbackId, 'polling')
  }

  /**
   * Stop polling
   */
  private stopPolling(fallbackId: string): void {
    const subscription = this.subscriptions.get(fallbackId)
    if (!subscription || !subscription.pollingIntervalId) return

    clearInterval(subscription.pollingIntervalId)
    subscription.pollingIntervalId = null
    console.log(`[FallbackManager] Stopped polling for ${fallbackId}`)
  }

  /**
   * Attempt to reconnect to real-time
   */
  private async attemptReconnect(fallbackId: string): Promise<void> {
    const subscription = this.subscriptions.get(fallbackId)
    if (!subscription) return

    // Check if we've exceeded max attempts
    if (subscription.reconnectAttempts >= (subscription.config.maxReconnectAttempts ?? this.DEFAULT_MAX_RECONNECT_ATTEMPTS)) {
      console.log(`[FallbackManager] Max reconnect attempts reached for ${fallbackId}`)
      return
    }

    // Don't reconnect if already connected
    if (subscription.status === 'connected') {
      return
    }

    subscription.reconnectAttempts++
    this.updateStatus(fallbackId, 'reconnecting')

    // Calculate exponential backoff delay
    const delay = this.BASE_RECONNECT_DELAY * Math.pow(2, subscription.reconnectAttempts - 1)
    console.log(
      `[FallbackManager] Reconnect attempt ${subscription.reconnectAttempts} for ${fallbackId} in ${delay}ms`
    )

    // Schedule reconnection
    subscription.reconnectTimeoutId = setTimeout(async () => {
      try {
        // Unsubscribe from old connection if exists
        if (subscription.subscriptionId) {
          await realtimeSubscriptionManager.unsubscribe(subscription.subscriptionId)
        }

        // Try to establish new connection
        const newSubscriptionId = realtimeSubscriptionManager.subscribe({
          ...subscription.config,
          callback: this.createConnectionAwareCallback(
            fallbackId,
            subscription.config.callback,
            subscription.config.onConnectionStatusChange
          ),
        })

        subscription.subscriptionId = newSubscriptionId
        subscription.reconnectAttempts = 0
        this.stopPolling(fallbackId)
        this.updateStatus(fallbackId, 'connected')

        console.log(`[FallbackManager] Successfully reconnected ${fallbackId}`)
      } catch (error) {
        console.error(`[FallbackManager] Reconnection failed for ${fallbackId}:`, error)

        // If not already polling, start polling
        if (!subscription.pollingIntervalId) {
          this.startPolling(
            fallbackId,
            subscription.config.pollingInterval ?? this.DEFAULT_POLLING_INTERVAL
          )
        }
      }
    }, delay)
  }

  /**
   * Update subscription status and notify
   */
  private updateStatus(fallbackId: string, status: ConnectionStatus): void {
    const subscription = this.subscriptions.get(fallbackId)
    if (!subscription) return

    subscription.status = status
    this.notifyStatusChange(fallbackId, status)
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(fallbackId: string, status: ConnectionStatus): void {
    const subscription = this.subscriptions.get(fallbackId)
    if (!subscription) return

    if (subscription.config.onConnectionStatusChange) {
      try {
        subscription.config.onConnectionStatusChange(status)
      } catch (error) {
        console.error(`[FallbackManager] Error in status change callback:`, error)
      }
    }
  }

  /**
   * Generate a unique fallback ID
   */
  private generateFallbackId(): string {
    return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
const fallbackPollingManager = new FallbackPollingManager()

export default fallbackPollingManager
