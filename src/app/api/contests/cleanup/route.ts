import { createServerClientSafe } from '@/lib/supabase/server-safe'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createServerClientSafe()
    
    // Get contests that ended more than 1 day ago
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    const { data: endedContests, error: fetchError } = await supabase
      .from('contests')
      .select('id, name, end_time')
      .lt('end_time', oneDayAgo.toISOString())

    if (fetchError) {
      console.error('Error fetching ended contests:', fetchError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch ended contests: ${fetchError.message}`
      }, { status: 500 })
    }

    if (!endedContests || endedContests.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No contests to cleanup',
        deletedCount: 0
      })
    }

    // Delete ended contests
    const contestIds = endedContests.map(c => c.id)
    const { error: deleteError } = await supabase
      .from('contests')
      .delete()
      .in('id', contestIds)

    if (deleteError) {
      console.error('Error deleting ended contests:', deleteError)
      return NextResponse.json({
        success: false,
        error: `Failed to delete ended contests: ${deleteError.message}`
      }, { status: 500 })
    }

    console.log(`Cleaned up ${endedContests.length} ended contests`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${endedContests.length} ended contests`,
      deletedCount: endedContests.length,
      deletedContests: endedContests.map(c => ({ id: c.id, name: c.name }))
    })

  } catch (error) {
    console.error('Contest cleanup failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}