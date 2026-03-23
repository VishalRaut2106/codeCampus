import { NextRequest } from 'next/server'
import { createServerClientSafe } from '@/lib/supabase/server-safe'
import { withRetryAndTimeout } from '@/lib/database/connection-pool'
import { createSuccessResponse, createErrorResponse, handleDatabaseError, handleValidationError } from '@/lib/error-handling/production-errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    // Validation: Empty or whitespace-only query
    if (!query || query.trim() === '') {
      return createSuccessResponse([], 'Empty query')
    }

    // Validation: Query too short
    if (query.trim().length < 2) {
      throw handleValidationError('query', 'Search query must be at least 2 characters')
    }

    // Validation: Query too long (prevent abuse)
    if (query.length > 100) {
      throw handleValidationError('query', 'Search query is too long')
    }

    const supabase = createServerClientSafe()
    const searchTerm = query.trim()
    const searchLower = searchTerm.toLowerCase()
    
    console.log('🔍 [SEARCH] Query:', searchTerm)

    // Check if searching by role (exact match or close enough)
    const isRoleSearch = searchLower === 'admin' || searchLower === 'student' || searchLower === 'super_admin' || searchLower === 'super admin'
    
    // Execute search with retry and timeout
    const { data: users, error: searchError } = await withRetryAndTimeout(
      async () => {
        let queryBuilder = supabase
          .from('users')
          .select('id, name, username, role, approval_status, created_at, streak, points, badges, department, prn') // Removed email
        
        if (isRoleSearch) {
          console.log('🎯 [SEARCH] Role search:', searchLower)
          if (searchLower === 'admin') {
             // Searching for 'admin' also returns 'super_admin'
             queryBuilder = queryBuilder.in('role', ['admin', 'super_admin'])
          } else if (searchLower === 'super_admin' || searchLower === 'super admin') {
             queryBuilder = queryBuilder.eq('role', 'super_admin')
          } else {
             queryBuilder = queryBuilder.eq('role', searchLower)
          }
        } else {
          console.log('📝 [SEARCH] Text search:', searchTerm)
          // Removed email from search condition
          queryBuilder = queryBuilder.or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
        }
        
        return queryBuilder
          .order('name', { ascending: true })
          .limit(20)
      },
      { maxRetries: 3, retryDelay: 500, timeout: 5000 }
    )

    if (searchError) {
      console.error('❌ [SEARCH] Error:', searchError)
      throw handleDatabaseError(searchError)
    }

    console.log('✅ [SEARCH] Found:', users?.length || 0, 'users')

    // No results
    if (!users || users.length === 0) {
      return createSuccessResponse([], 'No users found')
    }

    // Filter out invalid users
    const validUsers = users.filter(user => 
      user && 
      user.id && 
      user.name && 
      user.username && 
      user.username.trim() !== ''
    )

    return createSuccessResponse(validUsers, `Found ${validUsers.length} users`)

  } catch (error) {
    console.error('💥 [SEARCH] Fatal error:', error)
    return createErrorResponse(error as Error)
  }
}
