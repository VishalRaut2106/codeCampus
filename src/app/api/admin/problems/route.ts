import { createServerClientSafe, createServiceRoleClient } from '@/lib/supabase/server-safe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper to authenticate and verify admin role
async function getAuthenticatedAdmin() {
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

  const { data: { user }, error } = await supabaseAuth.auth.getUser()
  if (error || !user) return null

  // Check admin role using Service Role (reliably bypasses RLS for this check)
  const supabaseAdmin = createServiceRoleClient()
  const { data: profile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return null
  }

  return { user, supabaseAdmin }
}

export async function GET() {
  const auth = await getAuthenticatedAdmin()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { supabaseAdmin } = auth

  try {
    const { data: problems, error } = await supabaseAdmin
      .from('problems')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ problems })
  } catch (error) {
    console.error('Error fetching problems:', error)
    return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedAdmin()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { user, supabaseAdmin } = auth

  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      difficulty, 
      points, 
      time_limit, 
      memory_limit, 
      test_cases 
    } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const { data: problem, error } = await supabaseAdmin
      .from('problems')
      .insert({
        title,
        description,
        difficulty: difficulty || 'easy',
        points: points || 100,
        time_limit: time_limit || 2,
        memory_limit: memory_limit || 128,
        test_cases: test_cases || [],
        created_by: user.id // Best practice to track creator if schema supports it, otherwise ignored
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ problem })
  } catch (error) {
    console.error('Error creating problem:', error)
    return NextResponse.json({ error: 'Failed to create problem' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await getAuthenticatedAdmin()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { supabaseAdmin } = auth

  try {
    const body = await request.json()
    const { 
      id,
      title, 
      description, 
      difficulty, 
      points, 
      time_limit, 
      memory_limit, 
      test_cases 
    } = body

    if (!id) return NextResponse.json({ error: 'Problem ID required' }, { status: 400 })

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title) updateData.title = title
    if (description) updateData.description = description
    if (difficulty) updateData.difficulty = difficulty
    if (points !== undefined) updateData.points = points
    if (time_limit !== undefined) updateData.time_limit = time_limit
    if (memory_limit !== undefined) updateData.memory_limit = memory_limit
    if (test_cases) updateData.test_cases = test_cases

    const { data: problem, error } = await supabaseAdmin
      .from('problems')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ problem })
  } catch (error) {
    console.error('Error updating problem:', error)
    return NextResponse.json({ error: 'Failed to update problem' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuthenticatedAdmin()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { supabaseAdmin } = auth

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Problem ID required' }, { status: 400 })

    // First delete from contest_problems (foreign key constraint usually handles this if set to CASCADE, 
    // but explicit deletion is safer if not)
    await supabaseAdmin
      .from('contest_problems')
      .delete()
      .eq('problem_id', id)

    const { error } = await supabaseAdmin
      .from('problems')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting problem:', error)
    return NextResponse.json({ error: 'Failed to delete problem' }, { status: 500 })
  }
}
