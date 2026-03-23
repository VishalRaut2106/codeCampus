/**
 * Real-time Subscription System
 * Exports all managers and types for easy importing
 */

export { default as realtimeSubscriptionManager } from './subscription-manager'
export { default as debouncedSubscriptionManager } from './debounced-subscription-manager'
export { default as fallbackPollingManager } from './fallback-polling-manager'

export type { SubscriptionConfig } from './subscription-manager'
export type { ConnectionStatus } from './fallback-polling-manager'

export {
  useRealtimeSubscription,
  useMultipleRealtimeSubscriptions,
} from '@/hooks/useRealtimeSubscription'

export type { UseRealtimeSubscriptionOptions } from '@/hooks/useRealtimeSubscription'
