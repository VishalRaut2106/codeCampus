import { createServerClientSafe } from '@/lib/supabase/server-safe'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerClientSafe()
    
    console.log('=== FETCHING LEADERBOARD DATA ===')

    // Try using the admin function first
    try {
      const { data: students, error: functionError } = await supabase
        .rpc('get_all_students_admin')

      if (functionError) {
        console.log('Admin function failed:', functionError.message)
        throw functionError
      }

      if (students) {
        // Filter only approved students and sort by points
        const leaderboardData = students
          .filter((student: any) => student.approval_status === 'approved')
          .sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
          .map((student: any, index: number) => ({
            id: student.id,
            name: student.name,
            points: student.points || 0,
            streak: student.streak || 0,
            badges: student.badges || [],
            rank: index + 1
          }))

        console.log('Leaderboard data fetched via admin function:', leaderboardData.length, 'users')
        
        return NextResponse.json({
          success: true,
          data: leaderboardData,
          count: leaderboardData.length,
          method: 'admin_function'
        })
      }
    } catch (funcError) {
      console.log('Admin function not available, trying direct query...')
    }

    // Fallback to direct query
    const { data: users, error: directError } = await supabase
      .from('users')
      .select('id, name, points, streak, badges')
      .eq('role', 'student')
      .eq('approval_status', 'approved')
      .order('points', { ascending: false })
      .limit(50)

    if (directError) {
      console.error('Direct query failed:', directError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch leaderboard: ${directError.message}`,
        data: []
      }, { status: 500 })
    }

    // Add rank to users
    const leaderboardData = (users || []).map((user, index) => ({
      ...user,
      rank: index + 1
    }))

    console.log('Leaderboard data fetched via direct query:', leaderboardData.length, 'users')
    
    return NextResponse.json({
      success: true,
      data: leaderboardData,
      count: leaderboardData.length,
      method: 'direct_query'
    })

  } catch (error) {
    console.error('Leaderboard API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      data: []
    }, { status: 500 })
  }
}
