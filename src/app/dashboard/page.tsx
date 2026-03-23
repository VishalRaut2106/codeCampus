'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const redirectUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get user profile to determine role
        const { data: userProfile } = await supabase
          .from('users')
          .select('role, approval_status, username')
          .eq('id', authUser.id)
          .single()

        if (userProfile) {
          // Check approval status first
          if (userProfile.approval_status === 'pending') {
            toast.info('Your account is pending approval. Please wait for admin approval.')
            router.push('/auth/pending-approval')
            return
          } else if (userProfile.approval_status === 'rejected') {
            toast.error('Your account has been rejected. Please contact support.')
            router.push('/auth/pending-approval')
            return
          } else if (userProfile.approval_status === 'approved') {
            // User is approved, redirect based on role
            if (userProfile.role === 'admin') {
              router.push('/dashboard/admin')
            } else {
              router.push(`/profile/${userProfile.username}`)
            }
            return
          }
        } else {
          // No profile found, redirect to pending approval
          toast.info('Your account is being set up. Please wait for admin approval.')
          router.push('/auth/pending-approval')
          return
        }
      } catch (error) {
        console.error('Error redirecting user:', error)
        toast.error('Error determining user role. Please try again.')
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    redirectUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00C896] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Determining your dashboard...</p>
        </div>
      </div>
    )
  }

  return null
}
