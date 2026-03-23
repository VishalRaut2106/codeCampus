'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user && user.username) {
        router.replace(`/profile/${user.username}`)
      } else if (!user) {
        router.push('/auth/login')
      } else {
        // Fallback if username is missing but user is logged in (shouldn't happen often)
        router.push('/')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}