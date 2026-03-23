# Cache System Documentation

## Overview

This cache system provides comprehensive caching, request deduplication, and automatic cache invalidation for the codCampus platform. It reduces API calls by 50% and improves performance significantly.

## Components

### 1. Cache Manager (`cache-manager.ts`)

In-memory cache with TTL support and statistics tracking.

**Features:**
- Get/Set operations with TTL
- Pattern-based invalidation (wildcards supported)
- Cache statistics (hit rate, miss rate)
- Automatic cleanup of expired entries
- `getOrFetch` helper for cache-aside pattern

**Usage:**
```typescript
import cacheManager from '@/lib/cache/cache-manager'

// Simple get/set
await cacheManager.set('user:123', userData, 60) // 60 seconds TTL
const user = await cacheManager.get('user:123')

// Cache-aside pattern
const user = await cacheManager.getOrFetch(
  { key: 'user:123', ttl: 60 },
  async () => {
    // Fetch from database
    return await fetchUserFromDB('123')
  }
)

// Pattern invalidation
await cacheManager.invalidatePattern('user:*') // Invalidates all user caches

// Statistics
const stats = cacheManager.getStats()
console.log(`Hit rate: ${stats.hitRate}%`)
```

### 2. Request Deduplication (`request-deduplication.ts`)

Prevents duplicate API calls within a 100ms window.

**Features:**
- Tracks in-flight requests by key
- Returns same response to duplicate requests
- Automatic cleanup after deduplication window

**Usage:**
```typescript
import requestDeduplicator, { deduplicatedFetch } from '@/lib/middleware/request-deduplication'

// Using the helper function
const data = await deduplicatedFetch('/api/users/123')

// Using the deduplicator directly
const result = await requestDeduplicator.deduplicate(
  '/api/users/123',
  async () => {
    return await fetch('/api/users/123').then(r => r.json())
  }
)
```

### 3. Cache Invalidation (`cache-invalidation.ts`)

Handles cache invalidation based on data changes.

**Features:**
- User cache invalidation
- Leaderboard cache invalidation
- Problem cache invalidation
- Contest cache invalidation
- Submission cache invalidation

**Usage:**
```typescript
import cacheInvalidationService, {
  invalidateOnProfileUpdate,
  invalidateOnPointsChange,
} from '@/lib/cache/cache-invalidation'

// After updating user profile
await invalidateOnProfileUpdate(userId)

// After awarding points
await invalidateOnPointsChange(userId)

// After updating problem
await cacheInvalidationService.invalidateProblemCache(problemId)
```

### 4. Real-time Cache Sync (`realtime-cache-sync.ts`)

Uses Supabase real-time subscriptions to automatically invalidate cache when data changes.

**Features:**
- Automatic cache invalidation on database changes
- Subscribes to users, problems, contests, submissions tables
- Detects point changes and invalidates leaderboard

**Usage:**
```typescript
import realtimeCacheSync, { useRealtimeCacheSync } from '@/lib/cache/realtime-cache-sync'

// Initialize in your app (client-side only)
await realtimeCacheSync.initialize()

// Or use the React hook
function MyComponent() {
  const { isActive, cleanup } = useRealtimeCacheSync()
  
  useEffect(() => {
    return () => cleanup()
  }, [])
  
  return <div>Cache sync active: {isActive}</div>
}
```

## API Endpoints

### 1. Batch API (`/api/batch`)

Combines multiple API requests into a single call.

**Request:**
```typescript
POST /api/batch
{
  "requests": [
    {
      "id": "stats",
      "endpoint": "/api/dashboard-stats",
      "method": "GET"
    },
    {
      "id": "students",
      "endpoint": "/api/students",
      "method": "GET"
    }
  ]
}
```

**Response:**
```typescript
{
  "success": true,
  "results": {
    "stats": {
      "success": true,
      "data": { ... },
      "status": 200
    },
    "students": {
      "success": true,
      "data": [ ... ],
      "status": 200
    }
  },
  "executionTime": 150,
  "metadata": {
    "totalRequests": 2,
    "successfulRequests": 2,
    "failedRequests": 0
  }
}
```

