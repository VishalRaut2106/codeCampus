// Metrics Service for monitoring API calls, errors, and performance
// Tracks key metrics for monitoring dashboards

export interface APIMetric {
  endpoint: string
  method: string
  statusCode: number
  responseTime: number
  timestamp: Date
  userId?: string
  error?: string
}

export interface ErrorMetric {
  endpoint: string
  errorType: string
  errorMessage: string
  timestamp: Date
  userId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface DatabaseMetric {
  query: string
  executionTime: number
  timestamp: Date
  rowCount?: number
}

export interface Judge0Metric {
  submissionId: string
  language: string
  responseTime: number
  status: string
  timestamp: Date
  userId?: string
}

export interface MetricsSummary {
  apiCalls: {
    total: number
    byEndpoint: Record<string, number>
    byStatus: Record<number, number>
    averageResponseTime: number
  }
  errors: {
    total: number
    byEndpoint: Record<string, number>
    bySeverity: Record<string, number>
    errorRate: number
  }
  database: {
    totalQueries: number
    averageExecutionTime: number
    slowQueries: number
  }
  judge0: {
    totalSubmissions: number
    averageResponseTime: number
    byStatus: Record<string, number>
  }
}

class MetricsService {
  private apiMetrics: APIMetric[] = []
  private errorMetrics: ErrorMetric[] = []
  private databaseMetrics: DatabaseMetric[] = []
  private judge0Metrics: Judge0Metric[] = []

  private maxStoredMetrics = 1000
  private slowQueryThreshold = 100 // ms

  /**
   * Track API call
   */
  trackAPICall(metric: APIMetric): void {
    this.apiMetrics.unshift(metric)
    this.trimMetrics(this.apiMetrics)

    // Log slow API calls
    if (metric.responseTime > 1000) {
      console.warn(`[Slow API] ${metric.endpoint} took ${metric.responseTime}ms`)
    }
  }

  /**
   * Track error
   */
  trackError(metric: ErrorMetric): void {
    this.errorMetrics.unshift(metric)
    this.trimMetrics(this.errorMetrics)

    // Log critical errors immediately
    if (metric.severity === 'critical') {
      console.error(`[Critical Error] ${metric.endpoint}: ${metric.errorMessage}`)
    }
  }

  /**
   * Track database query
   */
  trackDatabaseQuery(metric: DatabaseMetric): void {
    this.databaseMetrics.unshift(metric)
    this.trimMetrics(this.databaseMetrics)

    // Log slow queries
    if (metric.executionTime > this.slowQueryThreshold) {
      console.warn(`[Slow Query] ${metric.query.substring(0, 100)}... took ${metric.executionTime}ms`)
    }
  }

