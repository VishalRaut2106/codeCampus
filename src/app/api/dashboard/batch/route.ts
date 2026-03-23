/**
 * Dashboard Batch API Endpoint
 * Fetches all dashboard data in a single batched call with caching
 * Requirements: 5.1, 10.1
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClientSafe } from '@/lib/supabase/server-safe'
import cacheManager from '@/lib/cache/cache-manager'

interface DashboardData {
  stats: {
    totalStudents: number
    pendingApprovals: number
    totalContests: number
    activeContests: number
    totalProblems: number
    totalSubmissions: number
  }
  students: any[]
  contests: any[]
}

const CACHE_TTL = 60 // 1 minute cache

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Check if we have cached dashboard data
    const cacheKey = 'dashboard:all'
    const cached = await cacheManager.get<DashboardData>(cacheKey)

    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        executionTime: Date.now() - startTime,
      })
    }

    const supabase = createServerClientSafe()

    // Fetch all data in parallel
    const [
      studentsResult,
      pendingResult,
      contestsResult,
      problemsResult,
      submissionsResult,
      studentsDataResult,
      contestsDataResult,
    ] = await Promise.all([
      // Stats queries
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'student'),
      supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'student')
        .eq('approval_status', 'pending'),
      supabase
        .from('contests')
        .select('id, start_time, end_time', { count: 'exact' }),
      supabase.from('problems').select('id', { count: 'exact' }),
      supabase.from('submissions').select('id', { count: 'exact' }),

      // Full data queries
      supabase
        .from('users')
        .select(
          `
          id, name, email, username, prn, department, role,
          streak, points, badges, approval_status, profile_visible,
          approved_by, approved_at, rejection_reason,
          created_at, updated_at
        `
        )
        .eq('role', 'student')
        .order('created_at', { ascending: false }),
      supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    // Check for errors
    const errors = [
      studentsResult.error,
      pendingResult.error,
      contestsResult.error,
      problemsResult.error,
      submissionsResult.error,
      studentsDataResult.error,
      contestsDataResult.error,
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('Dashboard batch queries failed:', errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch dashboard data',
          details: errors,
        },
        { status: 500 }
      )
    }

    // Calculate active contests
    const now = new Date()
    const activeContests =
      contestsResult.data?.filter((contest) => {
        const startTime = new Date(contest.start_time)
        const endTime = new Date(contest.end_time)
        return now >= startTime && now <= endTime
      }).length || 0

    // Prepare response data
    const dashboardData: DashboardData = {
      stats: {
        totalStudents: studentsResult.count || 0,
        pendingApprovals: pendingResult.count || 0,
        totalContests: contestsResult.count || 0,
        activeContests,
        totalProblems: problemsResult.count || 0,
        totalSubmissions: submissionsResult.count || 0,
      },
      students: studentsDataResult.data || [],
      contests: contestsDataResult.data || [],
    }

    // Cache the result
    await cacheManager.set(cacheKey, dashboardData, CACHE_TTL)

    return NextResponse.json({
      success: true,
      data: dashboardData,
      cached: false,
      executionTime: Date.now() - startTime,
      metadata: {
        studentsCount: dashboardData.students.length,
        contestsCount: dashboardData.contests.length,
        cacheExpiry: CACHE_TTL,
      },
    })
  } catch (error) {
    console.error('Dashboard batch API failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint for optimistic updates
 * Allows updating cache without waiting for database write
 */
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    if (action === 'invalidate') {
      // Invalidate dashboard cache
      await cacheManager.invalidate('dashboard:all')
      return NextResponse.json({
        success: true,
        message: 'Dashboard cache invalidated',
      })
    }

    if (action === 'optimistic-update') {
      // Get current cached data
      const cacheKey = 'dashboard:all'
      const cached = await cacheManager.get<DashboardData>(cacheKey)

      if (cached && data) {
        // Apply optimistic update
        const updated = { ...cached, ...data }
        await cacheManager.set(cacheKey, updated, CACHE_TTL)

        return NextResponse.json({
          success: true,
          message: 'Optimistic update applied',
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: 'No cached data to update',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
      },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