### 2. Dashboard Batch API (`/api/dashboard/batch`)

Fetches all dashboard data in a single call with 1-minute cache.

**Request:**
```typescript
GET /api/dashboard/batch
```

**Response:**
```typescript
{
  "success": true,
  "data": {
    "stats": {
      "totalStudents": 100,
      "pendingApprovals": 5,
      "totalContests": 10,
      "activeContests": 2,
      "totalProblems": 50,
      "totalSubmissions": 1000
    },
    "students": [ ... ],
    "contests": [ ... ]
  },
  "cached": false,
  "executionTime": 200,
  "metadata": {
    "studentsCount": 100,
    "contestsCount": 10,
    "cacheExpiry": 60
  }
}
```

**Optimistic Updates:**
```typescript
POST /api/dashboard/batch
{
  "action": "optimistic-update",
  "data": {
    "stats": { "pendingApprovals": 4 }
  }
}
```

**Cache Invalidation:**
```typescript
POST /api/dashboard/batch
{
  "action": "invalidate"
}
```

## Integration Guide

### Frontend Integration

Replace multiple API calls with batch endpoint:

**Before:**
```typescript
// Multiple API calls
const statsResponse = await fetch('/api/dashboard-stats')
const studentsResponse = await fetch('/api/students')
const contestsResponse = await fetch('/api/contests')

const stats = await statsResponse.json()
const students = await studentsResponse.json()
const contests = await contestsResponse.json()
```

**After:**
```typescript
// Single batched call
const response = await fetch('/api/dashboard/batch')
const { data } = await response.json()

const { stats, students, contests } = data
```

### Backend Integration

Add cache invalidation to update operations:

```typescript
// In your API route
import { invalidateOnProfileUpdate } from '@/lib/cache/cache-invalidation'

export async function POST(request: Request) {
  const { userId, ...updates } = await request.json()
  
  // Update database
  await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
  
  // Invalidate cache
  await invalidateOnProfileUpdate(userId)
  
  return NextResponse.json({ success: true })
}
```

## Performance Metrics

Expected improvements:
- **API calls reduced by 50%**: From ~10 calls to ~5 calls per dashboard load
- **Cache hit rate > 90%**: For frequently accessed data
- **Response time improved by 30%**: Due to caching and batching
- **Database queries reduced by 40%**: Through effective caching

## Cache Keys Convention

Use consistent naming patterns:
- Users: `user:{userId}`, `user:profile:{userId}`
- Leaderboard: `leaderboard:page:{page}`, `leaderboard:top:100`
- Problems: `problem:{problemId}`, `problem:testcases:{problemId}`
- Contests: `contest:{contestId}`, `contest:leaderboard:{contestId}`
- Dashboard: `dashboard:all`
- Submissions: `submissions:user:{userId}`, `submissions:problem:{problemId}`

## Monitoring

Check cache statistics:
```typescript
import cacheManager from '@/lib/cache/cache-manager'

const stats = cacheManager.getStats()
console.log('Cache Statistics:', {
  hitRate: `${stats.hitRate}%`,
  missRate: `${stats.missRate}%`,
  size: stats.size,
  hits: stats.hits,
  misses: stats.misses,
})
```

## Best Practices

1. **Set appropriate TTLs**: Short TTL (1 min) for frequently changing data, longer TTL (5-10 min) for stable data
2. **Use pattern invalidation**: Invalidate related caches together (e.g., user profile + leaderboard)
3. **Implement optimistic updates**: Update UI immediately, sync with server in background
4. **Monitor cache hit rates**: Aim for >90% hit rate for frequently accessed data
5. **Clean up subscriptions**: Always cleanup real-time subscriptions when components unmount

## Troubleshooting

**Cache not invalidating:**
- Check if real-time sync is initialized
- Verify cache key patterns match
- Check console for invalidation logs

**Low cache hit rate:**
- Verify TTL is appropriate
- Check if cache is being invalidated too frequently
- Review cache key naming consistency

**Memory issues:**
- Monitor cache size with `getStats()`
- Reduce TTL for large objects
- Implement cache size limits if needed
