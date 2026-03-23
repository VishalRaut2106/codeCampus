/**
 * React Hook for Real-time Subscriptions with Automatic Cleanup
 * Provides automatic subscription cleanup on component unmount
 * Requirements: 8.5
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import realtimeSubscriptionManager, { SubscriptionConfig } from '@/lib/realtime/subscription-manager'
import debouncedSubscriptionManager from '@/lib/realtime/debounced-subscription-manager'
import fallbackPollingManager, { ConnectionStatus } from '@/lib/realtime/fallback-polling-manager'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface UseRealtimeSubscriptionOptions {
  table: string
  schema?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  onUpdate: (payload: RealtimePostgresChangesPayload<any>) => void
  
  // Debouncing options
  enableDebounce?: boolean
  debounceMs?: number
  batchUpdates?: boolean
  
  // Fallback polling options
  enableFallback?: boolean
  pollingInterval?: number
  pollingFetcher?: () => Promise<any>
  onConnectionStatusChange?: (status: ConnectionStatus) => void
  
  // Lifecycle logging
  enableLogging?: boolean
}

export function useRealtimeSubscription(options: UseRealtimeSubscriptionOptions) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const subscriptionIdRef = useRef<string | null>(null)
  const mountedRef = useRef(true)

  // Log subscription lifecycle if enabled
  const log = useCallback(
    (message: string, ...args: any[]) => {
      if (options.enableLogging) {
        console.log(`[useRealtimeSubscription] ${message}`, ...args)
      }
    },
    [options.enableLogging]
  )

  // Handle connection status changes
  const handleStatusChange = useCallback(
    (status: ConnectionStatus) => {
      if (!mountedRef.current) return
      
      setConnectionStatus(status)
      log(`Connection status changed to: ${status}`)
      
      if (options.onConnectionStatusChange) {
        options.onConnectionStatusChange(status)
      }
    },
    [options.onConnectionStatusChange, log]
  )

  // Subscribe on mount
  useEffect(() => {
    mountedRef.current = true
    
    const config: SubscriptionConfig = {
      table: options.table,
      schema: options.schema,
      event: options.event,
      filter: options.filter,
      callback: options.onUpdate,
    }

    log(`Subscribing to ${options.table}`, {
      enableDebounce: options.enableDebounce,
      enableFallback: options.enableFallback,
    })

    let subscriptionId: string

    try {
      // Choose the appropriate manager based on options
      if (options.enableFallback) {
        // Use fallback polling manager
        subscriptionId = fallbackPollingManager.subscribe({
          ...config,
          pollingInterval: options.pollingInterval,
          pollingFetcher: options.pollingFetcher,
          onConnectionStatusChange: handleStatusChange,
        })
        
        // Get initial status
        const status = fallbackPollingManager.getConnectionStatus(subscriptionId)
        if (status) {
          setConnectionStatus(status)
        }
      } else if (options.enableDebounce) {
        // Use debounced manager
        subscriptionId = debouncedSubscriptionManager.subscribe({
          ...config,
          debounceMs: options.debounceMs,
          batchUpdates: options.batchUpdates,
        })
        setConnectionStatus('connected')
      } else {
        // Use basic manager
        subscriptionId = realtimeSubscriptionManager.subscribe(config)
        setConnectionStatus('connected')
      }

      subscriptionIdRef.current = subscriptionId
      setIsSubscribed(true)
      
      log(`Successfully subscribed with ID: ${subscriptionId}`)
    } catch (error) {
      console.error('[useRealtimeSubscription] Failed to subscribe:', error)
      setConnectionStatus('disconnected')
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false
      
      if (subscriptionIdRef.current) {
        log(`Cleaning up subscription: ${subscriptionIdRef.current}`)
        
        const cleanup = async () => {
          try {
            if (options.enableFallback) {
              await fallbackPollingManager.unsubscribe(subscriptionIdRef.current!)
            } else if (options.enableDebounce) {
              await debouncedSubscriptionManager.unsubscribe(subscriptionIdRef.current!)
            } else {
              await realtimeSubscriptionManager.unsubscribe(subscriptionIdRef.current!)
            }
            
            log(`Successfully cleaned up subscription: ${subscriptionIdRef.current}`)
          } catch (error) {
            console.error('[useRealtimeSubscription] Cleanup error:', error)
          }
        }
        
        cleanup()
        subscriptionIdRef.current = null
        setIsSubscribed(false)
      }
    }
  }, [
    options.table,
    options.schema,
    options.event,
    options.filter,
    options.enableDebounce,
    options.debounceMs,
    options.batchUpdates,
    options.enableFallback,
    options.pollingInterval,
    handleStatusChange,
    log,
  ])

  // Manual reconnect function
  const reconnect = useCallback(async () => {
    if (subscriptionIdRef.current && options.enableFallback) {
      log(`Manual reconnect triggered for: ${subscriptionIdRef.current}`)
      await fallbackPollingManager.reconnect(subscriptionIdRef.current)
    }
  }, [options.enableFallback, log])

  return {
    isSubscribed,
    connectionStatus,
    subscriptionId: subscriptionIdRef.current,
    reconnect,
  }
}

/**
 * Hook for multiple subscriptions with automatic cleanup
 */
export function useMultipleRealtimeSubscriptions(
  subscriptions: UseRealtimeSubscriptionOptions[]
) {
  const [activeCount, setActiveCount] = useState(0)
  const subscriptionIdsRef = useRef<string[]>([])

  useEffect(() => {
    const ids: string[] = []

    // Subscribe to all
    for (const options of subscriptions) {
      const config: SubscriptionConfig = {
        table: options.table,
        schema: options.schema,
        event: options.event,
        filter: options.filter,
        callback: options.onUpdate,
      }

      try {
        let subscriptionId: string

        if (options.enableFallback) {
          subscriptionId = fallbackPollingManager.subscribe({
            ...config,
            pollingInterval: options.pollingInterval,
            pollingFetcher: options.pollingFetcher,
            onConnectionStatusChange: options.onConnectionStatusChange,
          })
        } else if (options.enableDebounce) {
          subscriptionId = debouncedSubscriptionManager.subscribe({
            ...config,
            debounceMs: options.debounceMs,
            batchUpdates: options.batchUpdates,
          })
        } else {
          subscriptionId = realtimeSubscriptionManager.subscribe(config)
        }

        ids.push(subscriptionId)
      } catch (error) {
        console.error('[useMultipleRealtimeSubscriptions] Failed to subscribe:', error)
      }
    }

    subscriptionIdsRef.current = ids
    setActiveCount(ids.length)

    // Cleanup all on unmount
    return () => {
      const cleanup = async () => {
        for (let i = 0; i < ids.length; i++) {
          const id = ids[i]
          const options = subscriptions[i]

          try {
            if (options.enableFallback) {
              await fallbackPollingManager.unsubscribe(id)
            } else if (options.enableDebounce) {
              await debouncedSubscriptionManager.unsubscribe(id)
            } else {
              await realtimeSubscriptionManager.unsubscribe(id)
            }
          } catch (error) {
            console.error('[useMultipleRealtimeSubscriptions] Cleanup error:', error)
          }
        }
      }

      cleanup()
      subscriptionIdsRef.current = []
      setActiveCount(0)
    }
  }, [subscriptions])

  return {
    activeSubscriptionCount: activeCount,
    subscriptionIds: subscriptionIdsRef.current,
  }
}
