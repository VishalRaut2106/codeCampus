import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { errorId, message, stack, severity, context } = body

    // Get authenticated user if available
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Log error to console for server-side tracking
    console.error('[Error Log]', {
      errorId,
      message,
      severity,
      userId: user?.id || context?.userId,
      endpoint: context?.endpoint,
      component: context?.component,
      timestamp: context?.timestamp
    })

    // Store error in database (optional - can be added later)
    // This would require creating an errors table in Supabase
    /*
    await supabase.from('error_logs').insert({
      error_id: errorId,
      message,
      stack,
      severity,
      user_id: user?.id || context?.userId,
      endpoint: context?.endpoint,
      component: context?.component,
      metadata: context?.metadata,
      timestamp: context?.timestamp
    })
    */

    return NextResponse.json({ 
      success: true, 
      errorId 
    })
  } catch (error) {
    // Don't let error logging fail the request
    console.error('Failed to log error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to log error' 
    }, { status: 500 })
  }
}
