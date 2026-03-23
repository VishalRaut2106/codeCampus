import { NextRequest, NextResponse } from 'next/server'
import cacheManager from '@/lib/cache/cache-manager'
import { createServerClientSafe } from '@/lib/supabase/server-safe'

/**
 * Invalidate problem cache
 * Called when a problem is updated to ensure fresh data
 * 
 * Requirements: 9.7
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { problemId } = body

    if (!problemId) {
      return NextResponse.json(
        { success: false, error: 'Problem ID is required' },
        { status: 400 }
      )
    }

    // Verify user is admin
    const supabase = createServerClientSafe()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Invalidate the problem cache
    const cacheKey = `problem:${problemId}:test_cases`
    await cacheManager.invalidate(cacheKey)

    return NextResponse.json({
      success: true,
      message: 'Problem cache invalidated successfully'
    })
  } catch (error) {
    console.error('Error invalidating problem cache:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to invalidate cache' },
      { status: 500 }
    )
  }
}

/**
 * Invalidate all problem caches
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify user is admin
    const supabase = createServerClientSafe()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Invalidate all problem caches
    const count = await cacheManager.invalidatePattern('problem:*:test_cases')

    return NextResponse.json({
      success: true,
      message: `Invalidated ${count} problem caches`
    })
  } catch (error) {
    console.error('Error invalidating problem caches:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to invalidate caches' },
      { status: 500 }
    )
  }
}
