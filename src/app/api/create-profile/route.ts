import { serverUserCreationService } from '@/lib/user-creation-service'
import { createServerClientSafe } from '@/lib/supabase/server-safe'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, name, email, prn, department } = body
    
    // --- SECURITY CHECK START ---
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

    const { data: { user } } = await supabaseAuth.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    if (user.id !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: You can only create a profile for yourself'
      }, { status: 403 })
    }
    // --- SECURITY CHECK END ---

    if (!userId || !name || !email) {
      return NextResponse.json({
        success: false,
        error: 'User ID, name, and email are required'
      }, { status: 400 })
    }

    console.log('=== CREATE PROFILE API ===')
    console.log('Request data:', { userId, name, email, prn, department })

    // Force role to 'student' for security
    const forcedRole = 'student'

    const result = await serverUserCreationService.createUserProfile({
      id: userId,
      name,
      email,
      prn,
      department,
      role: forcedRole
    })

    if (result.success) {
      console.log(`✅ Profile created successfully via ${result.method}`)
      return NextResponse.json({
        success: true,
        message: `Profile created successfully via ${result.method}`,
        data: result.data,
        method: result.method
      })
    } else {
      console.error(`❌ Profile creation failed:`, result.error)
      return NextResponse.json({
        success: false,
        error: result.error,
        method: result.method
      }, { status: 500 })
    }

  } catch (error) {
    console.error('API profile creation exception:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// GET endpoint to check profile status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const supabase = createServerClientSafe()

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, name, email, prn, department, role, approval_status, created_at')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch profile: ${error.message}`,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: profile
    })

  } catch (error) {
    console.error('API profile fetch failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
