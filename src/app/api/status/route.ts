import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Test database connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.code === '42P17') {
        return NextResponse.json({
          status: 'needs_fix',
          issue: 'RLS Policy Infinite Recursion',
          message: 'Your database has RLS policies causing infinite recursion',
          fix: {
            steps: [
              '1. Go to your Supabase Dashboard',
              '2. Navigate to SQL Editor',
              '3. Copy and paste the fix script from QUICK_FIX_INSTRUCTIONS.md',
              '4. Run the script and wait for success message'
            ],
            script: 'Run the RLS policy fix script in Supabase SQL Editor'
          },
          error: {
            code: error.code,
            message: error.message
          }
        })
      }
      
      return NextResponse.json({
        status: 'error',
        issue: 'Database Connection Failed',
        message: 'Unable to connect to database',
        error: {
          code: error.code,
          message: error.message
        }
      })
    }
    
    return NextResponse.json({
      status: 'healthy',
      message: 'All systems working correctly',
      database: 'Connected',
      rls: 'Working properly'
    })
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      issue: 'System Error',
      message: 'An unexpected error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
