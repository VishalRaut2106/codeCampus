import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface SubmissionsData {
  id: string
  problem_id: string
  user_id: string
  status: string
  submitted_at: string
  users: {
    username: string
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: contestId } = await params
    
    // 1. Fetch Contest Details (for start time)
    const { data: contest } = await supabase
      .from('contests')
      .select('id, start_time, problems:contest_problems(problem_id, points)')
      .eq('id', contestId)
      .single()

    if (!contest) {
      return NextResponse.json({ success: false, error: 'Contest not found' }, { status: 404 })
    }

    const startTime = new Date(contest.start_time).getTime()
    
    // Map problem points
    const problemPoints = new Map<string, number>()
    contest.problems.forEach((p: any) => {
      problemPoints.set(p.problem_id, p.points || 100)
    })

    // 2. Fetch All Submissions for this contest
    // We need to fetch submissions relevant to the contest problems and time range
    // Ideally, we should filter by contest_id if submissions table has it.
    // Assuming 'submissions' table has 'contest_id' column from previous context.
    
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        id,
        problem_id,
        user_id,
        status,
        submitted_at,
        users:user_id (
          user_metadata
        )
      `)
      .eq('contest_id', contestId)
      .order('submitted_at', { ascending: true })

    // Note: This logic implicitly filters out users who registered but haven't submitted anything.
    // They will not appear in the submissions table for this contest.
    // This matches LeetCode behavior where you only appear on leaderboard after a submission.

    if (error) throw error

    // 3. Calculate Scores
    const leaderboard = new Map<string, {
      user_id: string
      username: string
      total_score: number
      penalty: number // in minutes
      solved_problems: Set<string>
      problems_status: Map<string, { attempts: number, solved: boolean, solved_at: number }>
    }>()

    // Using any for the raw DB response type
    const rawSubmissions = submissions || []

    rawSubmissions.forEach((sub: any) => {
      if (!leaderboard.has(sub.user_id)) {
        leaderboard.set(sub.user_id, {
          user_id: sub.user_id,
          username: sub.users?.user_metadata?.username || 'Anonymous',
          total_score: 0,
          penalty: 0,
          solved_problems: new Set(),
          problems_status: new Map()
        })
      }

      const userEntry = leaderboard.get(sub.user_id)!
      
      // Init problem status if not present
      if (!userEntry.problems_status.has(sub.problem_id)) {
        userEntry.problems_status.set(sub.problem_id, { attempts: 0, solved: false, solved_at: 0 })
      }
      
      const pStatus = userEntry.problems_status.get(sub.problem_id)!

      if (pStatus.solved) return // Already solved, ignore further submissions

      if (sub.status === 'accepted') {
        pStatus.solved = true
        const submissionTime = new Date(sub.submitted_at).getTime()
        const timeTakenMinutes = Math.max(0, Math.floor((submissionTime - startTime) / (1000 * 60)))
        
        // Update user stats
        pStatus.solved_at = timeTakenMinutes
        userEntry.solved_problems.add(sub.problem_id)
        
        // Calculate points
        const points = problemPoints.get(sub.problem_id) || 100
        userEntry.total_score += points
        
        // Track finish time (time of last accepted submission) for tie-breaking
        // We take the max of current finish_time and this submission's time
        // This effectively becomes the time they "finished" achieving their current score
        userEntry.penalty = Math.max(userEntry.penalty, timeTakenMinutes) // Reuse 'penalty' field as 'finish_time' minutes

      } else {
        // Wrong attempt (Compilation Error usually doesn't count, but let's count all non-accepted for now to be strict, or filter out CE)
        // Standard ICPC: CE doesn't count. WA, TLE, RE count.
        if (sub.status !== 'compilation_error') {
           pStatus.attempts += 1
        }
      }
    })

    // 4. Convert to Array and Sort
    const ranking = Array.from(leaderboard.values())
      .sort((a, b) => {
        // Sort by Score (Desc)
        if (b.total_score !== a.total_score) return b.total_score - a.total_score
        // Then by Penalty (Asc) -> Lower penalty is better
        return a.penalty - b.penalty
      })
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
        solved_problems: Array.from(entry.solved_problems),
        problems_status: Object.fromEntries(entry.problems_status) // Serialize Map for JSON
      }))

    return NextResponse.json({
      success: true,
      data: ranking,
      meta: {
        total_participants: ranking.length,
        last_updated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard' }, 
      { status: 500 }
    )
  }
}