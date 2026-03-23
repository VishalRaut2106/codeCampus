import { createServerClientSafe, createServiceRoleClient } from '@/lib/supabase/server-safe'
import { logAdminAction } from '@/lib/audit-logger'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { action, userId, reason, adminId } = await request.json()

    if (!action || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Action and userId are required'
      }, { status: 400 })
    }

    // --- SECURITY CHECK START ---
    
    // 1. Get the authenticated user
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

    // 2. Verify Admin Role using Service Role (to read role reliably)
    const supabaseAdmin = createServiceRoleClient()
    
    const { data: userRoleData, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (roleError || !userRoleData || !['admin', 'super_admin'].includes(userRoleData.role)) {
      console.warn(`Unauthorized access attempt by user ${authUser.id} (Role: ${userRoleData?.role})`)
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, { status: 403 })
    }
    
    // Check if the provided adminId matches the authenticated user (optional but good sanity check)
    // If adminId is provided, we use the authenticated user's ID as the source of truth anyway.
    const currentAdminId = authUser.id

    // --- SECURITY CHECK END ---

    console.log(`Admin ${currentAdminId} performing action '${action}' on user ${userId}`)

    if (action === 'approve') {
      // Fetch user name for logging
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', userId)
        .single()

      const { error } = await supabaseAdmin
        .from('users')
        .update({
          approval_status: 'approved',
          approved_by: currentAdminId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // toggle-log
      await logAdminAction(
        supabaseAdmin,
        currentAdminId,
        'approve',
        userId,
        userData?.name || 'Unknown Student',
        'user',
        { reason }
      )

      return NextResponse.json({ success: true, message: 'Student approved successfully' })
    }

    if (action === 'reject') {
      // Fetch user name for logging
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('name')
        .eq('id', userId)
        .single()

      const { error } = await supabaseAdmin
        .from('users')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason || 'Rejected by admin',
          approved_by: currentAdminId, // Track who rejected
          approved_at: new Date().toISOString(), // Use same field for timestamp
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // toggle-log
      await logAdminAction(
        supabaseAdmin,
        currentAdminId,
        'reject',
        userId,
        userData?.name || 'Unknown Student',
        'user',
        { reason: reason || 'Rejected by admin' }
      )

      return NextResponse.json({ success: true, message: 'Student rejected successfully' })
    }

    if (action === 'restrict') {
      // Fetch user email for notification BEFORE update
      const { data: userToRestrict } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single()

      const { error } = await supabaseAdmin
        .from('users')
        .update({
          approval_status: 'restricted',
          is_restricted: true,
          ban_reason: reason || 'Restricted by admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Send email (fire and forget)
      if (userToRestrict?.email) {
        import('@/lib/email/service').then(({ emailService }) => {
          emailService.sendRestrictionEmail(userToRestrict.email, userToRestrict.name, reason).catch(console.error)
        })
      }

      return NextResponse.json({ success: true, message: 'Student restricted successfully' })
    }

    if (action === 'revoke') {
      const { data: userToRevoke } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single()

      const { error } = await supabaseAdmin
        .from('users')
        .update({
          approval_status: 'approved',
          is_restricted: false,
          ban_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      // Send email (fire and forget)
      if (userToRevoke?.email) {
        import('@/lib/email/service').then(({ emailService }) => {
          emailService.sendRevocationEmail(userToRevoke.email, userToRevoke.name).catch(console.error)
        })
      }

      return NextResponse.json({ success: true, message: 'Restriction revoked successfully' })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('Admin approval API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
