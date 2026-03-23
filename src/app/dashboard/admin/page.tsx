'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import UserSearch from '@/components/UserSearch'
import {
  Users,
  Trophy,
  Target,
  TrendingUp,
  Plus,
  Search,
  LayoutDashboard,
  Shield,
  FileText,
  Settings,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

// Mock Data for Analytics


// Interface for Audit Log
interface AuditLog {
  id: string
  action: string
  admin_id: string
  target_id: string | null
  target_name: string | null
  target_type: string
  details: any
  created_at: string
  // Joined fields
  admin_name?: string
}

// ... interfaces keep consistent ...
interface Student {
  id: string
  name: string
  email: string
  department?: string
  prn?: string
  streak?: number
  points?: number
  badges?: string[]
  created_at: string
  approval_status?: 'pending' | 'approved' | 'rejected' | 'restricted'
  ban_reason?: string
  is_restricted?: boolean
}

interface Contest {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string
  created_by: string
  problems_count?: number
  participants_count?: number
}

interface DashboardStats {
  totalStudents: number
  pendingApprovals: number
  totalContests: number
  activeContests: number
  totalProblems: number
  totalSubmissions: number
}

export default function AdminDashboard() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('overview')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof Student; direction: 'asc' | 'desc' } | null>(null)

  const handleSort = (key: keyof Student) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })

    const sorted = [...allStudents].sort((a, b) => {
      if (!a[key] && !b[key]) return 0
      if (!a[key]) return 1
      if (!b[key]) return -1

      if (a[key]! < b[key]!) return direction === 'asc' ? -1 : 1
      if (a[key]! > b[key]!) return direction === 'asc' ? 1 : -1
      return 0
    })
    setAllStudents(sorted)
  }

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingApprovals: 0,
    totalContests: 0,
    activeContests: 0,
    totalProblems: 0,
    totalSubmissions: 0
  })
  const [pendingStudents, setPendingStudents] = useState<Student[]>([])
  const [allStudents, setAllStudents] = useState<Student[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [recentContests, setRecentContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentProfile, setShowStudentProfile] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  // Chart Data State
  const [registrationData, setRegistrationData] = useState<any[]>([])
  const [submissionData, setSubmissionData] = useState<any[]>([])
  const [departmentData, setDepartmentData] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  const router = useRouter()
  const supabase = createClient()

  // ... existing fetchDashboardData ...

  // ... existing fetchDashboardData ...

  const filteredStudents = useMemo(() => {
    let sortableItems = [...allStudents];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (!a[sortConfig.key] && !b[sortConfig.key]) return 0
        if (!a[sortConfig.key]) return 1
        if (!b[sortConfig.key]) return -1

        if (a[sortConfig.key]! < b[sortConfig.key]!) return sortConfig.direction === 'asc' ? -1 : 1
        if (a[sortConfig.key]! > b[sortConfig.key]!) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortableItems;
  }, [allStudents, sortConfig]);

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id))
    }
  }

  const toggleSelectStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(s => s !== id))
    } else {
      setSelectedStudents([...selectedStudents, id])
    }
  }

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} ${selectedStudents.length} students?`)) return

    const toastId = toast.loading(`${action === 'approve' ? 'Approving' : 'Rejecting'} ${selectedStudents.length} students...`)

    try {
      const updates = selectedStudents.map(id =>
        supabase
          .from('users')
          .update({ approval_status: action === 'approve' ? 'approved' : 'rejected' })
          .eq('id', id)
      )

      await Promise.all(updates)

      toast.success(`Successfully ${action}d students`, { id: toastId })
      setSelectedStudents([])
      fetchDashboardData()
    } catch (error) {
      toast.error('Failed to update students', { id: toastId })
    }
  }

  const fetchDashboardData = useCallback(async () => {




    try {
      // First, verify the current user is an admin
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Check if user is admin
      const { data: userProfile } = await supabase
        .from('users')
        .select('role, approval_status')
        .eq('id', authUser.id)
        .single()

      if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin') || userProfile.approval_status !== 'approved') {
        toast.error('Access denied. Admin privileges required.')
        router.push('/dashboard')
        return
      }

      // Set current user with role
      setCurrentUser({ ...authUser, role: userProfile.role })

      // Use API endpoints instead of direct database access
      try {

        // Fetch students data
        const studentsResponse = await fetch('/api/students')
        const studentsData = await studentsResponse.json()

        // Fetch dashboard stats
        const statsResponse = await fetch('/api/dashboard-stats')
        const statsData = await statsResponse.json()

        // Fetch contests
        const contestsResponse = await fetch('/api/contests')
        const contestsData = await contestsResponse.json()

        console.log('API responses:', {
          students: studentsData,
          stats: statsData,
          contests: contestsData
        })

        // Update stats
        if (statsData.success && statsData.data) {
          setStats(statsData.data)
          // Set Chart Data if available
          if (statsData.charts) {
            setRegistrationData(statsData.charts.registrationTrend || [])
            setSubmissionData(statsData.charts.submissionActivity || [])
            setDepartmentData(statsData.charts.departmentDistribution || [])
          }
        } else {
          console.error('Stats API failed:', statsData.error)
          toast.error('Failed to load dashboard stats')
        }

        // Update students list
        if (studentsData.success && studentsData.data) {
          // Set all students for the Students tab
          setAllStudents(studentsData.data)
          // Set recent students for Overview tab (first 10)
          setPendingStudents(studentsData.data.slice(0, 10))
          console.log('✅ Students loaded successfully:', studentsData.data.length, 'students')
          console.log('Sample student data:', studentsData.data[0])
        } else {
          console.error('❌ Students API failed:', studentsData.error)
          toast.error('Failed to load students data')
          // Set empty arrays to prevent undefined errors
          setAllStudents([])
          setPendingStudents([])
        }

        // Update contests list with counts
        if (contestsData.success && contestsData.data) {
          const contestsWithCounts = await Promise.all(
            contestsData.data.slice(0, 5).map(async (contest: any) => {
              // Get problems count
              const { count: problemsCount } = await supabase
                .from('contest_problems')
                .select('*', { count: 'exact', head: true })
                .eq('contest_id', contest.id)

              // Get participants count
              const { count: participantsCount } = await supabase
                .from('contest_registrations')
                .select('*', { count: 'exact', head: true })
                .eq('contest_id', contest.id)

              return {
                ...contest,
                description: contest.description || 'No description',
                created_by: contest.created_by || '',
                problems_count: problemsCount || 0,
                participants_count: participantsCount || 0
              }
            })
          )
          setRecentContests(contestsWithCounts)
        }

        // Fetch recent submissions for the Overview tab
        try {
          const { data: submissionsData, error: subError } = await supabase
            .from('submissions')
            .select(`
              id,
              status,
              language,
              submitted_at,
              score,
              user:users(name, username),
              problem:problems(title, difficulty)
            `)
            .order('submitted_at', { ascending: false })
            .limit(10)

          if (!subError && submissionsData) {
            setRecentSubmissions(submissionsData.map((s: any) => ({
              ...s,
              user_name: s.user?.name || 'Unknown',
              user_username: s.user?.username || '',
              problem_title: s.problem?.title || 'Unknown Problem',
              problem_difficulty: s.problem?.difficulty || 'unknown'
            })))
          }
        } catch (e) {
          console.warn('Failed to fetch recent submissions:', e)
        }

        console.log('Admin data fetched successfully via API')

      } catch (apiError) {
        console.error('API fetch failed:', apiError)
        toast.error('Failed to load dashboard data. Please run FINAL_WORKING_FIX.sql')

        // Set default values
        setStats({
          totalStudents: 0,
          pendingApprovals: 0,
          totalContests: 0,
          activeContests: 0,
          totalProblems: 0,
          totalSubmissions: 0
        })
      }

      // Fetch Audit Logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          admin:users!audit_logs_admin_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (logsError) {
        console.error('Error fetching audit logs:', logsError)
        toast.error(`Audit Logs Error: ${logsError.message}`)
      } else if (logsData) {
        setAuditLogs(logsData.map(log => ({
          ...log,
          admin_name: log.admin?.name || 'Unknown Admin'
        })))
      }

      // Pending students are already fetched in the main query above
      // No additional fetching needed as we already have the data

    } catch (error) {
      console.error('Error fetching dashboard data:', error)

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('relation "users" does not exist')) {
          toast.error('Database not set up. Please run the database setup first.')
        } else if (error.message.includes('infinite recursion')) {
          toast.error('Database RLS policies need to be fixed. Please run the RLS fix script.')
        } else if (error.message.includes('permission denied')) {
          toast.error('Insufficient permissions. Please check your admin status.')
        } else {
          toast.error(`Failed to load dashboard data: ${error.message}`)
        }
      } else {
        toast.error('Failed to load dashboard data. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    let isMounted = true
    let refreshTimeout: NodeJS.Timeout

    const debouncedFetch = () => {
      clearTimeout(refreshTimeout)
      refreshTimeout = setTimeout(() => {
        if (isMounted) {
          console.log('🔄 Refreshing dashboard data...')
          fetchDashboardData()
        }
      }, 500)
    }

    // Initial fetch
    fetchDashboardData()

    // Subscribe to real-time updates with debouncing
    const subscription = supabase
      .channel('admin-dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: 'role=eq.student'
        },
        (payload) => {
          console.log('🔄 User update detected:', payload.eventType)
          debouncedFetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contests'
        },
        (payload) => {
          console.log('🔄 Contest update detected:', payload.eventType)
          debouncedFetch()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'submissions'
        },
        (payload) => {
          console.log('🔄 New submission detected:', payload.eventType)
          debouncedFetch()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      clearTimeout(refreshTimeout)
      subscription.unsubscribe()
    }
  }, [fetchDashboardData, supabase])

  const handleApproveStudent = async (studentId: string, studentName: string) => {
    const loadingToast = toast.loading(`Approving ${studentName}...`)
    try {
      // Try the new admin API first
      let response = await fetch('/api/admin/approve-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          userId: studentId,
          adminId: currentUser?.id
        })
      })

      // Fallback to original API if new one fails
      if (!response.ok) {
        response = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'approve',
            userId: studentId
          })
        })
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve student')
      }

      toast.success(`✅ ${studentName} has been approved and can now access the platform`, { id: loadingToast })
      // Refresh data to show changes
      await fetchDashboardData()
    } catch (error) {
      console.error('Error approving student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve student', { id: loadingToast })
    }
  }

  const handleRejectStudent = async (studentId: string, studentName: string) => {
    // Ask for rejection reason
    const reason = prompt(`Please provide a reason for rejecting ${studentName}:`)

    if (reason === null) {
      // User cancelled
      return
    }

    const rejectionReason = reason.trim() || 'Rejected by admin'
    const loadingToast = toast.loading(`Rejecting ${studentName}...`)

    try {
      // Try the new admin API first
      let response = await fetch('/api/admin/approve-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          userId: studentId,
          reason: rejectionReason,
          adminId: currentUser?.id
        })
      })

      // Fallback to original API if new one fails
      if (!response.ok) {
        response = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'reject',
            userId: studentId,
            reason: rejectionReason
          })
        })
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to reject student')
      }

      toast.success(`❌ ${studentName} has been rejected. Reason: ${rejectionReason}`, { id: loadingToast })
      // Refresh data to show changes
      await fetchDashboardData()
    } catch (error) {
      console.error('Error rejecting student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reject student', { id: loadingToast })
    }
  }

  const handleRestrictStudent = async (studentId: string, studentName: string) => {
    const reason = prompt(`Please provide a reason for restricting ${studentName}:`)
    if (reason === null) return

    const restrictionReason = reason.trim() || 'Restricted by admin'
    const loadingToast = toast.loading(`Restricting ${studentName}...`)

    try {
      const response = await fetch('/api/admin/approve-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restrict',
          userId: studentId,
          reason: restrictionReason,
          adminId: currentUser?.id
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to restrict student')

      toast.success(`⚠️ ${studentName} has been restricted.`, { id: loadingToast })
      await fetchDashboardData()
    } catch (error) {
      console.error('Error restricting student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to restrict student', { id: loadingToast })
    }
  }

  const handleRevokeRestriction = async (studentId: string, studentName: string) => {
    const loadingToast = toast.loading(`Restoring access for ${studentName}...`)

    try {
      const response = await fetch('/api/admin/approve-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          userId: studentId,
          adminId: currentUser?.id
        })
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to revoke restriction')

      toast.success(`✅ Access restored for ${studentName}`, { id: loadingToast })
      await fetchDashboardData()
    } catch (error) {
      console.error('Error revoking restriction:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to revoke restriction', { id: loadingToast })
    }
  }

  const copyUsername = async () => {
    if (!currentUser?.user_metadata?.username) return
    try {
      await navigator.clipboard.writeText(`@${currentUser.user_metadata.username}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy username:', error)
    }
  }

  // Debug and emergency functions removed - use proper logging and monitoring instead

  /* 
   * Helper removed: Verification and Fix scripts should be run via direct SQL or migration scripts.
   */

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student)
    setShowStudentProfile(true)
  }

  // RLS fix functions removed - use migration scripts in src/lib/database/migrations instead

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/user-profile/${userId}`)
      const data = await response.json()
      if (data.success) {
        // You can add a modal or redirect to profile page here
        console.log('User profile:', data.profile)
        toast.success('Profile loaded successfully')
        // For now, just show the profile data in console
        // You can implement a modal similar to AdminApprovalInterface
      } else {
        toast.error('Failed to load user profile')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load user profile')
    }
  }

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'search', label: 'Search Users' },
    { id: 'students', label: 'Students' },
    { id: 'contests', label: 'Contests' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'audit-logs', label: 'Audit Logs' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00C896]"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-[70px]'
          } relative flex-col border-r border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-300 ease-in-out hidden md:flex h-screen sticky top-0`}
      >
        <div className="p-4 flex items-center h-16 border-b border-border/40">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 font-bold text-xl">
              <span className="text-primary">
                PVG Admin
              </span>
            </div>
          ) : (
            <div className="mx-auto h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
              PVG
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-24 h-6 w-6 rounded-full border bg-background shadow-md z-10 hover:bg-accent"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? '<' : '>'}
        </Button>

        <div className="flex-1 py-6 space-y-2 px-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "secondary" : "ghost"}
              className={`w-full justify-start relative group ${!isSidebarOpen && 'justify-center px-0'} ${activeTab === item.id ? 'bg-primary/10 text-primary hover:bg-primary/15' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setActiveTab(item.id)}
            >
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded bg-popover text-popover-foreground text-xs invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-50 whitespace-nowrap border shadow-sm">
                  {item.label}
                </div>
              )}
            </Button>
          ))}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <main className="flex-1 h-screen overflow-y-auto bg-background">

        {/* Admin Header */}
        <div className="glass-card m-4 rounded-xl p-4 border-l-4 border-red-500/0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold border border-primary/20">
                  ADMIN CONSOLE
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <span className="text-muted-foreground text-xs">@</span>
                  <span className="text-base font-medium">{currentUser?.user_metadata?.username || 'admin'}</span>
                  <Button
                    onClick={copyUsername}
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 hover:bg-white/20"
                  >
                    {copied ? (
                      <span className="text-xs text-green-400">Copied</span>
                    ) : (
                      <span className="text-xs">Copy</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-8 bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-none border border-transparent transition-all duration-200"
                onClick={() => router.push('/dashboard/admin/contests')}
              >
                Manage Contests
              </Button>
              <Button
                size="sm"
                className="h-8 bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-none border border-transparent transition-all duration-200"
                onClick={() => router.push('/dashboard/admin/problems')}
              >
                Manage Problems
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 m-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xl font-bold">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xl font-bold">{stats.totalContests}</p>
                  <p className="text-xs text-muted-foreground">Total Contests</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xl font-bold">{stats.totalProblems}</p>
                  <p className="text-xs text-muted-foreground">Problems</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-xl font-bold">{stats.totalSubmissions}</p>
                  <p className="text-xs text-muted-foreground">Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="m-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* TabsList moved to Sidebar */}

            <TabsContent value="search" className="mt-6">
              <UserSearch
                currentUserId={currentUser?.id || ''}
                currentUserRole={currentUser?.role || ''}
              />
            </TabsContent>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Recent Contests</CardTitle>
                    <CardDescription>Latest contest activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {recentContests.map((contest) => (
                        <div key={contest.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">{contest.name}</h4>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {new Date(contest.start_time).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                {contest.problems_count || 0} probs
                              </span>
                              <span className="flex items-center gap-1">
                                {contest.participants_count || 0} participants
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-white/20"
                            onClick={() => router.push(`/contests/${contest.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Students */}
                <Card className="glass-card flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Recent Students</CardTitle>
                        <CardDescription>Latest registrations</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('students')} className="text-xs">
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden p-0">
                    <div className="space-y-1 h-[350px] overflow-y-auto px-4 pb-4">
                      {pendingStudents.length > 0 ? (
                        pendingStudents.map((student) => (
                          <div key={student.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${student.approval_status === 'rejected'
                            ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                            : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'
                            }`}>
                            <div className="min-w-0 flex-1 mr-3">
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4 className="font-medium text-sm truncate">{student.name}</h4>
                                {student.prn && <Badge variant="outline" className="text-[10px] px-1 h-4 border-white/10">{student.prn}</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                            </div>
                            <div className="flex gap-1">
                              {student.approval_status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20"
                                    onClick={() => handleApproveStudent(student.id, student.name)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                    onClick={() => handleRejectStudent(student.id, student.name)}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {student.approval_status === 'approved' && (
                                <span className="text-xs text-green-400">Approved</span>
                              )}
                              {student.approval_status === 'rejected' && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-red-400">Rejected</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-green-400 hover:bg-green-500/10"
                                    onClick={() => handleApproveStudent(student.id, student.name)}
                                    title="Re-approve"
                                  >
                                    Re-approve
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">

                          <p className="text-sm">No new students</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="students" className="mt-6">
              <Card className="glass-card mb-4">
                <CardHeader>
                  <CardTitle>All Students ({allStudents.length})</CardTitle>
                  <CardDescription>Complete list of all registered students</CardDescription>
                </CardHeader>
              </Card>
              {allStudents.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="p-12 text-center">

                    <h3 className="text-xl font-semibold mb-2">No Students Found</h3>
                    <p className="text-muted-foreground mb-4">
                      No student data is available.
                    </p>
                    <Button
                      onClick={fetchDashboardData}
                      className="bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white font-medium hover:from-[#22C55E] hover:to-[#16A34A] shadow-lg shadow-[rgba(22,163,74,0.25)] transition-all duration-200 border-0"
                    >
                      Retry Loading
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Bulk Actions Toolbar */}
                  {selectedStudents.length > 0 && (
                    <div className="flex items-center justify-between p-4 glass-card bg-primary/10 border-primary/20 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2">

                        <span className="font-medium text-primary">{selectedStudents.length} students selected</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleBulkAction('approve')}
                          className="bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white font-medium hover:from-[#22C55E] hover:to-[#16A34A] shadow-lg shadow-[rgba(22,163,74,0.25)] transition-all duration-200 border-0"
                        >
                          Approve Selected
                        </Button>
                        <Button size="sm" onClick={() => handleBulkAction('reject')} variant="destructive">
                          Reject Selected
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white/5 text-muted-foreground font-medium border-b border-border/40">
                          <tr>
                            <th className="px-4 py-3 w-10 min-w-[40px]">
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  className="rounded border-white/20 bg-white/5 focus:ring-primary w-4 h-4 cursor-pointer"
                                  checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                  onChange={toggleSelectAll}
                                />
                              </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer group hover:text-white transition-colors" onClick={() => handleSort('name')}>
                              <div className="flex items-center gap-2">
                                Student

                              </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer group hover:text-white transition-colors text-left" onClick={() => handleSort('department')}>
                              <div className="flex items-center gap-2">
                                Details

                              </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer group hover:text-white transition-colors text-center" onClick={() => handleSort('points')}>
                              <div className="flex items-center justify-center gap-2">
                                Stats

                              </div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer group hover:text-white transition-colors text-left" onClick={() => handleSort('created_at')}>
                              <div className="flex items-center gap-2">
                                Joined

                              </div>
                            </th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {allStudents.map((student) => (
                            <tr
                              key={student.id}
                              className="hover:bg-white/5 transition-colors cursor-pointer group"
                              onClick={() => handleStudentClick(student)}
                            >
                              <td className="px-4 py-3 w-10 min-w-[40px] align-middle" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-white/20 bg-white/5 focus:ring-primary w-4 h-4 cursor-pointer"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => toggleSelectStudent(student.id)}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="flex items-center gap-4">
                                  <div className="relative group/avatar shrink-0">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-sm transition-transform group-hover:scale-105 ${student.approval_status === 'rejected' || student.approval_status === 'restricted' || student.is_restricted
                                      ? 'bg-gradient-to-br from-red-500/80 to-red-600'
                                      : 'bg-gradient-to-br from-[#00C896] to-[#00A878]'
                                      }`}>
                                      {student.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    {(student.approval_status === 'restricted' || student.is_restricted) && (
                                      <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 border-2 border-background shadow-lg">
                                        <span className="text-[10px] font-bold">!</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex flex-col justify-center">
                                    <div className="font-semibold text-foreground truncate max-w-[180px] leading-tight mb-0.5">{student.name}</div>
                                    <div className="text-[11px] text-muted-foreground truncate max-w-[180px] flex items-center gap-1 opacity-70">

                                      {student.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="flex flex-col gap-1 justify-center">
                                  {student.prn ? (
                                    <div className="flex items-center">
                                      <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 px-1.5 py-0 h-4 font-mono font-medium">
                                        {student.prn}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground/50 italic px-1">No PRN</span>
                                  )}
                                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-0.5 opacity-80">

                                    <span className="truncate max-w-[120px]">{student.department || 'General'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className="flex items-center justify-center gap-4">
                                  <div className="flex flex-col items-center min-w-[40px]">
                                    <span className="text-sm font-bold text-primary tabular-nums leading-none mb-0.5">{student.points || 0}</span>
                                    <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-medium opacity-60">Points</span>
                                  </div>
                                  <div className="h-6 w-[1px] bg-border/40 shrink-0" />
                                  <div className="flex flex-col items-center min-w-[40px]">
                                    <span className="text-sm font-bold text-orange-400 tabular-nums leading-none mb-0.5">{student.streak || 0}</span>
                                    <span className="text-[9px] uppercase tracking-tighter text-muted-foreground font-medium opacity-60">Streak</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle whitespace-nowrap">
                                <div className="flex flex-col gap-0.5 justify-center">
                                  <span className="text-xs font-medium text-foreground/90">{new Date(student.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  <span className="text-[10px] text-muted-foreground opacity-50">Joined Date</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle">
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-sm transition-all whitespace-nowrap ${student.approval_status === 'approved' && !student.is_restricted ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                  student.approval_status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                    (student.approval_status === 'restricted' || student.is_restricted) ? 'bg-red-500/15 text-red-500 border-red-500/30 animate-pulse' :
                                      'bg-red-500/10 text-red-500 border-red-500/20'
                                  }`}>
                                  {student.approval_status === 'approved' && !student.is_restricted && <span className="mr-1.5 text-lg leading-none">•</span>}
                                  {student.approval_status === 'pending' && <span className="mr-1.5 text-lg leading-none">•</span>}
                                  {(student.approval_status === 'restricted' || student.is_restricted) && <span className="mr-1.5 text-lg leading-none">•</span>}
                                  {student.approval_status === 'rejected' && <span className="mr-1.5 text-lg leading-none">•</span>}
                                  <span className="capitalize tracking-wide">{student.is_restricted ? 'Banned' : student.approval_status}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-middle text-right">
                                <div className="flex justify-end items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                                  {student.approval_status === 'pending' && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                                        onClick={() => handleApproveStudent(student.id, student.name)}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all active:scale-95 flex items-center gap-1.5"
                                        onClick={() => handleRejectStudent(student.id, student.name)}
                                      >
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {student.approval_status === 'rejected' && (
                                    <Button
                                      size="sm"
                                      className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md active:scale-95 flex items-center gap-1.5"
                                      onClick={() => handleApproveStudent(student.id, student.name)}
                                    >
                                      Re-approve
                                    </Button>
                                  )}
                                  {(student.approval_status === 'restricted' || student.is_restricted) && (
                                    <Button
                                      size="sm"
                                      className="h-8 w-[150px] text-xs bg-[#00C896] hover:bg-[#00B085] text-white font-semibold shadow-md active:scale-95 border-0 flex items-center justify-center gap-1.5 shrink-0"
                                      onClick={() => handleRevokeRestriction(student.id, student.name)}
                                    >
                                      Revoke Restriction
                                    </Button>
                                  )}
                                  {(student.approval_status === 'approved' && !student.is_restricted) && (
                                    <Button
                                      size="sm"
                                      className="h-8 w-[150px] text-xs bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-md active:scale-95 border-0 group/restrict flex items-center justify-center gap-1.5 shrink-0"
                                      onClick={() => handleRestrictStudent(student.id, student.name)}
                                    >
                                      Restrict Access
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 hover:bg-white/10 transition-all flex items-center justify-center shrink-0"
                                    onClick={() => handleStudentClick(student)}
                                  >
                                    <span className="text-xs">View</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contests" className="mt-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Contest Management</CardTitle>
                  <CardDescription>Create and manage coding contests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentContests.map((contest) => (
                      <div key={contest.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <h4 className="font-semibold">{contest.name}</h4>
                          <p className="text-sm text-muted-foreground">{contest.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              Start:
                              {new Date(contest.start_time).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              End:
                              {new Date(contest.end_time).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm font-medium">{contest.participants_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Participants</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium">{contest.problems_count || 0}</div>
                            <div className="text-xs text-muted-foreground">Problems</div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => router.push(`/contests/${contest.id}`)}
                              title="View Contest"
                            >
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => router.push(`/dashboard/admin/contests?edit=${contest.id}`)}
                              title="Edit Contest"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete "${contest.name}"?`)) {
                                  try {
                                    const response = await fetch(`/api/contests/${contest.id}`, {
                                      method: 'DELETE'
                                    })
                                    if (response.ok) {
                                      toast.success('Contest deleted successfully')
                                      fetchDashboardData()
                                    } else {
                                      toast.error('Failed to delete contest')
                                    }
                                  } catch (error) {
                                    toast.error('Failed to delete contest')
                                  }
                                }
                              }}
                              title="Delete Contest"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6 space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card p-4 flex items-center gap-4">
                  <div className="rounded-xl">

                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Contests</p>
                    <h3 className="text-2xl font-bold">{stats.activeContests}</h3>
                  </div>
                </Card>
                <Card className="glass-card p-4 flex items-center gap-4">
                  <div className="rounded-xl">

                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Problems</p>
                    <h3 className="text-2xl font-bold">{stats.totalProblems}</h3>
                  </div>
                </Card>
                <Card className="glass-card p-4 flex items-center gap-4">
                  <div className="rounded-xl">

                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submissions</p>
                    <h3 className="text-2xl font-bold">{stats.totalSubmissions}</h3>
                  </div>
                </Card>
                <Card className="glass-card p-4 flex items-center gap-4">
                  <div className="rounded-xl">

                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
                  </div>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration Trend */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Registration Trend</CardTitle>
                    <CardDescription>New student registrations over the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={registrationData}>
                        <defs>
                          <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00C896" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="students" stroke="#00C896" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Submission Activity */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Submission Activity</CardTitle>
                    <CardDescription>Total submissions in the last 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={submissionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="submissions" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Department Distribution */}
                <Card className="glass-card lg:col-span-1">
                  <CardHeader>
                    <CardTitle>Departments</CardTitle>
                    <CardDescription>Student distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departmentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {departmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #333', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                  <div className="px-6 pb-6 grid grid-cols-2 gap-2 text-xs">
                    {departmentData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent Submissions */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Recent Submissions</CardTitle>
                    <CardDescription>Latest code submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                      {recentSubmissions.length > 0 ? recentSubmissions.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${sub.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                              {sub.status === 'accepted' ? '✓' : '✗'}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {sub.user_name}
                                <span className="text-muted-foreground font-normal"> submitted </span>
                                <span className="text-primary">{sub.problem_title}</span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {sub.language} · {new Date(sub.submitted_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className={`text-[10px] ${sub.status === 'accepted'
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {sub.status === 'accepted' ? 'Accepted' : 'Failed'}
                          </Badge>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No submissions yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Recent Registrations</CardTitle>
                    <CardDescription>Latest platform signups</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                      {pendingStudents.length > 0 ? pendingStudents.slice(0, 8).map((student, index) => (
                        <div key={student.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{student.name} <span className="text-muted-foreground font-normal">registered</span></p>
                              <p className="text-xs text-muted-foreground">{new Date(student.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-white/10 hover:bg-white/20">New User</Badge>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No recent registrations
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audit-logs" className="mt-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>Track administrative actions and system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-white/10 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white/5 text-muted-foreground font-medium border-b border-border/40">
                        <tr>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Admin</th>
                          <th className="px-4 py-3">Target</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {auditLogs.length > 0 ? (
                          auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3">
                                <Badge variant="outline" className={`
                                ${log.action === 'approve' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                    log.action === 'reject' || log.action === 'delete' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                      'bg-blue-500/10 text-blue-500 border-blue-500/20'}
                                capitalize
                              `}>
                                  {log.action}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                                    {log.admin_name?.charAt(0) || '?'}
                                  </div>
                                  {log.admin_name}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium">{log.target_name || log.target_id}</p>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1 capitalize bg-white/5 text-muted-foreground border-white/10">
                                      {log.target_type}
                                    </Badge>
                                    {log.details?.reason && (
                                      <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                                        "{log.details.reason}"
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                              No audit logs found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>

          {/* Student Profile Modal */}
          {showStudentProfile && selectedStudent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowStudentProfile(false)}>
              <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Student Profile</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStudentProfile(false)}
                      className="h-8 w-8 p-0"
                    >
                      <span className="text-lg font-bold">X</span>
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-lg font-semibold">{selectedStudent.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-lg">{selectedStudent.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Department</label>
                        <p className={`text-lg ${selectedStudent.department ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedStudent.department || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">PRN Number</label>
                        <p className={`text-lg font-mono px-2 py-1 rounded bg-transparent ${selectedStudent.prn ? 'text-white' : 'text-red-500 bg-red-500/10 border border-red-500/20'}`}>
                          {selectedStudent.prn || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="flex flex-col gap-2">
                          <span className={`inline-flex items-center w-fit px-2 py-1 rounded-full text-sm font-medium ${selectedStudent.approval_status === 'approved' && !selectedStudent.is_restricted ? 'text-green-500 animate-pulse' :
                            selectedStudent.approval_status === 'pending' ? 'text-yellow-600' :
                              (selectedStudent.approval_status === 'restricted' || selectedStudent.is_restricted) ? 'text-red-500 animate-pulse' :
                                'text-red-500'
                            }`}>
                            {selectedStudent.is_restricted ? 'Banned' :
                              selectedStudent.approval_status === 'approved' ? 'Approved' :
                                selectedStudent.approval_status}
                          </span>

                          {(selectedStudent.is_restricted || selectedStudent.approval_status === 'restricted') && selectedStudent.ban_reason && (
                            <div className="mt-1 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <label className="text-[10px] uppercase tracking-wider font-bold text-red-400 block mb-1">Ban Reason</label>
                              <p className="text-sm text-red-200 leading-relaxed italic">
                                "{selectedStudent.ban_reason}"
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Joined</label>
                        <p className="text-lg">{new Date(selectedStudent.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{selectedStudent.streak || 0}</div>
                        <div className="text-sm text-muted-foreground">Streak</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{selectedStudent.points || 0}</div>
                        <div className="text-sm text-muted-foreground">Points</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">{selectedStudent.badges?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Badges</div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
