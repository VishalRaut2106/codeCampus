import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'student' | 'admin'
  approval_status: 'pending' | 'approved' | 'rejected' | 'restricted'
  streak: number
  points: number
  badges: string[]
  department?: string
  mobile_number?: string
  github_url?: string
  linkedin_url?: string
  instagram_url?: string
  portfolio_url?: string
  username?: string
  prn?: string
  bio?: string
  profile_visible?: boolean
  created_at?: string
  updated_at?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  ban_reason?: string
}

export function useUserProfile() {
  const { user, loading } = useAuth()
  const router = useRouter()
  // No need for separate state if we just return derived data from useAuth
  // But we keep the interface for backward compatibility if other components expect 'userProfile'
  
  const userProfile = user as UserProfile | null

  const refreshProfile = () => {
    // Since useAuth manages the state, we can't easily force a refresh here 
    // without exposing a refresh method from useAuth.
    // For now, we'll rely on useAuth's auto-updates or page reloads.
    // If critical, we can add a refresh method to useAuth context later.
    window.location.reload()
  }

  return {
    userProfile,
    loading,
    error: null, // useAuth handles errors internally or returns null user
    refreshProfile,
    isAuthenticated: !!user,
    isAdmin: userProfile?.role === 'admin' && userProfile?.approval_status === 'approved',
    isApproved: userProfile?.approval_status === 'approved',
    isPending: userProfile?.approval_status === 'pending',
    isRejected: userProfile?.approval_status === 'rejected',
    isRestricted: userProfile?.approval_status === 'restricted'
  }
}


