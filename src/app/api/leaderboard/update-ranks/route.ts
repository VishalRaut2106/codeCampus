import { createServerClientSafe } from '@/lib/supabase/server-safe'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST() {
  try {
    // --- SECURITY CHECK START ---
    const headersList = await headers()
    const internalKey = headersList.get('x-internal-key')
    const validKey = process.env.INTERNAL_API_KEY || 'default-secret'

    if (internalKey !== validKey) {
       return NextResponse.json({
        success: false,
        error: 'Unauthorized: Invalid internal key'
      }, { status: 401 })
    }
    // --- SECURITY CHECK END ---

    const supabase = createServerClientSafe()
    
    // Get all approved students ordered by points
    const { data: users, error } = await supabase
      .from('users')
      .select('id, points')
      .eq('role', 'student')
      .eq('approval_status', 'approved')
      .order('points', { ascending: false })

    if (error) {
      console.error('Error fetching users for rank update:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch users: ${error.message}`
      }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users to rank',
        updatedCount: 0
      })
    }

    // Update ranks in batches to avoid overwhelming the database
    const batchSize = 50
    let updatedCount = 0

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      const updates = batch.map((user, index) => ({
        id: user.id,
        rank: i + index + 1
      }))

      // Update ranks for this batch
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ rank: update.rank })
          .eq('id', update.id)

        if (updateError) {
          console.error(`Error updating rank for user ${update.id}:`, updateError)
        } else {
          updatedCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ranks for ${updatedCount} users`,
      updatedCount,
      totalUsers: users.length
    })

  } catch (error) {
    console.error('Rank update failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
