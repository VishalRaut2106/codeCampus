import { createServerClientSafe, createServiceRoleClient } from '@/lib/supabase/server-safe'
import { logAdminAction } from '@/lib/audit-logger'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClientSafe()
    const supabaseAdmin = createServiceRoleClient() // Use for reliable logging
    const { id: contestId } = await params

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin' || userProfile.approval_status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Check if contest has participants
    const { count: participantsCount } = await supabase
      .from('contest_participants')
      .select('*', { count: 'exact', head: true })
      .eq('contest_id', contestId)

    if (participantsCount && participantsCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete contest with participants. Please remove participants first.'
      }, { status: 400 })
    }

    // Fetch details for logging
    const { data: contestData } = await supabase
      .from('contests')
      .select('name')
      .eq('id', contestId)
      .single()

    // Delete contest (cascade will handle related records)
    const { error } = await supabase
      .from('contests')
      .delete()
      .eq('id', contestId)

    if (error) {
      console.error('Contest deletion error:', error)
      return NextResponse.json({
        success: false,
        error: `Failed to delete contest: ${error.message}`
      }, { status: 500 })
    }

    // Log the action (fire and forget)
    await logAdminAction(
      supabaseAdmin,
      user.id,
      'delete',
      contestId,
      contestData?.name || 'Unknown Contest',
      'contest'
    )

    return NextResponse.json({
      success: true,
      message: 'Contest deleted successfully'
    })

  } catch (error) {
    console.error('Contest deletion failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClientSafe()
    const { id: contestId } = await params

    const { data: contest, error } = await supabase
      .from('contests')
      .select(`
        *,
        problems:contest_problems(
          order_index,
          problem:problems(*)
        ),
        participants:contest_participants(
          user:users(id, name, username, points)
        )
      `)
      .eq('id', contestId)
      .single()

    if (error || !contest) {
      return NextResponse.json({
        success: false,
        error: 'Contest not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: contest
    })

  } catch (error) {
    console.error('Contest fetch failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}