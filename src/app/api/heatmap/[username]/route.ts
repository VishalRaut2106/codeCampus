import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server-safe'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = await params
    const supabaseAdmin = createServiceRoleClient()

    // 1. Get user ID from username
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // 2. Fetch submission counts grouped by date
    // Use submitted_at which we confirmed exists
    const { data, error } = await supabaseAdmin
      .from('submissions')
      .select('submitted_at')
      .eq('user_id', userData.id)
      .order('submitted_at', { ascending: true })

    if (error) throw error

    // Group by date
    const dateMap = new Map<string, number>()
    data.forEach((s: any) => {
      const dateStr = new Date(s.submitted_at).toISOString().split('T')[0]
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1)
    })

    const heatmapData = Array.from(dateMap, ([date, count]) => ({ date, count }))

    return NextResponse.json({
      success: true,
      data: heatmapData
    })

  } catch (error) {
    console.error('Heatmap API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
