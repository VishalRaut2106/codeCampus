import { NextRequest, NextResponse } from 'next/server'
import { createServerClientSafe, createServiceRoleClient } from '@/lib/supabase/server-safe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Admin endpoint to clean HTML from existing problem descriptions
 * This will update all problems in the database to remove HTML tags
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const supabaseAdmin = createServiceRoleClient()

    // Check admin role
    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', user.id).single()
    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    // Fetch problems that might have HTML
    const { data: problems, error: fetchError } = await supabaseAdmin
      .from('problems')
      .select('id, description')

    if (fetchError) throw fetchError

    const { cleanHtml } = await import('@/lib/utils/html-cleaner')
    let updated = 0
    const errors: string[] = []

    for (const problem of problems || []) {
      if (problem.description && /<[^>]+>/.test(problem.description)) {
        const cleaned = cleanHtml(problem.description)
        const { error: updErr } = await supabaseAdmin
          .from('problems')
          .update({ description: cleaned })
          .eq('id', problem.id)

        if (updErr) errors.push(`ID ${problem.id}: ${updErr.message}`)
        else updated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned ${updated} descriptions`,
      updated,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Clean API Error:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
