/**
 * Authentication Middleware for codCampus
 * 
 * This middleware provides authentication and authorization checks for API routes.
 * It verifies JWT tokens, checks user roles, and ensures proper access control.
 * 
 * Features:
 * - JWT token verification
 * - Role-based access control (RBAC)
 * - Approval status checking
 * - Clear error messages
 * - Easy-to-use wrapper functions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

/**
 * User role type
 */
export type UserRole = 'student' | 'admin'

/**
 * Approval status type
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

/**
 * Authenticated user context
 */
export interface AuthContext {
  user: {
    id: string
    email: string
    role: UserRole
    approvalStatus: ApprovalStatus
  }
}

/**
 * Authentication error types
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Get authenticated user from request
 * 
 * @param request - Next.js request object
 * @returns Authenticated user context or null
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthContext | null> {
  try {
    const supabase = createClient()
    
    // Get user from JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    // Get user profile with role and approval status
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, approval_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      user: {
        id: user.id,
        email: user.email || '',
        role: profile.role as UserRole,
        approvalStatus: profile.approval_status as ApprovalStatus
      }
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Require authentication
 * Returns 401 if user is not authenticated
 * 
 * @param request - Next.js request object
 * @returns Auth context or error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ success: true; auth: AuthContext } | { success: false; response: NextResponse }> {
  const auth = await getAuthenticatedUser(request)

  if (!auth) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please log in.'
        },
        { status: 401 }
      )
    }
  }

  return {
    success: true,
    auth
  }
}

/**
 * Require specific role
 * Returns 403 if user doesn't have required role
 * 
 * @param request - Next.js request object
 * @param requiredRole - Required user role
 * @returns Auth context or error response
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: UserRole
): Promise<{ success: true; auth: AuthContext } | { success: false; response: NextResponse }> {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult
  }

  const { auth } = authResult

  if (auth.user.role !== requiredRole) {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Access denied. ${requiredRole} role required.`
        },
        { status: 403 }
      )
    }
  }

  return {
    success: true,
    auth
  }
}

/**
 * Require admin role
 * Returns 403 if user is not an admin
 * 
 * @param request - Next.js request object
 * @returns Auth context or error response
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ success: true; auth: AuthContext } | { success: false; response: NextResponse }> {
  return requireRole(request, 'admin')
}

/**
 * Require approved status
 * Returns 403 if user is not approved
 * 
 * @param request - Next.js request object
 * @returns Auth context or error response
 */
export async function requireApproved(
  request: NextRequest
): Promise<{ success: true; auth: AuthContext } | { success: false; response: NextResponse }> {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult
  }

  const { auth } = authResult

  if (auth.user.approvalStatus !== 'approved') {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Account approval required. Your account is pending approval.',
          approvalStatus: auth.user.approvalStatus
        },
        { status: 403 }
      )
    }
  }

  return {
    success: true,
    auth
  }
}

/**
 * Require admin and approved status
 * Returns 403 if user is not an approved admin
 * 
 * @param request - Next.js request object
 * @returns Auth context or error response
 */
export async function requireApprovedAdmin(
  request: NextRequest
): Promise<{ success: true; auth: AuthContext } | { success: false; response: NextResponse }> {
  const adminResult = await requireAdmin(request)

  if (!adminResult.success) {
    return adminResult
  }

  const { auth } = adminResult

  if (auth.user.approvalStatus !== 'approved') {
    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Admin account approval required.'
        },
        { status: 403 }
      )
    }
  }

  return {
    success: true,
    auth
  }
}

/**
 * Wrapper function for API routes that require authentication
 * 
 * @param handler - API route handler
 * @returns Wrapped handler with authentication
 */
export function withAuth<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: (request: NextRequest, auth: AuthContext, ...args: any[]) => Promise<NextResponse>
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const authResult = await requireAuth(request)

    if (!authResult.success) {
      return authResult.response
    }

    return handler(request, authResult.auth, ...args)
  }) as T
}

