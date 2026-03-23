import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Bonus points configuration
const BONUS_POINTS = {
  1: 100,
  2: 50,
  3: 25
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: contestId } = await params

    // 1. Verify Admin (simplified for now, check for authenticated user)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch Leaderboard (using internal logic similar to leaderboard route)
    // We can't easily call the other API route internally, so we replicate logic briefly
    // Or we fetch the submissions again.
    
    // Fetch contest details first
    const { data: contest } = await supabase
      .from('contests')
      .select('id, start_time, problems:contest_problems(problem_id, points)')
      .eq('id', contestId)
      .single()
      
    if (!contest) return NextResponse.json({ error: 'Contest not found' }, { status: 404 })

    // Fetch submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('user_id, problem_id, status, submitted_at')
      .eq('contest_id', contestId)
      .eq('status', 'accepted') // Only care about accepted for score
    
    const problemPoints = new Map()
    contest.problems.forEach((p: any) => problemPoints.set(p.problem_id, p.points || 100))

    // Calculate Scores & Times
    const userStats = new Map<string, { total_score: number, finish_time: number }>()

    const startTime = new Date(contest.start_time).getTime()

    submissions?.forEach((sub: any) => {
       if (!userStats.has(sub.user_id)) {
         userStats.set(sub.user_id, { total_score: 0, finish_time: 0 })
       }
       const stat = userStats.get(sub.user_id)!
       const points = problemPoints.get(sub.problem_id) || 100
       stat.total_score += points
       
       const subTime = Math.max(0, Math.floor((new Date(sub.submitted_at).getTime() - startTime) / 60000))
       stat.finish_time = Math.max(stat.finish_time, subTime)
    })

    // Sort
    const ranking = Array.from(userStats.entries())
      .map(([userId, stats]) => ({ userId, ...stats }))
      .sort((a, b) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score
        return a.finish_time - b.finish_time
      })
      .slice(0, 3) // Top 3

    // 3. Award Points
    const results = []
    
    for (let i = 0; i < ranking.length; i++) {
      const winner = ranking[i]
      const rank = i + 1
      const bonus = BONUS_POINTS[rank as keyof typeof BONUS_POINTS]
      
      // Update User Points
      const { data: userData } = await supabase.from('users').select('points').eq('id', winner.userId).single()
      const currentPoints = userData?.points || 0
      
      await supabase.from('users').update({
        points: currentPoints + bonus
      }).eq('id', winner.userId)

      results.push({ userId: winner.userId, rank, bonus })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Finalize error:', error)
    return NextResponse.json({ success: false, error: 'Failed to finalize' }, { status: 500 })
  }
}
