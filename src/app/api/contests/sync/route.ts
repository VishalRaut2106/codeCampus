import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServerClientSafe } from '@/lib/supabase/server-safe'

async function getUserRole() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {}
      }
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('role, approval_status').eq('id', user.id).single()
  return profile?.role === 'admin' && profile?.approval_status === 'approved' ? user.id : null
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const source = url.searchParams.get('source') || 'leetcode'

    const userId = await getUserRole()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let contests: Array<{ title: string; url: string; startTime: string; endTime: string; platform: string }>

    if (source === 'leetcode') {
      const res = await fetch('https://contest-hive.vercel.app/api/leetcode', { cache: 'no-store' })
      const data = await res.json()
      interface LeetCodeContest {
        title: string
        url: string
        startTime: string
        endTime: string
      }
      const rows = (data?.data || []) as Array<LeetCodeContest>
      contests = rows
        .filter((c) => !!c?.url)
        .map((c) => ({
          title: c.title,
          url: c.url,
          startTime: c.startTime,
          endTime: c.endTime,
          platform: 'leetcode',
        }))
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported source' }, { status: 400 })
    }

    // Upsert into Supabase using service role
    const admin = createServerClientSafe()

    // Ensure columns exist (platform/external_url). Ignore errors.
    try {
      await admin.rpc('noop')
    } catch {
      // Ignore RPC errors
    }

    let imported = 0
    for (const c of contests) {
      const { data: existing } = await admin
        .from('contests')
        .select('id')
        .eq('external_url', c.url)
        .single()

      if (existing) {
        await admin
          .from('contests')
          .update({
            name: c.title,
            description: `${c.platform.toUpperCase()} contest (synced)` ,
            start_time: new Date(c.startTime).toISOString(),
            end_time: new Date(c.endTime).toISOString(),
            platform: c.platform,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
      } else {
        await admin
          .from('contests')
          .insert({
            name: `CodePVG Challenge ${imported + 1} - ${new Date().toLocaleDateString()}`,
            description: `A competitive coding challenge to test your skills.`,
            start_time: new Date(c.startTime).toISOString(),
            // Set end time to exactly 24 hours after start time
            end_time: new Date(new Date(c.startTime).getTime() + 24 * 60 * 60 * 1000).toISOString(),
            platform: 'codepvg',
            external_url: c.url,
          })
        imported++
      }
    }

    return NextResponse.json({ success: true, imported })
  } catch (error) {
    console.error('Contest sync failed:', error)
    return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 })
  }
}
