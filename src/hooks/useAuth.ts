'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'student' | 'admin' | 'super_admin'
  streak: number
  points: number
  approval_status?: 'pending' | 'approved' | 'rejected' | 'restricted'
  prn?: string
  department?: string
  username?: string
  badges?: string[]
  mobile_number?: string
  github_url?: string
  linkedin_url?: string
  instagram_url?: string
  portfolio_url?: string
  bio?: string
  profile_visible?: boolean
  created_at?: string
  is_restricted?: boolean
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser && mounted) {
          // Directly query user profile without going through userProfileService
          const { data: profile, error } = await supabase
            .from('users')
            .select('*') // Fetch full profile to avoid double-fetching in useUserProfile
            .eq('id', authUser.id)
            .single()
          
          if (profile && mounted) {
            setUser(profile as UserProfile)
          } else if (error && mounted) {
            console.log('Profile not found for user:', authUser.id)
            
            // Check for specific error codes
            if (error.code === 'PGRST116') {
              console.error('No rows returned - profile does not exist')
              setUser(null)
              return
            }
            
            // For any other error, just set user to null
            console.error('Error fetching profile:', error.message)
            setUser(null)
          }
        } else if (mounted) {
          setUser(null)
        }
      } catch (error) {
        console.error('Error in getUser:', error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getUser()

    // Set up auth state change listener with proper cleanup
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && (event === 'SIGNED_IN' || event === 'SIGNED_OUT')) {
        getUser()
      }
    })

    return () => {
      mounted = false
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [supabase])

  return { user, loading }
}
