import { createClient } from '@/lib/supabase/server'
import { createServerClientSafe } from '@/lib/supabase/server-safe'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, newRole } = await request.json()

    if (!userId || !newRole) {
      return NextResponse.json({
        success: false,
        error: 'userId and newRole are required'
      }, { status: 400 })
    }

    if (!['student', 'admin'].includes(newRole)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid role. Must be "student" or "admin"'
      }, { status: 400 })
    }

    // 1. Use Cookie-based client for Authentication (Safe, identifies the caller)
    const userSupabase = await createClient()
    const { data: { user: currentUser }, error: authError } = await userSupabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication failed. Please log in again.'
      }, { status: 401 })
    }

    // 2. Use Service Role client for Database Operations (Bypasses RLS for admin actions)
    const adminSupabase = createServerClientSafe()

    const { data: currentUserProfile } = await adminSupabase
      .from('users')
      .select('role, approval_status')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserProfile || (currentUserProfile.role !== 'admin' && currentUserProfile.role !== 'super_admin') || currentUserProfile.approval_status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    // Verify Super Admin privileges for admin management
    // 1. If target is being made an admin
    // 2. If target is currently an admin (removing admin)
    
    // We need to fetch the target user's current role to check case #2
    const { data: targetUser } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    const isTargetAdmin = targetUser?.role === 'admin' || targetUser?.role === 'super_admin'
    const isPromotingToAdmin = newRole === 'admin'

    // If implementing super_admin role in DB:
    if (isTargetAdmin || isPromotingToAdmin) {
       // Only super_admin role can add/remove admins
       if (currentUserProfile.role !== 'super_admin') {
         return NextResponse.json({
           success: false,
           error: 'Only Super Admins can promote or demote other Admins.'
         }, { status: 403 })
       }
    }

    // Update user role
    const { error } = await adminSupabase
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
        // If making someone admin, auto-approve them
        ...(newRole === 'admin' ? { 
          approval_status: 'approved',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString()
        } : {})
      })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({
        success: false,
        error: `Failed to change role: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `User role changed to ${newRole} successfully`
    })

  } catch (error) {
    console.error('Change role API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
