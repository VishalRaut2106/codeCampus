import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { updateUserStats } from '@/lib/services/user-stats'

export async function POST(request: Request) {
  try {
    // --- SECURITY CHECK START ---
    const headersList = await headers()
    const internalKey = headersList.get('x-internal-key')
    const validKey = process.env.INTERNAL_API_KEY || 'default-secret'

    if (internalKey !== validKey) {
       return NextResponse.json({
        success: false,
        error: 'Unauthorized: Invalid internal key'
      }, { status: 401 })
    }
    // --- SECURITY CHECK END ---

    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const result = await updateUserStats(userId)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Update user stats failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}
