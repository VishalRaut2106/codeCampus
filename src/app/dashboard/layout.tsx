'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
      }
    }

    checkAuth()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </div>
  )
}
