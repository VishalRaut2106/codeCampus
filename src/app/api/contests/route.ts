import { createServerClientSafe } from '@/lib/supabase/server-safe'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createServerClientSafe()
    
    const { data: contests, error } = await supabase
      .from('contests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Contests fetch error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        data: []
      })
    }

    return NextResponse.json({
      success: true,
      data: contests || [],
      count: contests?.length || 0
    })

  } catch (error) {
    console.error('Contests API failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    })
  }
}
