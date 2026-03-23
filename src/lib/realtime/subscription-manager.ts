/**
 * Real-time Subscription Manager
 * Manages Supabase real-time subscriptions with multiplexing and deduplication
 * Requirements: 8.2, 8.5, 8.8
 */

import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface SubscriptionConfig {
  table: string
  schema?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
}

interface ActiveSubscription {
  id: string
  config: SubscriptionConfig
  channel: RealtimeChannel | null
  subscribers: Set<string>
  createdAt: Date
}

class RealtimeSubscriptionManager {
  private subscriptions: Map<string, ActiveSubscription> = new Map()
  private subscriberCallbacks: Map<string, (payload: any) => void> = new Map()
  private supabase = createClient()

  /**
   * Subscribe to real-time updates
   * Returns a unique subscription ID for cleanup
   */
  subscribe(config: SubscriptionConfig): string {
    const subscriberId = this.generateSubscriberId()
    const channelKey = this.getChannelKey(config)

    // Store the callback for this subscriber
    this.subscriberCallbacks.set(subscriberId, config.callback)

    // Check if we already have a subscription for this channel
    let subscription = this.subscriptions.get(channelKey)

    if (subscription) {
      // Add this subscriber to existing subscription (multiplexing)
      subscription.subscribers.add(subscriberId)
      console.log(`[RealtimeManager] Multiplexed subscriber ${subscriberId} to existing channel ${channelKey}`)
    } else {
      // Create new subscription
      subscription = this.createSubscription(channelKey, config, subscriberId)
      this.subscriptions.set(channelKey, subscription)
      console.log(`[RealtimeManager] Created new subscription ${subscriberId} for channel ${channelKey}`)
    }

    return subscriberId
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(subscriberId: string): Promise<void> {
    // Find the subscription that contains this subscriber
    for (const [channelKey, subscription] of this.subscriptions.entries()) {
      if (subscription.subscribers.has(subscriberId)) {
        subscription.subscribers.delete(subscriberId)
        this.subscriberCallbacks.delete(subscriberId)

        console.log(`[RealtimeManager] Unsubscribed ${subscriberId} from channel ${channelKey}`)

        // If no more subscribers, cleanup the channel
        if (subscription.subscribers.size === 0) {
          await this.cleanupChannel(channelKey, subscription)
        }

        return
      }
    }

    console.warn(`[RealtimeManager] Subscriber ${subscriberId} not found`)
  }

  /**
   * Unsubscribe all subscriptions
   */
  async unsubscribeAll(): Promise<void> {
    console.log(`[RealtimeManager] Unsubscribing all ${this.subscriptions.size} channels`)

    for (const [channelKey, subscription] of this.subscriptions.entries()) {
      await this.cleanupChannel(channelKey, subscription)
    }

    this.subscriptions.clear()
    this.subscriberCallbacks.clear()
  }

  /**
   * Get active subscription count
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size
  }

  /**
   * Get total subscriber count
   */
  getTotalSubscriberCount(): number {
    let count = 0
    for (const subscription of this.subscriptions.values()) {
      count += subscription.subscribers.size
    }
    return count
  }

  /**
   * Get subscription details for debugging
   */
  getSubscriptionDetails(): Array<{
    channelKey: string
    table: string
    subscriberCount: number
    createdAt: Date
  }> {
    return Array.from(this.subscriptions.entries()).map(([channelKey, sub]) => ({
      channelKey,
      table: sub.config.table,
      subscriberCount: sub.subscribers.size,
      createdAt: sub.createdAt,
    }))
  }

  /**
   * Create a new subscription
   */
  private createSubscription(
    channelKey: string,
    config: SubscriptionConfig,
    subscriberId: string
  ): ActiveSubscription {
    const channel = this.supabase
      .channel(channelKey)
      .on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload) => {
          // Broadcast to all subscribers of this channel
          const subscription = this.subscriptions.get(channelKey)
          if (subscription) {
            for (const subId of subscription.subscribers) {
              const callback = this.subscriberCallbacks.get(subId)
              if (callback) {
                try {
                  callback(payload)
                } catch (error) {
                  console.error(`[RealtimeManager] Error in subscriber ${subId} callback:`, error)
                }
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(`[RealtimeManager] Channel ${channelKey} status: ${status}`)
      })

    return {
      id: channelKey,
      config,
      channel,
      subscribers: new Set([subscriberId]),
      createdAt: new Date(),
    }
  }

  /**
   * Cleanup a channel
   */
  private async cleanupChannel(channelKey: string, subscription: ActiveSubscription): Promise<void> {
    if (subscription.channel) {
      await this.supabase.removeChannel(subscription.channel)
      console.log(`[RealtimeManager] Removed channel ${channelKey}`)
    }
    this.subscriptions.delete(channelKey)
  }

  /**
   * Generate a unique channel key for multiplexing
   * Same table + event + filter = same channel
   */
  private getChannelKey(config: SubscriptionConfig): string {
    const parts = [
      config.table,
      config.schema || 'public',
      config.event || '*',
      config.filter || 'all',
    ]
    return `rt-${parts.join('-')}`
  }

  /**
   * Generate a unique subscriber ID
   */
  private generateSubscriberId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
const realtimeSubscriptionManager = new RealtimeSubscriptionManager()

export default realtimeSubscriptionManager
