# Real-time Submission Feedback

This module provides real-time feedback for code submissions using Supabase real-time channels.

## Features

- **Real-time Status Updates**: Broadcast submission status changes (queued, executing, passed, failed, error)
- **Progress Tracking**: Track test case execution progress (0-100%)
- **Test Case Results**: Show how many test cases have passed
- **User-specific Subscriptions**: Subscribe to all submissions for a specific user
- **Submission-specific Subscriptions**: Subscribe to updates for a specific submission

## Setup

### 1. Database Migration

Run the migration to create the `submission_status_updates` table:

```sql
-- Run the migration file
\i src/lib/database/migrations/20250116_create_submission_status_updates.sql
```

### 2. Enable Real-time in Supabase

1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for `submission_status_updates` table
3. Select `INSERT` events for real-time broadcasting

### 3. Configure RLS Policies

The migration automatically sets up RLS policies:
- Users can view their own submission status updates
- Service role can insert status updates (for server-side broadcasting)
- Admins can view all submission status updates

## Usage

### Server-side (Broadcasting Status)

```typescript
import { realtimeSubmissionStatus, createStatusUpdate } from '@/lib/submissions/realtime-status'

// Broadcast that submission is queued
await realtimeSubmissionStatus.broadcastStatus(
  createStatusUpdate(submissionId, userId, problemId, 'queued', {
    message: 'Submission queued for execution',
    totalTestCases: 10
  })
)

// Broadcast that submission is executing
await realtimeSubmissionStatus.broadcastStatus(
  createStatusUpdate(submissionId, userId, problemId, 'executing', {
    message: 'Executing test cases...',
    progress: 50,
    testCasesPassed: 5,
    totalTestCases: 10
  })
)

// Broadcast final result
await realtimeSubmissionStatus.broadcastStatus(
  createStatusUpdate(submissionId, userId, problemId, 'passed', {
    message: 'All test cases passed!',
    progress: 100,
    testCasesPassed: 10,
    totalTestCases: 10
  })
)
```

### Client-side (React Hook)

```typescript
import { useSubmissionStatus } from '@/hooks/useSubmissionStatus'

function SubmissionFeedback({ userId }: { userId: string }) {
  const {
    status,
    progress,
    message,
    testCasesPassed,
    totalTestCases,
    isExecuting
  } = useSubmissionStatus({
    userId,
    onStatusChange: (update) => {
      console.log('Status changed:', update)
    }
  })

  return (
    <div>
      {isExecuting && (
        <div>
          <p>Status: {status}</p>
          <p>Progress: {progress}%</p>
          <p>Test Cases: {testCasesPassed}/{totalTestCases}</p>
          <p>{message}</p>
        </div>
      )}
    </div>
  )
}
```

### Client-side (Direct Subscription)

```typescript
import { realtimeSubmissionStatus } from '@/lib/submissions/realtime-status'

// Subscribe to all submissions for a user
const unsubscribe = realtimeSubmissionStatus.subscribeToUserSubmissions(
  userId,
  (update) => {
    console.log('Submission update:', update)
    // Update UI based on status
  }
)

// Cleanup when done
unsubscribe()
```

## Status Types

- `queued`: Submission is waiting in the queue
- `executing`: Test cases are being executed
- `passed`: All test cases passed
- `failed`: Some test cases failed
- `error`: System error occurred

## Integration with Submission Route

To enable real-time feedback in the submission route:

1. Uncomment the real-time broadcasting code in `src/app/api/submissions/submit/route.ts`
2. Import the required functions:
   ```typescript
   import { realtimeSubmissionStatus, createStatusUpdate } from '@/lib/submissions/realtime-status'
   ```
3. Broadcast status updates at key points:
   - When submission is queued
   - When execution starts
   - When execution completes (passed/failed)

## Data Retention

Status updates are automatically cleaned up after 24 hours to prevent table bloat. The cleanup function runs daily via pg_cron (if enabled).

To manually cleanup old records:

```sql
SELECT cleanup_old_submission_status();
```

## Performance Considerations

- Status updates are ephemeral and not meant for permanent storage
- Use the `submissions` table for permanent submission records
- Real-time subscriptions are filtered by user_id for security and performance
- The table is optimized with indexes on user_id, submission_id, and problem_id

## Security

- RLS policies ensure users can only see their own submission status
- Server-side code uses service role to bypass RLS for broadcasting
- All real-time subscriptions are authenticated via Supabase auth

## Requirements

- Supabase project with real-time enabled
- PostgreSQL database with RLS support
- Supabase client library (@supabase/supabase-js)