/**
 * Wrapper function for API routes that require admin role
 * 
 * @param handler - API route handler
 * @returns Wrapped handler with admin authentication
 */
export function withAdmin<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: (request: NextRequest, auth: AuthContext, ...args: any[]) => Promise<NextResponse>
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const authResult = await requireAdmin(request)

    if (!authResult.success) {
      return authResult.response
    }

    return handler(request, authResult.auth, ...args)
  }) as T
}

/**
 * Wrapper function for API routes that require approved status
 * 
 * @param handler - API route handler
 * @returns Wrapped handler with approval check
 */
export function withApproved<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: (request: NextRequest, auth: AuthContext, ...args: any[]) => Promise<NextResponse>
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const authResult = await requireApproved(request)

    if (!authResult.success) {
      return authResult.response
    }

    return handler(request, authResult.auth, ...args)
  }) as T
}

/**
 * Wrapper function for API routes that require approved admin
 * 
 * @param handler - API route handler
 * @returns Wrapped handler with approved admin check
 */
export function withApprovedAdmin<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: (request: NextRequest, auth: AuthContext, ...args: any[]) => Promise<NextResponse>
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const authResult = await requireApprovedAdmin(request)

    if (!authResult.success) {
      return authResult.response
    }

    return handler(request, authResult.auth, ...args)
  }) as T
}

/**
 * Check if user owns a resource
 * 
 * @param userId - User ID from auth context
 * @param resourceUserId - User ID of resource owner
 * @returns True if user owns resource
 */
export function isResourceOwner(userId: string, resourceUserId: string): boolean {
  return userId === resourceUserId
}

/**
 * Require resource ownership or admin role
 * 
 * @param auth - Auth context
 * @param resourceUserId - User ID of resource owner
 * @returns True if user can access resource
 */
export function canAccessResource(auth: AuthContext, resourceUserId: string): boolean {
  return auth.user.role === 'admin' || isResourceOwner(auth.user.id, resourceUserId)
}

/**
 * Create unauthorized response
 * 
 * @param message - Error message
 * @returns NextResponse with 401 status
 */
export function createUnauthorizedResponse(message?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message || 'Authentication required. Please log in.'
    },
    { status: 401 }
  )
}

/**
 * Create forbidden response
 * 
 * @param message - Error message
 * @returns NextResponse with 403 status
 */
export function createForbiddenResponse(message?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message || 'Access denied. Insufficient permissions.'
    },
    { status: 403 }
  )
}

/**
 * Example usage:
 * 
 * // Simple authentication
 * export const GET = withAuth(async (request, auth) => {
 *   // auth.user is available
 *   return NextResponse.json({ userId: auth.user.id })
 * })
 * 
 * // Admin only
 * export const POST = withAdmin(async (request, auth) => {
 *   // Only admins can access
 *   return NextResponse.json({ success: true })
 * })
 * 
 * // Approved users only
 * export const POST = withApproved(async (request, auth) => {
 *   // Only approved users can access
 *   return NextResponse.json({ success: true })
 * })
 * 
 * // Approved admin only
 * export const POST = withApprovedAdmin(async (request, auth) => {
 *   // Only approved admins can access
 *   return NextResponse.json({ success: true })
 * })
 * 
 * // Manual authentication check
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth(request)
 *   
 *   if (!authResult.success) {
 *     return authResult.response
 *   }
 *   
 *   const { auth } = authResult
 *   // Use auth.user
 *   
 *   return NextResponse.json({ success: true })
 * }
 * 
 * // Resource ownership check
 * export const DELETE = withAuth(async (request, auth, { params }) => {
 *   const { id } = params
 *   
 *   // Get resource
 *   const resource = await getResource(id)
 *   
 *   // Check if user can access
 *   if (!canAccessResource(auth, resource.userId)) {
 *     return createForbiddenResponse('You can only delete your own resources')
 *   }
 *   
 *   // Delete resource
 *   await deleteResource(id)
 *   
 *   return NextResponse.json({ success: true })
 * })
 */
