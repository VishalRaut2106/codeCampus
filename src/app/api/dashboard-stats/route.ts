import { createServerClientSafe, createServiceRoleClient } from '@/lib/supabase/server-safe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== FETCHING DASHBOARD STATS ===')

    // --- SECURITY CHECK START ---
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    )

    const { data: { user: authUser }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized: Please log in first'
      }, { status: 401 })
    }

    // Verify Admin Role
    const supabaseAdmin = createServiceRoleClient()
    const { data: userRoleData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (roleError || !userRoleData || !['admin', 'super_admin'].includes(userRoleData.role)) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, { status: 403 })
    }
    // --- SECURITY CHECK END ---

    // Now use supabaseAdmin (Service Role) for all queries to ensure we see all data
    // faster and bypassing RLS (since we already verified admin status)
    
    let stats = null
    let method = 'unknown'

    // 1. Try using the main stats RPC
    try {
      const { data: statsData, error: functionError } = await supabaseAdmin
        .rpc('get_dashboard_stats_admin')

      if (!functionError && statsData) {
        stats = statsData
        method = 'working_admin_function'
      }
    } catch (funcError) {
      console.log('Admin stats function unavailable, likely not defined yet.')
    }

    // 2. Fallback to direct counting if RPC failed
    if (!stats) {
      console.log('Using direct counts for dashboard stats...')
      
      const [studentsResult, pendingResult, contestsResult, problemsResult, submissionsResult] = await Promise.all([
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('approval_status', 'pending'),
        supabaseAdmin.from('contests').select('id, start_time, end_time'), // We need dates for active check
        supabaseAdmin.from('problems').select('id', { count: 'exact', head: true }),
        supabaseAdmin.from('submissions').select('id', { count: 'exact', head: true })
      ])

      // Calculate active contests
      const now = new Date()
      const activeContests = contestsResult.data?.filter(contest => {
        const startTime = new Date(contest.start_time)
        const endTime = new Date(contest.end_time)
        return now >= startTime && now <= endTime
      }).length || 0

      stats = {
        totalStudents: studentsResult.count || 0,
        pendingApprovals: pendingResult.count || 0,
        totalContests: contestsResult.data?.length || 0,
        activeContests,
        totalProblems: problemsResult.count || 0,
        totalSubmissions: submissionsResult.count || 0
      }
      method = 'direct_queries_optimized'
    }

    // --- Chart Data via Optimized RPCs ---
    
    // We use Promise.allSettled to ensure one failure doesn't break the whole dashboard
    const [regTrendRes, subActivityRes, deptDistRes] = await Promise.allSettled([
      supabaseAdmin.rpc('get_registration_trend'),
      supabaseAdmin.rpc('get_submission_activity'),
      supabaseAdmin.rpc('get_department_distribution')
    ])

    const charts = {
      registrationTrend: regTrendRes.status === 'fulfilled' && regTrendRes.value.data ? regTrendRes.value.data : [],
      submissionActivity: subActivityRes.status === 'fulfilled' && subActivityRes.value.data ? subActivityRes.value.data : [],
      departmentDistribution: deptDistRes.status === 'fulfilled' && deptDistRes.value.data ? deptDistRes.value.data : []
    }

    // Fallback for submissionActivity if RPC failed or returned empty due to schema mismatch
    if (charts.submissionActivity.length === 0) {
      try {
        const { data: directSubData } = await supabaseAdmin
          .from('submissions')
          .select('submitted_at')
          .gte('submitted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        
        if (directSubData) {
          const activityMap = new Map();
          // Initialize last 7 days
          for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            activityMap.set(d.toISOString().split('T')[0], 0);
          }
          
          directSubData.forEach((s: any) => {
            const date = s.submitted_at.split('T')[0];
            if (activityMap.has(date)) {
              activityMap.set(date, activityMap.get(date) + 1);
            }
          });
          
          charts.submissionActivity = Array.from(activityMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
        }
      } catch (err) {
        console.warn('Submission activity fallback failed:', err);
      }
    }

    // fallback formatting for charts if RPCs return raw data structure difference?
    // The RPC returns { date, count } or { department, count }
    // The frontend expects:
    // Registration: { name: 'Mon', students: 5 }
    // Submission: { name: 'Mon', submissions: 10 }
    // Department: { name: 'CS', value: 20, color: '...' }

    // We need to transform the RPC data to match frontend expectations
    // Actually, let's keep the frontend logic for formatting but supply the data?
    // The previous code did heavy formatting in backend.
    
    // Let's re-implement the formatting logic using the RPC data
    const formattedCharts = {
      registrationTrend: formatTrendData(charts.registrationTrend, 'students'),
      submissionActivity: formatTrendData(charts.submissionActivity, 'submissions'),
      departmentDistribution: formatDepartmentData(charts.departmentDistribution)
    }

    return NextResponse.json({
      success: true,
      data: stats,
      charts: formattedCharts,
      method: method
    })

  } catch (error) {
    console.error('Dashboard stats API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// Helper: Format Trend Data from RPC [{ date: '2023-01-01', count: 5 }] to [{ name: 'Sun', students: 5 }]
function formatTrendData(data: any[], keyName: string) {
  if (!Array.isArray(data)) return []
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // The RPC returns last 7 days including today.
  // We want to map them to day names.
  
  return data.map(item => {
    const date = new Date(item.date)
    return {
      name: days[date.getDay()],
      [keyName]: Number(item.count), // Ensure number
      date: item.date
    }
  })
}

// Helper: Format Department Data
function formatDepartmentData(data: any[]) {
  if (!Array.isArray(data)) return []
  
  const colors = ['#00C896', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1']
  
  return data.map((item, index) => ({
    name: item.department,
    value: Number(item.count),
    color: colors[index % colors.length]
  }))
}
