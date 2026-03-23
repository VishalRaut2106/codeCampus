import { createServerClientSafe, createServiceRoleClient } from '@/lib/supabase/server-safe'
import { logAdminAction } from '@/lib/audit-logger'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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

  // Check admin role
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
    const { data: contestsData, error } = await supabaseAdmin
      .from('contests')
      .select('*, participants:contest_registrations(count), problem_count:contest_problems(count)')
      .order('start_time', { ascending: false })

    if (error) throw error

    // Transform counts
    const contests = (contestsData || []).map((c: any) => {
      const getCount = (field: any) => {
        if (Array.isArray(field)) {
          if (field.length > 0 && typeof field[0] === 'object' && 'count' in field[0]) {
            return field[0].count || 0
          }
          return field.length
        }
        if (typeof field === 'object' && field !== null && 'count' in field) {
          return field.count || 0
        }
        if (typeof field === 'number') {
          return field
        }
        return 0
      }
      
      const participantCount = getCount(c.participants)
      const problemCount = getCount(c.problem_count)
      
      return {
        ...c,
        participants: participantCount,
        problems_count: problemCount
      }
    })

    return NextResponse.json({ contests })
  } catch (error) {
    console.error('Error fetching contests:', error)
    return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 })
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
    const { name, description, start_time, end_time } = body

    if (!name || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: contest, error } = await supabaseAdmin
      .from('contests')
      .insert({
        name,
        description,
        start_time,
        end_time,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    
    // toggle-log
    await logAdminAction(
      supabaseAdmin,
      user.id,
      'create',
      contest.id,
      contest.name,
      'contest'
    )

    return NextResponse.json({ contest })
  } catch (error) {
    console.error('Error creating contest:', error)
    return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await getAuthenticatedAdmin()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { user, supabaseAdmin } = auth

  try {
    const body = await request.json()
    const { id, name, description, start_time, end_time } = body

    if (!id) return NextResponse.json({ error: 'Contest ID required' }, { status: 400 })

    const { data: contest, error } = await supabaseAdmin
      .from('contests')
      .update({
        name,
        description,
        start_time,
        end_time,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // toggle-log
    await logAdminAction(
      supabaseAdmin,
      user.id,
      'update',
      contest.id,
      contest.name,
      'contest'
    )

    return NextResponse.json({ contest })
  } catch (error) {
    console.error('Error updating contest:', error)
    return NextResponse.json({ error: 'Failed to update contest' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuthenticatedAdmin()
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { user, supabaseAdmin } = auth

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Contest ID required' }, { status: 400 })

    // Fetch details for logging
    const { data: contestData } = await supabaseAdmin
      .from('contests')
      .select('name')
      .eq('id', id)
      .single()

    const { error } = await supabaseAdmin
      .from('contests')
      .delete()
      .eq('id', id)

    if (error) throw error

    // toggle-log
    await logAdminAction(
      supabaseAdmin,
      user.id,
      'delete',
      id,
      contestData?.name || 'Unknown Contest',
      'contest'
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contest:', error)
    return NextResponse.json({ error: 'Failed to delete contest' }, { status: 500 })
  }
}
