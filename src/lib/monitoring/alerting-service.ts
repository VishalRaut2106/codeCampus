// Alerting Service for monitoring thresholds and triggering alerts
// Monitors metrics and sends alerts when thresholds are exceeded

import { metricsService } from './metrics-service'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  id: string
  severity: AlertSeverity
  title: string
  message: string
  timestamp: Date
  metric: string
  value: number
  threshold: number
  acknowledged: boolean
}

export interface AlertRule {
  id: string
  name: string
  metric: 'errorRate' | 'responseTime' | 'cacheHitRate' | 'slowQueries'
  threshold: number
  severity: AlertSeverity
  enabled: boolean
  cooldown: number // minutes
}

class AlertingService {
  private alerts: Alert[] = []
  private alertRules: AlertRule[] = [
    {
      id: 'error-rate-critical',
      name: 'High Error Rate (Critical)',
      metric: 'errorRate',
      threshold: 5, // 5%
      severity: 'critical',
      enabled: true,
      cooldown: 5
    },
    {
      id: 'error-rate-warning',
      name: 'Elevated Error Rate (Warning)',
      metric: 'errorRate',
      threshold: 1, // 1%
      severity: 'warning',
      enabled: true,
      cooldown: 10
    },
    {
      id: 'response-time-critical',
      name: 'Slow API Response (Critical)',
      metric: 'responseTime',
      threshold: 1000, // 1 second
      severity: 'critical',
      enabled: true,
      cooldown: 5
    },
    {
      id: 'cache-hit-rate-warning',
      name: 'Low Cache Hit Rate (Warning)',
      metric: 'cacheHitRate',
      threshold: 70, // 70%
      severity: 'warning',
      enabled: true,
      cooldown: 15
    },
    {
      id: 'slow-queries-warning',
      name: 'High Slow Query Count (Warning)',
      metric: 'slowQueries',
      threshold: 10,
      severity: 'warning',
      enabled: true,
      cooldown: 10
    }
  ]

  private lastAlertTime: Map<string, Date> = new Map()
  private maxStoredAlerts = 100

  /**
   * Check all alert rules and trigger alerts if thresholds exceeded
   */
  checkAlerts(): Alert[] {
    const newAlerts: Alert[] = []
    const summary = metricsService.getSummary(5) // Last 5 minutes

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue

      // Check cooldown
      const lastAlert = this.lastAlertTime.get(rule.id)
      if (lastAlert) {
        const minutesSinceLastAlert = (Date.now() - lastAlert.getTime()) / 1000 / 60
        if (minutesSinceLastAlert < rule.cooldown) {
          continue
        }
      }

      // Get metric value
      let value: number
      let shouldAlert = false

      switch (rule.metric) {
        case 'errorRate':
          value = summary.errors.errorRate
          shouldAlert = value > rule.threshold
          break
        
        case 'responseTime':
          value = summary.apiCalls.averageResponseTime
          shouldAlert = value > rule.threshold
          break
        
        case 'cacheHitRate':
          // This would need to be tracked separately
          value = 0 // Placeholder
          shouldAlert = false // Disabled for now
          break
        
        case 'slowQueries':
          value = summary.database.slowQueries
          shouldAlert = value > rule.threshold
          break
        
        default:
          continue
      }

      if (shouldAlert) {
        const alert = this.createAlert(rule, value)
        newAlerts.push(alert)
        this.alerts.unshift(alert)
        this.lastAlertTime.set(rule.id, new Date())

        // Log alert
        this.logAlert(alert)

        // Send notification
        this.sendNotification(alert)
      }
    }

    // Trim old alerts
    if (this.alerts.length > this.maxStoredAlerts) {
      this.alerts = this.alerts.slice(0, this.maxStoredAlerts)
    }

    return newAlerts
  }

  /**
   * Get all alerts
   */
  getAlerts(limit?: number): Alert[] {
    return limit ? this.alerts.slice(0, limit) : [...this.alerts]
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(): Alert[] {
    return this.alerts.filter(a => !a.acknowledged)
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertSeverity): Alert[] {
    return this.alerts.filter(a => a.severity === severity)
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      return true
    }
    return false
  }

  /**
   * Acknowledge all alerts
   */
  acknowledgeAllAlerts(): void {
    this.alerts.forEach(alert => {
      alert.acknowledged = true
    })
  }

  /**
   * Get alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules]
  }

  /**
   * Update alert rule
   */
  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.alertRules.find(r => r.id === ruleId)
    if (rule) {
      Object.assign(rule, updates)
      return true
    }
    return false
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = []
    this.lastAlertTime.clear()
  }

  private createAlert(rule: AlertRule, value: number): Alert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity: rule.severity,
      title: rule.name,
      message: this.getAlertMessage(rule, value),
      timestamp: new Date(),
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      acknowledged: false
    }
  }

  private getAlertMessage(rule: AlertRule, value: number): string {
    switch (rule.metric) {
      case 'errorRate':
        return `Error rate is ${value.toFixed(2)}%, exceeding threshold of ${rule.threshold}%`
      
      case 'responseTime':
        return `Average API response time is ${value.toFixed(0)}ms, exceeding threshold of ${rule.threshold}ms`
      
      case 'cacheHitRate':
        return `Cache hit rate is ${value.toFixed(2)}%, below threshold of ${rule.threshold}%`
      
      case 'slowQueries':
        return `${value} slow database queries detected, exceeding threshold of ${rule.threshold}`
      
      default:
        return `Metric ${rule.metric} exceeded threshold`
    }
  }

  private logAlert(alert: Alert): void {
    const severityColors = {
      info: '\x1b[36m',
      warning: '\x1b[33m',
      critical: '\x1b[31m'
    }
    const color = severityColors[alert.severity]
    const reset = '\x1b[0m'

    console.log(
      `${color}[ALERT ${alert.severity.toUpperCase()}]${reset} ${alert.title}: ${alert.message}`
    )
  }

  private async sendNotification(alert: Alert): Promise<void> {
    try {
      // Send alert to backend endpoint for notification
      await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alert)
      }).catch(() => {
        // Silently fail - alerting should never break the app
      })
    } catch (error) {
      // Silently fail
    }
  }
}

// Export singleton instance
export const alertingService = new AlertingService()

// Setup automatic alert checking
export function setupAlertMonitoring(intervalMinutes: number = 1) {
  if (typeof window !== 'undefined') {
    // Check alerts every interval
    setInterval(() => {
      alertingService.checkAlerts()
    }, intervalMinutes * 60 * 1000)

    // Initial check
    alertingService.checkAlerts()
  }
}
