/**
 * Submission Queue Manager
 * 
 * Manages a queue of code submissions to prevent overwhelming the Judge0 API
 * Limits concurrent executions and provides queue position feedback
 * 
 * Requirements: 9.6
 */

interface QueuedSubmission {
  id: string
  execute: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
  timestamp: number
}

export class SubmissionQueue {
  private queue: QueuedSubmission[] = []
  private activeCount: number = 0
  private readonly maxConcurrent: number
  private readonly maxQueueSize: number

  constructor(maxConcurrent: number = 10, maxQueueSize: number = 100) {
    this.maxConcurrent = maxConcurrent
    this.maxQueueSize = maxQueueSize
  }

  /**
   * Add a submission to the queue
   * Returns a promise that resolves when the submission completes
   */
  async enqueue<T>(id: string, execute: () => Promise<T>): Promise<T> {
    // Check if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      throw new Error(`Queue is full (${this.maxQueueSize} submissions). Please try again later.`)
    }

    return new Promise<T>((resolve, reject) => {
      const submission: QueuedSubmission = {
        id,
        execute,
        resolve,
        reject,
        timestamp: Date.now()
      }

      this.queue.push(submission)
      this.processQueue()
    })
  }

  /**
   * Process the queue by executing submissions up to the concurrent limit
   */
  private async processQueue(): Promise<void> {
    // If we're at max concurrent or queue is empty, do nothing
    if (this.activeCount >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    // Get next submission from queue
    const submission = this.queue.shift()
    if (!submission) {
      return
    }

    this.activeCount++

    try {
      const result = await submission.execute()
      submission.resolve(result)
    } catch (error) {
      submission.reject(error)
    } finally {
      this.activeCount--
      // Process next item in queue
      this.processQueue()
    }
  }

  /**
   * Get the current position of a submission in the queue
   */
  getQueuePosition(id: string): number {
    const index = this.queue.findIndex(s => s.id === id)
    return index === -1 ? -1 : index + 1
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeCount: this.activeCount,
      maxConcurrent: this.maxConcurrent,
      maxQueueSize: this.maxQueueSize,
      availableSlots: this.maxConcurrent - this.activeCount
    }
  }

  /**
   * Clear all pending submissions (for emergency situations)
   */
  clear(): void {
    const error = new Error('Queue was cleared')
    this.queue.forEach(submission => {
      submission.reject(error)
    })
    this.queue = []
  }

  /**
   * Get estimated wait time in seconds
   */
  getEstimatedWaitTime(): number {
    if (this.queue.length === 0) {
      return 0
    }

    // Assume average execution time of 3 seconds per submission
    const avgExecutionTime = 3
    const position = this.queue.length
    const slotsAvailable = this.maxConcurrent - this.activeCount
    
    if (slotsAvailable > 0) {
      return 0
    }

    // Calculate wait time based on position and concurrent slots
    const batchesAhead = Math.ceil(position / this.maxConcurrent)
    return batchesAhead * avgExecutionTime
  }
}

// Create singleton instance
export const submissionQueue = new SubmissionQueue(10, 100)
