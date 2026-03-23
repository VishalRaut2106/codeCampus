'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  AlertTriangle, 
  Database, 
  Zap, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface MetricsSummary {
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

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeWindow, setTimeWindow] = useState(60) // minutes
  const [alerts, setAlerts] = useState({
    errorRateHigh: false,
    responseTimeSlow: false,
    slowQueriesHigh: false
  })

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/monitoring/metrics?timeWindow=${timeWindow}`)
      const data = await response.json()

      if (data.success) {
        setMetrics(data.data.summary)
        setAlerts(data.data.alerts)
      } else {
        toast.error('Failed to fetch metrics')
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      toast.error('Failed to fetch metrics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [timeWindow])

  const handleRefresh = () => {
    setLoading(true)
    fetchMetrics()
  }

  const handleClearMetrics = async () => {
    try {
      const response = await fetch('/api/monitoring/metrics', {
        method: 'DELETE'
      })
      const data = await response.json()

      if (data.success) {
        toast.success('Metrics cleared successfully')
        fetchMetrics()
      } else {
        toast.error('Failed to clear metrics')
      }
    } catch (error) {
      console.error('Failed to clear metrics:', error)
      toast.error('Failed to clear metrics')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C896]"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No metrics available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">System Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            Real-time metrics and performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(parseInt(e.target.value))}
            className="bg-muted border border-border rounded px-3 py-2 text-sm"
          >
            <option value={5}>Last 5 minutes</option>
            <option value={15}>Last 15 minutes</option>
            <option value={60}>Last hour</option>
            <option value={1440}>Last 24 hours</option>
          </select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleClearMetrics} variant="outline" size="sm">
            Clear Metrics
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(alerts.errorRateHigh || alerts.responseTimeSlow || alerts.slowQueriesHigh) && (
        <Card className="glass-card border-red-500/30 bg-red-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.errorRateHigh && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive">Critical</Badge>
                  <span>Error rate exceeds 5%</span>
                </div>
              )}
              {alerts.responseTimeSlow && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="destructive">Critical</Badge>
                  <span>API response time exceeds 1 second</span>
                </div>
              )}
              {alerts.slowQueriesHigh && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-yellow-500/20 text-yellow-400">Warning</Badge>
                  <span>High number of slow database queries</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* API Calls */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                {metrics.apiCalls.total}
              </div>
              <div className="text-xs text-muted-foreground">
                Avg: {metrics.apiCalls.averageResponseTime.toFixed(0)}ms
              </div>
              {metrics.apiCalls.averageResponseTime > 500 ? (
                <Badge className="bg-red-500/20 text-red-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Slow
                </Badge>
              ) : (
                <Badge className="bg-green-500/20 text-green-400">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Fast
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Errors */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                {metrics.errors.total}
              </div>
              <div className="text-xs text-muted-foreground">
                Rate: {metrics.errors.errorRate.toFixed(2)}%
              </div>
              {metrics.errors.errorRate > 1 ? (
                <Badge className="bg-red-500/20 text-red-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  High
                </Badge>
              ) : (
                <Badge className="bg-green-500/20 text-green-400">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Low
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-400" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                {metrics.database.totalQueries}
              </div>
              <div className="text-xs text-muted-foreground">
                Avg: {metrics.database.averageExecutionTime.toFixed(0)}ms
              </div>
              <div className="text-xs text-muted-foreground">
                Slow: {metrics.database.slowQueries}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Judge0 */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              Judge0
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">
                {metrics.judge0.totalSubmissions}
              </div>
              <div className="text-xs text-muted-foreground">
                Avg: {(metrics.judge0.averageResponseTime / 1000).toFixed(1)}s
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Endpoints */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.apiCalls.byEndpoint)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([endpoint, count]) => (
                  <div key={endpoint} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground truncate">{endpoint}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Error Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.errors.bySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{severity}</span>
                  <Badge 
                    className={
                      severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }
                  >
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
