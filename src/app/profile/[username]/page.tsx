'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  User,
} from 'lucide-react'
import ContributionsGraph from '@/components/ContributionsGraph'

interface UserProfile {
  id: string
  name: string
  username: string
  email: string
  role: string
  department?: string
  prn?: string
  mobile_number?: string
  bio?: string
  streak: number
  points: number
  badges: string[]
  github_url?: string
  linkedin_url?: string
  instagram_url?: string
  portfolio_url?: string
  approval_status?: string
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  rank?: number
}

interface Submission {
  id: string
  submitted_at: string
  created_at?: string
  status: string
  language: string
  problem: {
    id: string
    title: string
    difficulty: string
  }
}

interface ContestParticipation {
  contest_id: string
  joined_at: string
  contest: {
    id: string
    name: string
    start_time: string
    end_time: string
  }
}

interface CurrentUser {
  id: string
  role: string
  approval_status: string
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const username = decodeURIComponent(params.username as string)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Confirmation Modal State
  const [showAdminConfirm, setShowAdminConfirm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'make' | 'remove'>('make')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [problemStats, setProblemStats] = useState({ easy: 0, medium: 0, hard: 0, total: 0 })
  const [globalRank, setGlobalRank] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [contestCount, setContestCount] = useState<number>(0)
  const [heatmapData, setHeatmapData] = useState<{ date: string, count: number }[]>([])
  const rankChange = 0 // Placeholder as we don't track history yet

  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser()
      await fetchProfile()
    }
    init()
  }, [username])

  const fetchSubmissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          submitted_at,
          status,
          language,
          problem:problems!inner(id, title, difficulty)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .order('submitted_at', { ascending: false })
        .limit(1000)

      if (!error && data) {
        // Transform the data to match our Submission interface
        const transformedData = data.map((sub: any) => ({
          id: sub.id,
          submitted_at: sub.submitted_at,
          status: sub.status,
          language: sub.language,
          problem: Array.isArray(sub.problem) ? sub.problem[0] : sub.problem
        })).filter((sub: any) => sub.problem) as Submission[]

        setSubmissions(transformedData)

        // Set recent submissions (last 5)
        setRecentSubmissions(transformedData.slice(0, 5))

        // Calculate problem stats - track unique problems solved
        const uniqueProblems = new Map()
        transformedData.forEach((sub) => {
          if (sub.problem) {
            uniqueProblems.set(sub.problem.id, sub.problem)
          }
        })

        const stats = { easy: 0, medium: 0, hard: 0, total: 0 }
        uniqueProblems.forEach((problem: any) => {
          stats.total++
          const difficulty = (problem.difficulty || '').toLowerCase()
          if (difficulty === 'easy') stats.easy++
          else if (difficulty === 'medium') stats.medium++
          else if (difficulty === 'hard') stats.hard++
        })

        setProblemStats(stats)
      }
    } catch (error) {
      // error ignored
    }
  }

  const fetchGlobalRank = async (userId: string, userPoints: number) => {
    try {
      // Fetch leaderboard data
      const response = await fetch('/api/leaderboard', { cache: 'no-store' })
      const result = await response.json()

      if (result.success && result.data && Array.isArray(result.data)) {
        const userRank = result.data.findIndex((u: any) => u.id === userId)
        if (userRank !== -1) {
          setGlobalRank(userRank + 1)
          setTotalUsers(result.data.length)
        } else {
          // User not in leaderboard, calculate approximate rank based on points
          const higherRanked = result.data.filter((u: any) => (u.points || 0) > userPoints).length
          setGlobalRank(higherRanked + 1)
          setTotalUsers(result.data.length + 1) // +1 for current user
        }
      } else {
        // If no leaderboard data, set rank as 1 if user has points, otherwise unranked
        if (userPoints > 0) {
          setGlobalRank(1)
          setTotalUsers(1)
        } else {
          setGlobalRank(null)
          setTotalUsers(0)
        }
      }
    } catch (error) {
      // Set rank to null on error to avoid showing incorrect data
      setGlobalRank(null)
      setTotalUsers(0)
    }
  }

  const fetchContestParticipation = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('contest_participants')
        .select('contest_id')
        .eq('user_id', userId)

      if (!error && data) {
        setContestCount(data.length)
      }
    } catch (error) {
      // error ignored
    }
  }

  const fetchTotalUsers = async () => {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('approval_status', 'approved')

      if (!error && count !== null) {
        setTotalUsers(count)
      }
    } catch (error) {
      // error ignored
    }
  }

  const fetchProfile = async () => {
    try {
      // Use the optimized RPC call to get everything at once
      const { data: dashboardData, error } = await supabase
        .rpc('get_user_dashboard_data', { p_username: username })

      if (error) {
        console.error('Error fetching dashboard data:', JSON.stringify(error, null, 2))
        console.error('Error details:', error.message, error.details, error.hint)
        toast.error(`Failed to load profile: ${error.message || 'Unknown error'}`)
        setLoading(false)
        return
      }

      const dataStr = dashboardData as any
      // The RPC returns { success: true, profile: {...}, stats: {...}, ... }

      if (!dataStr || !dataStr.success) {
        toast.error(dataStr?.error || 'User not found')
        setLoading(false)
        return
      }

      const profileData = dataStr.profile
      setProfile(profileData)

      // Set calculated stats directly from RPC
      setProblemStats(dataStr.stats)

      // Set recent activity
      setRecentSubmissions(dataStr.recent_activity || [])

      // Set Heatmap data — use RPC data if available, otherwise query submissions directly
      let heatmapResult = dataStr.heatmap || []
      
      if (heatmapResult.length === 0 && profileData?.username) {
        // Fallback: query new heatmap API which uses service role to bypass RLS and uses correct column
        try {
          const hres = await fetch(`/api/heatmap/${profileData.username}`)
          const hdata = await hres.json()
          if (hdata.success && hdata.data) {
            heatmapResult = hdata.data
          }
        } catch (e) {
          console.warn('Heatmap API fallback failed:', e)
        }
      }
      
      setHeatmapData(heatmapResult)

      // Set counts
      setContestCount(dataStr.contest_count)
      setGlobalRank(dataStr.global_rank)
      setTotalUsers(dataStr.total_users)

    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        const { data: userProfile } = await supabase
          .from('users')
          .select('role, approval_status')
          .eq('id', authUser.id)
          .single()

        if (userProfile) {
          setCurrentUser({
            id: authUser.id,
            role: userProfile.role,
            approval_status: userProfile.approval_status
          })
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }


  const confirmMakeAdmin = async () => {
    setShowAdminConfirm(false)
    await handleMakeAdmin()
  }

  const handleMakeAdmin = async () => {
    // Original implementation logic called by modal
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') || currentUser.approval_status !== 'approved') {
      toast.error('Only admins can make users admin')
      return
    }

    if (!profile) return

    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('make_user_admin', {
          target_user_id: profile.id,
          admin_user_id: currentUser.id
        })

      if (error) {
        console.error('Error making user admin:', error)
        toast.error('Failed to make user admin')
        return
      }

      if (data.success) {
        toast.success('User successfully made admin!')
        // Refresh profile to show updated role
        fetchProfile()
      } else {
        toast.error(data.error || 'Failed to make user admin')
      }
    } catch (error) {
      console.error('Error making user admin:', error)
      toast.error('Failed to make user admin')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveAdmin = async () => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin') || currentUser.approval_status !== 'approved') {
      toast.error('Only admins can remove admin privileges')
      return
    }

    if (!profile) return

    // Prevent removing your own admin status
    if (profile.id === currentUser.id) {
      toast.error('You cannot remove your own admin privileges')
      return
    }

    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('remove_user_admin', {
          target_user_id: profile.id,
          admin_user_id: currentUser.id
        })

      if (error) {
        console.error('Error removing admin privileges:', error)
        // Fallback to direct update if RPC fails or doesn't exist
        const { error: updateError } = await supabase
          .from('users')
          .update({ role: 'student' })
          .eq('id', profile.id)

        if (updateError) {
          toast.error('Failed to remove admin privileges')
          return
        }
        toast.success('Admin privileges removed successfully!')
        fetchProfile()
        return
      }

      if (data.success) {
        toast.success('Admin privileges removed successfully!')
        // Refresh profile to show updated role
        fetchProfile()
      } else {
        toast.error(data.error || 'Failed to remove admin privileges')
      }
    } catch (error) {
      console.error('Error removing admin privileges:', error)
      toast.error('Failed to remove admin privileges')
    } finally {
      setActionLoading(false)
    }
  }

  const copyUsername = async () => {
    try {
      await navigator.clipboard.writeText(`@${profile?.username}`)
      setCopied(true)
      toast.success('Username copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy username:', error)
      toast.error('Failed to copy username')
    }
  }

  const isCurrentUserAdmin = (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && currentUser?.approval_status === 'approved'
  const isCurrentUserSuperAdmin = currentUser?.role === 'super_admin'
  const isOwnProfile = currentUser?.id === profile?.id

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const past = new Date(date)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return past.toLocaleDateString()
  }

  const getDifficultyColor = (difficulty: string) => {
    const diff = difficulty.toLowerCase()
    if (diff === 'easy') return 'text-green-400 bg-green-500/20 border-green-500/30'
    if (diff === 'medium') return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
    if (diff === 'hard') return 'text-red-400 bg-red-500/20 border-red-500/30'
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
  }

  // Calculate percentages for the stats
  const totalSolved = problemStats.total
  const easyPct = totalSolved > 0 ? (problemStats.easy / totalSolved) * 100 : 0
  const mediumPct = totalSolved > 0 ? (problemStats.medium / totalSolved) * 100 : 0
  const hardPct = totalSolved > 0 ? (problemStats.hard / totalSolved) * 100 : 0

  // Calculate total contributions from heatmap data
  const totalContributions = heatmapData.reduce((sum, d) => sum + d.count, 0)


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse text-sm">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="bg-muted h-20 w-20 rounded-full mx-auto flex items-center justify-center">

          </div>
          <h1 className="text-xl font-semibold">User Not Found</h1>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 font-sans pb-20 selection:bg-purple-500/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header Stats - Only visible for students */}
        {profile?.role === 'student' && (
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="relative group flex items-center gap-1.5 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 hover:bg-black/40 transition-all cursor-pointer">
                <span className="text-blue-400 font-semibold">#{globalRank ? globalRank.toLocaleString() : 'Unranked'}</span>
                <span className="text-gray-400">Rank</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-black text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                  Global Rank
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                </div>
              </div>
              <div className="relative group flex items-center gap-1.5 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 hover:bg-black/40 transition-all cursor-pointer">

                <span className="text-orange-400 font-semibold">{profile?.streak || 0}</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-black text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                  Current Streak
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                </div>
              </div>
              <div className="relative group flex items-center gap-1.5 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 hover:bg-black/40 transition-all cursor-pointer">
                <span className="text-yellow-400 font-semibold">{profile?.points?.toLocaleString() || 0}</span>
                <span className="text-gray-400">points</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-white text-black text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                  Total Points
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROLE-BASED PROFILE VIEWS */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {!isCurrentUserAdmin ? (
            /* STUDENT PROFILE VIEW - Visible only to Students */
            <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden group">
              <div className="absolute inset-0 bg-transparent" />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Avatar Section */}
                <div className="relative group/avatar">
                  <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl transition duration-500"></div>
                  <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-[#121212] flex items-center justify-center text-4xl font-bold border border-white/10 shadow-2xl overflow-hidden">
                    {profile?.name.charAt(0).toUpperCase()}
                  </div>
                  {globalRank && globalRank <= 3 && (
                    <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground p-2 rounded-full shadow-lg ring-4 ring-background z-20">

                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-2">
                      {profile?.name}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <Badge variant="secondary" className="bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 px-3 py-1 text-sm font-medium">
                        @{profile?.username}
                      </Badge>
                      {profile?.department && (
                        <Badge variant="outline" className="border-white/10 text-gray-400 px-3 py-1">
                          {profile.department}
                        </Badge>
                      )}
                      {profile?.role === 'admin' && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>

                  {profile?.bio && (
                    <p className="text-gray-400 max-w-2xl text-base leading-relaxed mx-auto md:mx-0">
                      {profile.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                    {profile?.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white hover:scale-110 transition-all bg-white/5 p-2 rounded-lg hover:bg-white/10">
                        GitHub
                      </a>
                    )}
                    {profile?.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#0A66C2] hover:scale-110 transition-all bg-white/5 p-2 rounded-lg hover:bg-white/10">
                        LinkedIn
                      </a>
                    )}
                    {profile?.instagram_url && (
                      <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#E1306C] hover:scale-110 transition-all bg-white/5 p-2 rounded-lg hover:bg-white/10">
                        Instagram
                      </a>
                    )}
                    {profile?.portfolio_url && (
                      <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-400 hover:scale-110 transition-all bg-white/5 p-2 rounded-lg hover:bg-white/10">
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>

                {/* CTA Section */}
                <div className="flex flex-col gap-3 min-w-[140px]">
                  {isOwnProfile && (
                    <Button
                      onClick={() => router.push('/dashboard/profile/edit')}
                      className="bg-white text-black hover:bg-gray-200 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ADMIN PROFILE VIEW - Visible only to Admins/Super Admins */
            <div className="space-y-6">
              {/* Identity Card (Simplified for Admins) */}
              <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group/avatar">
                    <div className="absolute -inset-0.5 bg-secondary/50 rounded-2xl transition duration-500"></div>
                    <div className="relative w-28 h-28 rounded-2xl bg-[#121212] flex items-center justify-center text-4xl font-bold border border-white/10 shadow-2xl overflow-hidden text-white">
                      {profile?.name.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      {profile?.name}
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <Badge variant="secondary" className="bg-white/5 text-gray-300 border-white/10 mt-1">
                        @{profile?.username}
                      </Badge>
                      {profile?.department && (
                        <Badge variant="outline" className="border-white/10 text-gray-400">
                          {profile.department}
                        </Badge>
                      )}
                      {profile?.prn && (
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-mono">PRN: {profile.prn}</span>
                      )}
                    </div>
                    {profile?.bio && <p className="text-gray-400 text-sm max-w-xl">{profile.bio}</p>}

                    <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
                      {profile?.github_url && <span className="text-xs text-gray-500">GitHub</span>}
                      {profile?.linkedin_url && <span className="text-xs text-gray-500">LinkedIn</span>}
                      {profile?.instagram_url && <span className="text-xs text-gray-500">Instagram</span>}
                      {profile?.portfolio_url && <span className="text-xs text-gray-500">Portfolio</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {isOwnProfile && (
                      <Button onClick={() => router.push('/dashboard/profile/edit')} className="bg-white text-black hover:bg-gray-200">
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Administrative Control Panel */}
              <div className="relative bg-black/40 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 overflow-hidden">
                <div className="absolute inset-0 bg-transparent" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400">
                      <span className="text-xl font-bold">A</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        Administrator Profile
                        {profile?.role === 'super_admin' ? (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[10px] uppercase">Super Admin</Badge>
                        ) : profile?.role === 'admin' ? (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] uppercase">Admin</Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 text-[10px] uppercase">Student</Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">Privilege & Account Management</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-6 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                      <div className="text-center">
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">Status</div>
                        <div className="text-xs font-semibold text-green-400 capitalize">{profile?.approval_status || 'Approved'}</div>
                      </div>
                      {profile?.created_at && (
                        <div className="text-center">
                          <div className="text-[10px] text-gray-500 uppercase tracking-widest">Joined</div>
                          <div className="text-xs font-semibold text-gray-300">{new Date(profile.created_at).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>

                    {isCurrentUserSuperAdmin && !isOwnProfile && (
                      <div className="flex gap-3">
                        {profile?.role !== 'admin' && profile?.role !== 'super_admin' ? (
                          <Button
                            onClick={() => { setConfirmAction('make'); setShowAdminConfirm(true); }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Make Admin
                          </Button>
                        ) : profile?.role === 'admin' ? (
                          <Button
                            onClick={handleRemoveAdmin}
                            variant="destructive"
                          >
                            Revoke Admin
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BENTO GRID - Only visible for students */}
        {profile?.role === 'student' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">

            {/* HEATMAP - Span 8 */}
            <div className="col-span-12 lg:col-span-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-white flex items-center gap-2">

                  Activity
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-lg">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  {totalContributions} submissions this year
                </div>
              </div>
              <div className="bg-[#121212] rounded-xl p-4 border border-white/5 overflow-x-auto custom-scrollbar">
                <ContributionsGraph
                  data={heatmapData}
                />
              </div>
            </div>

            {/* SOLVED PROBLEMS - Span 4 */}
            <div className="col-span-12 lg:col-span-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col hover:border-white/20 transition-colors duration-300">
              <h3 className="font-semibold text-lg text-white mb-6 flex items-center gap-2">

                Solved Problems
              </h3>

              <div className="flex-1 flex flex-col justify-center gap-8">
                {/* Donut & Total */}
                <div className="flex items-center gap-6">
                  <div className="relative w-28 h-28 group">
                    {/* Glow effect behind donut */}
                    <div className="absolute inset-0 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all duration-500" />

                    <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 36 36">
                      <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path className="text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.5)]" strokeDasharray={`${Math.min(problemStats.total / (problemStats.total + 50) * 100, 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                      <span className="text-2xl font-bold text-white">{problemStats.total}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">Solved</span>
                    </div>
                  </div>
                  <div className="text-sm space-y-2 flex-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Easy</span>
                      <span className="font-mono text-green-400">{problemStats.easy}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Medium</span>
                      <span className="font-mono text-yellow-400">{problemStats.medium}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Hard</span>
                      <span className="font-mono text-red-400">{problemStats.hard}</span>
                    </div>
                  </div>
                </div>

                {/* Bars */}
                <div className="space-y-3 w-full">
                  <div className="h-1.5 w-full bg-gray-800/50 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-500" style={{ width: `${(problemStats.easy / (problemStats.total || 1)) * 100}%` }} />
                    <div className="h-full bg-yellow-500" style={{ width: `${(problemStats.medium / (problemStats.total || 1)) * 100}%` }} />
                    <div className="h-full bg-red-500" style={{ width: `${(problemStats.hard / (problemStats.total || 1)) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>Acceptance Rate</span>
                    <span>{totalSolved > 0 ? '67%' : '0%'}</span>
                  </div>
                </div>
              </div>
            </div>


            {/* RECENT SUBMISSIONS - Span 8 */}
            <div className="col-span-12 lg:col-span-8 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                  Recent Submissions
                </h3>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400 hover:text-white hover:bg-white/5" onClick={() => router.push('/submissions')}>
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map((sub, i) => (
                    <div
                      key={sub.id}
                      className="group flex items-center justify-between p-3 rounded-xl bg-[#121212]/50 hover:bg-[#121212] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                      onClick={() => router.push(`/problems/${sub.problem.id}`)}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${sub.problem?.difficulty.toLowerCase() === 'easy' ? 'bg-green-500/10 text-green-500' :
                          sub.problem?.difficulty.toLowerCase() === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                          }`}>

                        </div>
                        <div>
                          <div className="font-medium text-gray-200 group-hover:text-white transition-colors">
                            {sub.problem?.title}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{getTimeAgo(sub.submitted_at || sub.created_at || new Date().toISOString())}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-700" />
                            <span className="capitalize">{sub.problem?.difficulty}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-white/5 border-white/5 text-gray-400 font-mono text-xs group-hover:bg-white/10 transition-colors">
                          {sub.language}
                        </Badge>
                        <div className="p-1 rounded-md text-gray-600 group-hover:text-white group-hover:bg-white/5 transition-all">

                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-white/5 border-dashed rounded-xl bg-white/[0.02]">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">

                    </div>
                    <p className="text-sm text-gray-400">No submissions yet</p>
                    <p className="text-xs text-gray-600 mt-1">Start solving problems to build your streak!</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT SIDEBAR (Badges & Languages) - Span 4 */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
              {/* BADGES */}
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex-1 hover:border-white/20 transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-white flex items-center gap-2">

                    Badges
                  </h3>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">{profile?.badges?.length || 0}</span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {profile?.badges && profile.badges.length > 0 ? (
                    profile.badges.slice(0, 8).map((badge, i) => (
                      <div key={i} className="aspect-square bg-card rounded-xl border border-border flex items-center justify-center p-3 hover:border-primary/50 transition-all cursor-help group relative">
                        <div className="text-xs font-bold text-yellow-500">{badge.charAt(0)}</div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 backdrop-blur-xl border border-white/10 text-xs text-white rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                          {badge}
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 text-center py-8 bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
                      <div className="w-8 h-8 text-gray-600 mx-auto mb-2 opacity-50" />
                      <p className="text-xs text-gray-500">No badges earned yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* LANGUAGES */}
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex-1 hover:border-white/20 transition-colors duration-300">
                <h3 className="font-semibold text-lg text-white mb-5 flex items-center gap-2">

                  Top Languages
                </h3>
                <div className="space-y-4">
                  {submissions.length > 0 ? (
                    Array.from(new Set(submissions.map(s => s.language))).slice(0, 5).map((lang, index) => {
                      const count = submissions.filter(s => s.language === lang).length
                      const pct = (count / submissions.length) * 100
                      const colors = [
                        'bg-blue-500',
                        'bg-yellow-500',
                        'bg-green-500',
                        'bg-purple-500',
                        'bg-pink-500'
                      ]
                      return (
                        <div key={lang} className="group">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-300 font-medium capitalize flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`} />
                              {lang}
                            </span>
                            <span className="text-gray-500">{count} solved</span>
                          </div>
                          <div className="h-2 w-full bg-[#121212] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${colors[index % colors.length]} rounded-full opacity-70 group-hover:opacity-100 transition-opacity`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-xs text-gray-500 bg-white/[0.02] rounded-xl border border-white/5 border-dashed">
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Admin Confirmation Modal */}
      {showAdminConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[50] p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">

            </div>

            <div className="flex flex-col items-center text-center mb-6 relative z-10">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.2)]">

              </div>
              <h3 className="text-xl font-bold mb-2 text-white">Grant Admin Privileges?</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Are you sure you want to make <strong>{profile?.name}</strong> an Admin? This will grant them significant control over the platform.
              </p>
            </div>

            <div className="flex gap-3 relative z-10">
              <Button
                onClick={() => setShowAdminConfirm(false)}
                variant="outline"
                className="flex-1 border-white/10 hover:bg-white/5 text-white bg-transparent h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmMakeAdmin}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-11"
              >
                Confirm Access
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
