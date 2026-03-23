import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: contestId } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (!contestId) {
      return NextResponse.json({ success: false, error: 'Contest ID required' }, { status: 400 })
    }

    // Check if contest exists and is open for registration
    // (For now, we allow registration even if started, just like LeetCode virtual or late entry)
    const { data: contest, error: contestError } = await supabase
      .from('contests')
      .select('id, start_time')
      .eq('id', contestId)
      .single()

    if (contestError || !contest) {
      return NextResponse.json({ success: false, error: 'Contest not found' }, { status: 404 })
    }

    // Register user
    const { error: insertError } = await supabase
      .from('contest_registrations')
      .insert({
        contest_id: contestId,
        user_id: user.id
      })

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation
        return NextResponse.json({ success: true, message: 'Already registered' })
      }
      throw insertError
    }

    return NextResponse.json({ success: true, message: 'Successfully registered for contest' })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to register' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: contestId } = await params
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('contest_registrations')
      .delete()
      .eq('contest_id', contestId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Successfully unregistered' })
  } catch (error) {
    console.error('Unregistration error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unregister' }, 
      { status: 500 }
    )
  }
}