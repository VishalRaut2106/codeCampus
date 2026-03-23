import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { metricsService } from '@/lib/monitoring/metrics-service'

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

    // Get time window from query params (in minutes)
    const searchParams = request.nextUrl.searchParams
    const timeWindow = parseInt(searchParams.get('timeWindow') || '60')

    // Get metrics summary
    const summary = metricsService.getSummary(timeWindow)

    // Get recent metrics
    const recentAPIMetrics = metricsService.getAPIMetrics(50)
    const recentErrors = metricsService.getErrorMetrics(50)
    const recentDBMetrics = metricsService.getDatabaseMetrics(50)
    const recentJudge0Metrics = metricsService.getJudge0Metrics(50)

    // Check thresholds
    const thresholds = metricsService.checkThresholds()

    return NextResponse.json({
      success: true,
      data: {
        summary,
        recentMetrics: {
          api: recentAPIMetrics,
          errors: recentErrors,
          database: recentDBMetrics,
          judge0: recentJudge0Metrics
        },
        alerts: thresholds,
        timeWindow
      }
    })
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch metrics' },
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

    // Clear all metrics
    metricsService.clearMetrics()

    return NextResponse.json({
      success: true,
      message: 'Metrics cleared successfully'
    })
  } catch (error) {
    console.error('Failed to clear metrics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear metrics' },
      { status: 500 }
    )
  }
}
