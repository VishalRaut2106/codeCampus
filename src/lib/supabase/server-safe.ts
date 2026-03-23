import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

/**
 * Safe server client that doesn't use next/headers
 * This can be used in API routes without causing build issues
 */
export function createServerClientSafe() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  // Always prefer service role key for admin operations to bypass RLS
  if (supabaseServiceKey) {
    console.log('Using service role key for database operations (bypasses RLS)')
    return createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    })
  }

  // Fallback to anon key with SSR client (will be subject to RLS)
  if (supabaseAnonKey) {
    console.warn('Using anon key - operations may be blocked by RLS policies')
    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op for server-side operations
          },
        },
      }
    )
  }

  throw new Error('Missing Supabase keys. Please check SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}

/**
 * Create a service role client specifically for admin operations
 * This bypasses RLS and should only be used in secure server contexts
 */
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  }

  console.log('Creating service role client with bypass RLS')
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  })
}
