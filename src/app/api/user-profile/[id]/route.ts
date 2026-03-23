import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user to check if they're an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    // Check if current user is admin
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser || currentUser.role !== 'admin' || currentUser.approval_status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin access required' 
      }, { status: 403 })
    }

    // Fetch the requested user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        username,
        prn,
        role,
        approval_status,
        created_at,
        updated_at,
        department,
        mobile_number,
        bio,
        profile_visible,
        approved_by,
        approved_at,
        rejection_reason,
        github_url,
        linkedin_url,
        instagram_url,
        streak,
        points,
        badges
      `)
      .eq('id', (await params).id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch user profile' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile 
    })
    
  } catch (error) {
    console.error('User profile API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
