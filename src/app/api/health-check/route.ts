import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ErrorHandler } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Health Check API ===')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Missing environment variables',
        details: {
          urlSet: !!supabaseUrl,
          keySet: !!supabaseKey
        }
      }, { status: 500 })
    }
    
    // Test Supabase connection
    const supabase = await createClient()
    
    // Test 1: Basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      const errorInfo = ErrorHandler.logError(connectionError, 'healthCheck')
      return NextResponse.json({
        status: 'unhealthy',
        error: 'Database connection failed',
        details: {
          code: connectionError.code,
          message: connectionError.message,
          hint: connectionError.hint,
          suggestion: getSuggestion(connectionError.code)
        }
      }, { status: 500 })
    }
    
    // Test 2: RLS policies
    const { data: rlsTest, error: rlsError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (rlsError) {
      const errorInfo = ErrorHandler.logError(rlsError, 'healthCheck')
      return NextResponse.json({
        status: 'unhealthy',
        error: 'RLS policy error',
        details: {
          code: rlsError.code,
          message: rlsError.message,
          hint: rlsError.hint,
          suggestion: getSuggestion(rlsError.code)
        }
      }, { status: 500 })
    }
    
    // Test 3: Authentication
    const { data: { user } } = await supabase.auth.getUser()
    
    return NextResponse.json({
      status: 'healthy',
      message: 'All systems operational',
      details: {
        connection: 'OK',
        rls: 'OK',
        auth: user ? 'Authenticated' : 'Not authenticated',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    const errorInfo = ErrorHandler.logError(error, 'healthCheck')
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      details: errorInfo
    }, { status: 500 })
  }
}

function getSuggestion(errorCode: string): string {
  switch (errorCode) {
    case '42P17':
      return 'Run the RLS policy fix script in Supabase SQL Editor'
    case 'PGRST116':
      return 'Create the users table using the database setup script'
    case '42501':
      return 'Check your RLS policies and permissions'
    case '42P01':
      return 'The users table does not exist. Run the database migration'
    default:
      return 'Check your Supabase configuration and database setup'
  }
}
