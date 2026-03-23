import { createServiceRoleClient } from '@/lib/supabase/server-safe'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServiceRoleClient()

    console.log('=== FETCHING STUDENTS DATA ===')
    console.log('Environment check:', {
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    })

    // Try using the working admin database function first
    try {
      const { data: studentsData, error: functionError } = await supabase
        .rpc('get_all_students_admin')

      if (functionError) {
        console.log('Working admin database function failed:', functionError.message)
        throw functionError
      }

      if (studentsData) {
        console.log('✅ Students fetched via admin function:', studentsData.length)
        return NextResponse.json({
          success: true,
          data: studentsData,
          method: 'working_admin_function',
          count: studentsData.length
        }, {
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'CDN-Cache-Control': 'no-store',
            'Vercel-CDN-Cache-Control': 'no-store'
          }
        })
      }
    } catch (funcError) {
      console.log('Working admin database function not available, trying direct query...')
    }

    // Fallback to direct query
    const { data: students, error: directError } = await supabase
      .from('users')
      .select(`
        id, name, email, username, prn, department, role,
        streak, points, badges, approval_status, profile_visible,
        approved_by, approved_at, rejection_reason,
        ban_reason, is_restricted,
        created_at, updated_at
      `)
      .eq('role', 'student')
      .order('created_at', { ascending: false })

    if (directError) {
      console.error('Direct query failed:', directError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch students: ${directError.message}`,
        details: directError
      }, { status: 500 })
    }

    console.log('Students fetched via direct query:', students?.length || 0)
    return NextResponse.json({
      success: true,
      data: students || [],
      method: 'direct_query',
      count: students?.length || 0
    })

  } catch (error) {
    console.error('Students API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action, userId, ...updateData } = await request.json()

    if (!action || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Action and userId are required'
      }, { status: 400 })
    }

    // Use cookie-aware client for authentication
    let currentUser = null
    try {
      const { createServerClient } = await import('@supabase/ssr')
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll() { }
          }
        }
      )

      const { data: { user } } = await supabase.auth.getUser()
      currentUser = user
    } catch (authError) {
      console.error('Authentication error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Authentication failed'
      }, { status: 401 })
    }

    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Use service client for database operations
    const supabase = createServiceRoleClient()

    // --- SECURITY CHECK (Added) ---
    // Verify user is actually an admin
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (roleError || !userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      console.warn(`Unauthorized student access attempt by ${currentUser.id}`)
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, { status: 403 })
    }
    // --- END SECURITY CHECK ---

    // Log environment check
    console.log('Environment check:', {
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV
    })

    if (action === 'approve') {

      console.log('Approving student:', userId, 'by admin:', currentUser.id)

      // Try using the admin approval function first (bypasses RLS)
      try {
        const { data: result, error: rpcError } = await supabase
          .rpc('approve_student_admin', {
            target_user_id: userId,
            admin_user_id: currentUser.id
          })

        if (rpcError) {
          console.log('RPC function failed, trying direct update:', rpcError.message)
          throw rpcError
        }

        if (result) {
          console.log('Student approved successfully via RPC function')
          return NextResponse.json({
            success: true,
            message: 'Student approved successfully',
            method: 'rpc_function'
          })
        }
      } catch (rpcError) {
        console.log('RPC function not available, trying direct update...')
      }

      // Fallback to direct update
      const { error } = await supabase
        .from('users')
        .update({
          approval_status: 'approved',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Approval error:', error)
        return NextResponse.json({
          success: false,
          error: `Failed to approve student: ${error.message}`
        }, { status: 500 })
      }

      console.log('Student approved successfully via direct update')
      return NextResponse.json({
        success: true,
        message: 'Student approved successfully',
        method: 'direct_update'
      })
    }

    if (action === 'reject') {
      console.log('Rejecting student:', userId, 'by admin:', currentUser.id, 'reason:', updateData.reason)

      // Try using the admin rejection function first (bypasses RLS)
      try {
        const { data: result, error: rpcError } = await supabase
          .rpc('reject_student_admin', {
            target_user_id: userId,
            admin_user_id: currentUser.id,
            rejection_reason: updateData.reason || 'Rejected by admin'
          })

        if (rpcError) {
          console.log('RPC function failed, trying direct update:', rpcError.message)
          throw rpcError
        }

        if (result) {
          console.log('Student rejected successfully via RPC function')
          return NextResponse.json({
            success: true,
            message: 'Student rejected successfully',
            method: 'rpc_function'
          })
        }
      } catch (rpcError) {
        console.log('RPC function not available, trying direct update...')
      }

      // Fallback to direct update
      const { error } = await supabase
        .from('users')
        .update({
          approval_status: 'rejected',
          approved_by: currentUser.id,
          approved_at: new Date().toISOString(),
          rejection_reason: updateData.reason || 'Rejected by admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Rejection error:', error)
        return NextResponse.json({
          success: false,
          error: `Failed to reject student: ${error.message}`
        }, { status: 500 })
      }

      console.log('Student rejected successfully via direct update')
      return NextResponse.json({
        success: true,
        message: 'Student rejected successfully',
        method: 'direct_update'
      })
    }

    if (action === 'update') {
      const { error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        return NextResponse.json({
          success: false,
          error: `Failed to update student: ${error.message}`
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Student updated successfully'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('Students POST API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
