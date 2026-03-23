import { createServiceRoleClient } from '@/lib/supabase/server-safe'

export async function updateUserStats(userId: string) {
  try {
    const supabase = createServiceRoleClient()

    // Get user's accepted submissions to calculate stats
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        problem_id,
        status,
        score,
        submitted_at,
        problem:problems(difficulty)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')

    if (submissionsError) {
      console.error('Error fetching user submissions for stats:', submissionsError)
      throw new Error(`Failed to fetch submissions: ${submissionsError.message}`)
    }

    // Calculate unique problems solved by difficulty
    const uniqueProblems = new Map()
    let totalScore = 0

    submissions?.forEach((sub: any) => {
      // Use problem_id as key to ensure uniqueness
      if (!uniqueProblems.has(sub.problem_id)) {
        uniqueProblems.set(sub.problem_id, sub.problem)
        totalScore += sub.score || 0
      }
    })

    const stats = {
      easy: 0,
      medium: 0,
      hard: 0,
      total: uniqueProblems.size
    }

    uniqueProblems.forEach((problem: any) => {
      const difficulty = (problem?.difficulty || '').toLowerCase()
      if (difficulty === 'easy') stats.easy++
      else if (difficulty === 'medium') stats.medium++
      else if (difficulty === 'hard') stats.hard++
    })

    // Calculate streak (consecutive days with submissions)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let streak = 0
    const currentDate = new Date(today)
    
    // Check each day backwards to find consecutive submission days
    for (let i = 0; i < 365; i++) { // Max 365 days check
      const dayStart = new Date(currentDate)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)
      
      const daySubmissions = submissions?.filter((sub: any) => {
        const subDate = new Date(sub.submitted_at)
        return subDate >= dayStart && subDate <= dayEnd
      })
      
      if (daySubmissions && daySubmissions.length > 0) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        // If checking today and no submission, don't break yet if we are checking *current* streak which might include today OR yesterday?
        // Standard streak logic: if I submitted today, streak includes today. If I didn't submit today but did yesterday, streak is still active?
        // Usually streak is "consecutive days ending today or yesterday".
        // The current loop checks strictly backwards from today. 
        // If I haven't submitted TODAY, streak is 0? That seems harsh.
        // Let's verify existing logic from the route.
        // Existing logic: starts currentDate = today. If no submission today, breaks. Streak = 0.
        // We will keep existing logic for consistency, or improve it?
        // Let's improve it: Check yesterday if today is empty?
        // But for now, faithfully copy the logic to ensure no regression.
        break
      }
    }

    // Update user stats
    const { error: updateError } = await supabase
      .from('users')
      .update({
        points: totalScore,
        streak: streak,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user stats in DB:', updateError)
      throw new Error(`Failed to update user stats: ${updateError.message}`)
    }

    return {
      userId,
      stats,
      totalScore,
      streak,
      problemsSolved: uniqueProblems.size
    }

  } catch (error) {
    console.error('updateUserStats service failed:', error)
    throw error
  }
}