  /**
   * Track Judge0 API call
   */
  trackJudge0Call(metric: Judge0Metric): void {
    this.judge0Metrics.unshift(metric)
    this.trimMetrics(this.judge0Metrics)

    // Log slow Judge0 calls
    if (metric.responseTime > 5000) {
      console.warn(`[Slow Judge0] Submission ${metric.submissionId} took ${metric.responseTime}ms`)
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(timeWindow?: number): MetricsSummary {
    const now = Date.now()
    const windowMs = timeWindow ? timeWindow * 60 * 1000 : Infinity

    // Filter metrics by time window
    const recentAPIMetrics = this.apiMetrics.filter(
      m => now - m.timestamp.getTime() < windowMs
    )
    const recentErrorMetrics = this.errorMetrics.filter(
      m => now - m.timestamp.getTime() < windowMs
    )
    const recentDBMetrics = this.databaseMetrics.filter(
      m => now - m.timestamp.getTime() < windowMs
    )
    const recentJudge0Metrics = this.judge0Metrics.filter(
      m => now - m.timestamp.getTime() < windowMs
    )

    // Calculate API metrics
    const byEndpoint: Record<string, number> = {}
    const byStatus: Record<number, number> = {}
    let totalResponseTime = 0

    recentAPIMetrics.forEach(metric => {
      byEndpoint[metric.endpoint] = (byEndpoint[metric.endpoint] || 0) + 1
      byStatus[metric.statusCode] = (byStatus[metric.statusCode] || 0) + 1
      totalResponseTime += metric.responseTime
    })

    // Calculate error metrics
    const errorsByEndpoint: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}

    recentErrorMetrics.forEach(metric => {
      errorsByEndpoint[metric.endpoint] = (errorsByEndpoint[metric.endpoint] || 0) + 1
      errorsBySeverity[metric.severity] = (errorsBySeverity[metric.severity] || 0) + 1
    })

    // Calculate database metrics
    let totalDBTime = 0
    let slowQueries = 0

    recentDBMetrics.forEach(metric => {
      totalDBTime += metric.executionTime
      if (metric.executionTime > this.slowQueryThreshold) {
        slowQueries++
      }
    })

    // Calculate Judge0 metrics
    const judge0ByStatus: Record<string, number> = {}
    let totalJudge0Time = 0

    recentJudge0Metrics.forEach(metric => {
      judge0ByStatus[metric.status] = (judge0ByStatus[metric.status] || 0) + 1
      totalJudge0Time += metric.responseTime
    })

    return {
      apiCalls: {
        total: recentAPIMetrics.length,
        byEndpoint,
        byStatus,
        averageResponseTime: recentAPIMetrics.length > 0 
          ? totalResponseTime / recentAPIMetrics.length 
          : 0
      },
      errors: {
        total: recentErrorMetrics.length,
        byEndpoint: errorsByEndpoint,
        bySeverity: errorsBySeverity,
        errorRate: recentAPIMetrics.length > 0 
          ? (recentErrorMetrics.length / recentAPIMetrics.length) * 100 
          : 0
      },
      database: {
        totalQueries: recentDBMetrics.length,
        averageExecutionTime: recentDBMetrics.length > 0 
          ? totalDBTime / recentDBMetrics.length 
          : 0,
        slowQueries
      },
      judge0: {
        totalSubmissions: recentJudge0Metrics.length,
        averageResponseTime: recentJudge0Metrics.length > 0 
          ? totalJudge0Time / recentJudge0Metrics.length 
          : 0,
        byStatus: judge0ByStatus
      }
    }
  }

  /**
   * Get API metrics
   */
  getAPIMetrics(limit?: number): APIMetric[] {
    return limit ? this.apiMetrics.slice(0, limit) : [...this.apiMetrics]
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(limit?: number): ErrorMetric[] {
    return limit ? this.errorMetrics.slice(0, limit) : [...this.errorMetrics]
  }

  /**
   * Get database metrics
   */
  getDatabaseMetrics(limit?: number): DatabaseMetric[] {
    return limit ? this.databaseMetrics.slice(0, limit) : [...this.databaseMetrics]
  }

  /**
   * Get Judge0 metrics
   */
  getJudge0Metrics(limit?: number): Judge0Metric[] {
    return limit ? this.judge0Metrics.slice(0, limit) : [...this.judge0Metrics]
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.apiMetrics = []
    this.errorMetrics = []
    this.databaseMetrics = []
    this.judge0Metrics = []
  }

  /**
   * Check if metrics exceed thresholds
   */
  checkThresholds(): {
    errorRateHigh: boolean
    responseTimeSlow: boolean
    slowQueriesHigh: boolean
  } {
    const summary = this.getSummary(5) // Last 5 minutes

    return {
      errorRateHigh: summary.errors.errorRate > 5, // > 5% error rate
      responseTimeSlow: summary.apiCalls.averageResponseTime > 1000, // > 1s
      slowQueriesHigh: summary.database.slowQueries > 10 // > 10 slow queries
    }
  }

  private trimMetrics(metrics: any[]): void {
    if (metrics.length > this.maxStoredMetrics) {
      metrics.splice(this.maxStoredMetrics)
    }
  }
}

// Export singleton instance
export const metricsService = new MetricsService()

// Middleware to track API calls
export function createMetricsMiddleware() {
  return async (req: Request, handler: () => Promise<Response>): Promise<Response> => {
    const startTime = Date.now()
    const endpoint = new URL(req.url).pathname
    const method = req.method

    try {
      const response = await handler()
      const responseTime = Date.now() - startTime

      metricsService.trackAPICall({
        endpoint,
        method,
        statusCode: response.status,
        responseTime,
        timestamp: new Date()
      })

      return response
    } catch (error) {
      const responseTime = Date.now() - startTime

      metricsService.trackAPICall({
        endpoint,
        method,
        statusCode: 500,
        responseTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      metricsService.trackError({
        endpoint,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        errorMessage: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        severity: 'high'
      })

      throw error
    }
  }
}
