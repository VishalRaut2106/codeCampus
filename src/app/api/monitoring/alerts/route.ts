import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { alertingService } from '@/lib/monitoring/alerting-service'

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check admin status
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const severity = searchParams.get('severity')
    const unacknowledgedOnly = searchParams.get('unacknowledged') === 'true'

    // Get alerts
    let alerts = unacknowledgedOnly 
      ? alertingService.getUnacknowledgedAlerts()
      : alertingService.getAlerts()

    // Filter by severity if specified
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity)
    }

    // Get alert rules
    const rules = alertingService.getAlertRules()

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        rules,
        summary: {
          total: alerts.length,
          unacknowledged: alerts.filter(a => !a.acknowledged).length,
          critical: alerts.filter(a => a.severity === 'critical').length,
          warning: alerts.filter(a => a.severity === 'warning').length
        }
      }
    })
  } catch (error) {
    console.error('Failed to fetch alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, alertId, ruleId, updates } = body

    // Check if user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check admin status
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Handle different actions
    switch (action) {
      case 'acknowledge':
        if (alertId) {
          const success = alertingService.acknowledgeAlert(alertId)
          return NextResponse.json({ success, message: 'Alert acknowledged' })
        } else {
          alertingService.acknowledgeAllAlerts()
          return NextResponse.json({ success: true, message: 'All alerts acknowledged' })
        }

      case 'updateRule':
        if (ruleId && updates) {
          const success = alertingService.updateAlertRule(ruleId, updates)
          return NextResponse.json({ 
            success, 
            message: success ? 'Rule updated' : 'Rule not found' 
          })
        }
        return NextResponse.json(
          { success: false, error: 'Missing ruleId or updates' },
          { status: 400 }
        )

      case 'checkAlerts':
        const newAlerts = alertingService.checkAlerts()
        return NextResponse.json({ 
          success: true, 
          data: { newAlerts, count: newAlerts.length } 
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Failed to process alert action:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process alert action' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check admin status
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Clear all alerts
    alertingService.clearAlerts()

    return NextResponse.json({
      success: true,
      message: 'All alerts cleared'
    })
  } catch (error) {
    console.error('Failed to clear alerts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear alerts' },
      { status: 500 }
    )
  }
}
