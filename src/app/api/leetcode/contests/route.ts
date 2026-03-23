import { NextResponse } from 'next/server'

export const revalidate = 300 // Revalidate every 5 minutes on the server

export async function GET() {
  try {
    const res = await fetch('https://contest-hive.vercel.app/api/leetcode', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CodePVG/1.0'
      },
      // Ensure Next can cache this on the server
      next: { revalidate: 300 }
    })

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, data: [], lastUpdated: new Date().toISOString() },
        { status: 200, headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=300' } }
      )
    }

    const data = await res.json()
    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=300' }
    })
  } catch (error) {
    console.error('Failed to proxy LeetCode contests:', error)
    return NextResponse.json(
      { ok: false, data: [], lastUpdated: new Date().toISOString() },
      { status: 200 }
    )
  }
}
