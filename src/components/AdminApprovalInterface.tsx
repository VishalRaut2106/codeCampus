'use client'

import { useState, useEffect } from 'react'
import { AdminApprovalService, PendingUser } from '@/lib/admin/approval-service'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  UserCheck, 
  UserX, 
  Search,
  Mail,
  Github,
  Linkedin,
  Instagram,
  Calendar,
  Eye,
  Flame,

  Trophy,
  Pencil
} from 'lucide-react'

interface AdminApprovalInterfaceProps {
  currentUserId: string
  currentUserRole?: string
}

interface UserProfile {
  id: string
  name: string
  email: string
  username?: string
  prn?: string
  role: string
  approval_status: string
  created_at: string
  updated_at: string
  department?: string
  mobile_number?: string
  linkedin_id?: string
  github_url?: string
  linkedin_url?: string
  instagram_url?: string
  bio?: string
  streak?: number
  points?: number
  badges?: string[]
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
}

export default function AdminApprovalInterface({ currentUserId, currentUserRole }: AdminApprovalInterfaceProps) {
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  // Edit User State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<Partial<UserProfile> & { id: string } | null>(null)
  const [editLoading, setEditLoading] = useState(false)

  const approvalService = new AdminApprovalService()
  const supabase = createClient()

  // Use the custom realtime hook
  const { isConnected, updateCount, lastUpdate } = useRealtimeUpdates({
    table: 'users',
    onUpdate: (payload) => {
      // Refresh data when any user changes
      fetchUsers()
      fetchStats()
    },
    onConnect: (connected) => {
      // Connection status updated
    },
    pollingInterval: 120000 // 2 minutes (reduced from 30s to save calls)
  })

  useEffect(() => {
    fetchUsers()
    fetchStats()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await approvalService.getAllUsers()
      console.log('Fetched users data:', data)
      setUsers(data)
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await approvalService.getApprovalStats()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/user-profile/${userId}`)
      const data = await response.json()
      if (data.success) {
        setUserProfile(data.profile)
        setShowProfileModal(true)
      } else {
        toast.error(data.error || 'Failed to load user profile')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load user profile')
    }
  }

  const handleApprove = async (userId: string) => {
    setActionLoading(userId)
    
    // Optimistic update - immediately update the UI
    const userToUpdate = users.find(user => user.id === userId)
    if (userToUpdate) {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, approval_status: 'approved' as const, approved_by: currentUserId, approved_at: new Date().toISOString() }
            : user
        )
      )
      
      // Update stats optimistically
      setStats(prevStats => ({
        ...prevStats,
        pending: Math.max(0, prevStats.pending - 1),
        approved: prevStats.approved + 1
      }))
    }
    
    try {
      const success = await approvalService.approveUser(userId, currentUserId)
      if (success) {
        toast.success('User approved successfully!')
        // Real-time subscription will handle the final update
      } else {
        // Revert optimistic update on failure
        await fetchUsers()
        await fetchStats()
        toast.error('Failed to approve user')
      }
    } catch (error) {
      // Revert optimistic update on error
      await fetchUsers()
      await fetchStats()
      toast.error('Failed to approve user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setActionLoading(userId)
    
    // Optimistic update - immediately update the UI
    const userToUpdate = users.find(user => user.id === userId)
    if (userToUpdate) {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, approval_status: 'rejected' as const, approved_by: currentUserId, approved_at: new Date().toISOString(), rejection_reason: rejectionReason }
            : user
        )
      )
      
      // Update stats optimistically
      setStats(prevStats => ({
        ...prevStats,
        pending: Math.max(0, prevStats.pending - 1),
        rejected: prevStats.rejected + 1
      }))
    }
    
    try {
      const success = await approvalService.rejectUser(userId, currentUserId, rejectionReason)
      if (success) {
        toast.success('User rejected successfully!')
        setSelectedUser(null)
        setRejectionReason('')
        // Real-time subscription will handle the final update
      } else {
        // Revert optimistic update on failure
        await fetchUsers()
        await fetchStats()
        toast.error('Failed to reject user')
      }
    } catch (error) {
      // Revert optimistic update on error
      await fetchUsers()
      await fetchStats()
      toast.error('Failed to reject user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditClick = (user: PendingUser) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department || '',
      prn: user.prn || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return
    
    setEditLoading(true)

    // Check for unique PRN
    if (editingUser.prn) {
      const { data: existingPrnUser } = await supabase
        .from('users')
        .select('id, name')
        .eq('prn', editingUser.prn)
        .neq('id', editingUser.id) // Exclude current user
        .single()
        
      if (existingPrnUser) {
        toast.error(`PRN ${editingUser.prn} is already assigned to ${existingPrnUser.name}`)
        setEditLoading(false)
        return
      }
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          userId: editingUser.id,
          name: editingUser.name,
          department: editingUser.department,
          prn: editingUser.prn
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update user')
      }

      toast.success('User updated successfully')
      setShowEditModal(false)
      fetchUsers() // Refresh list
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    } finally {
      setEditLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      default:
        return 'text-muted-foreground bg-muted/10 border-muted/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || user.approval_status === filterStatus
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="gradient-card animate-pulse">
            <div className="h-6 bg-muted/20 rounded w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted/20 rounded w-1/2"></div>
              <div className="h-4 bg-muted/20 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-4">User Approvals</h1>
        <p className="text-muted-foreground">Manage student access to the platform</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Live updates enabled' : 'Using fallback polling'}
          </span>
          {updateCount > 0 && (
            <span className="text-xs text-blue-400">
              ({updateCount} updates)
            </span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold gradient-text mb-1">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold gradient-text-secondary mb-1">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{stats.approved}</div>
          <div className="text-sm text-muted-foreground">Approved</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">{stats.rejected}</div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <div className="gradient-card text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Users Found</h3>
            <p className="text-muted-foreground">No users match your current filters.</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="gradient-card">
              <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                    <h3 className="text-lg md:text-xl font-bold text-foreground truncate max-w-[200px] md:max-w-none">
                      {user.name}
                    </h3>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.approval_status)}`}>
                      {getStatusIcon(user.approval_status)}
                      <span className="capitalize">{user.approval_status}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="truncate max-w-[150px] md:max-w-none">{user.email}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                    {/* Show PRN for pending users */}
                    {user.prn && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                        <span className="text-xs font-mono font-semibold text-primary">PRN: {user.prn}</span>
                      </div>
                    )}
                    {/* Show Department for pending users */}
                    {user.department && (
                      <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded">
                        <span className="text-xs font-semibold text-blue-400">{user.department}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-4">
                    {user.github_url && (
                      <a 
                        href={user.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer underline hover:no-underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('GitHub link clicked:', user.github_url)
                        }}
                      >
                        <Github className="h-4 w-4" />
                        <span>GitHub</span>
                      </a>
                    )}
                    {user.linkedin_url && (
                      <a 
                        href={user.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer underline hover:no-underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('LinkedIn link clicked:', user.linkedin_url)
                        }}
                      >
                        <Linkedin className="h-4 w-4" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {user.instagram_url && (
                      <a 
                        href={user.instagram_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer underline hover:no-underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('Instagram link clicked:', user.instagram_url)
                        }}
                      >
                        <Instagram className="h-4 w-4" />
                        <span>Instagram</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground w-full md:w-auto justify-between md:justify-start">
                  <span className="flex items-center gap-1">
                    <Flame className="h-3 w-3" />
                    {user.streak || 0} streak
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {user.points || 0} points
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <Button
                    onClick={() => fetchUserProfile(user.id)}
                    variant="outline"
                    className="gradient-button-secondary flex-1 md:flex-none text-xs md:text-sm"
                    size="sm"
                  >
                    <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    View
                  </Button>
                  
                  {currentUserRole === 'super_admin' && (
                   <Button
                    onClick={() => handleEditClick(user)}
                    variant="outline"
                    className="gradient-button-secondary flex-1 md:flex-none text-xs md:text-sm"
                    size="sm"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  )}
                  
                  {user.approval_status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleApprove(user.id)}
                        disabled={actionLoading === user.id}
                        className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20"
                      >
                        {actionLoading === user.id ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => setSelectedUser(user)}
                        variant="outline"
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {user.approval_status === 'approved' && (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Approved</span>
                    </div>
                  )}
                  
                  {user.approval_status === 'rejected' && (
                    <div className="flex items-center gap-1 text-red-400">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Rejected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="gradient-card max-w-md w-full relative">
            <h3 className="text-lg font-bold text-foreground mb-4">Reject User</h3>
            <p className="text-muted-foreground mb-4">
              Please provide a reason for rejecting {selectedUser.name}:
            </p>
            <Input
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="simple-input mb-4"
            />
            <div className="flex gap-3">
              <Button
                onClick={() => handleReject(selectedUser.id)}
                disabled={actionLoading === selectedUser.id}
                className="gradient-button-secondary flex-1 relative z-10"
              >
                {actionLoading === selectedUser.id ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Reject User'
                )}
              </Button>
              <Button
                onClick={() => {
                  setSelectedUser(null)
                  setRejectionReason('')
                }}
                variant="outline"
                className="flex-1 relative z-10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && userProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4">
          <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">User Profile</h2>
                <Button
                  onClick={() => setShowProfileModal(false)}
                  variant="ghost"
                  size="sm"
                  className="relative z-10"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-lg font-semibold">{userProfile.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-lg">{userProfile.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Username</label>
                    <p className="text-lg">@{userProfile.username || 'Not set'}</p>
                  </div>
                  {/* Show PRN in profile modal */}
                  {userProfile.prn && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">PRN Number</label>
                      <p className="text-lg font-mono bg-muted px-2 py-1 rounded">{userProfile.prn}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <p className="text-lg capitalize">{userProfile.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(userProfile.approval_status)}`}>
                      {getStatusIcon(userProfile.approval_status)}
                      <span className="ml-1 capitalize">{userProfile.approval_status}</span>
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                {(userProfile.department || userProfile.mobile_number || userProfile.bio) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userProfile.department && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Department</label>
                          <p className="text-lg">{userProfile.department}</p>
                        </div>
                      )}
                      {userProfile.mobile_number && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Mobile</label>
                          <p className="text-lg">{userProfile.mobile_number}</p>
                        </div>
                      )}
                    </div>
                    {userProfile.bio && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-muted-foreground">Bio</label>
                        <p className="text-lg bg-muted p-3 rounded-lg">{userProfile.bio}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Social Links */}
                {(userProfile.github_url || userProfile.linkedin_url || userProfile.instagram_url) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Social Links</h3>
                    <div className="space-y-2">
                      {userProfile.github_url && (
                        <a 
                          href={userProfile.github_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer underline hover:no-underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Github className="h-4 w-4" />
                          <span className="truncate max-w-xs">{userProfile.github_url}</span>
                        </a>
                      )}
                      {userProfile.linkedin_url && (
                        <a 
                          href={userProfile.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer underline hover:no-underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Linkedin className="h-4 w-4" />
                          <span className="truncate max-w-xs">{userProfile.linkedin_url}</span>
                        </a>
                      )}
                      {userProfile.instagram_url && (
                        <a 
                          href={userProfile.instagram_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors cursor-pointer underline hover:no-underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Instagram className="h-4 w-4" />
                          <span className="truncate max-w-xs">{userProfile.instagram_url}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Activity Stats</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{userProfile.streak || 0}</div>
                      <div className="text-sm text-muted-foreground">Streak</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{userProfile.points || 0}</div>
                      <div className="text-sm text-muted-foreground">Points</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{userProfile.badges?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Badges</div>
                    </div>
                  </div>
                </div>

                {/* Approval Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Approval Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ml-2 ${getStatusColor(userProfile.approval_status)}`}>
                        {getStatusIcon(userProfile.approval_status)}
                        <span className="ml-1 capitalize">{userProfile.approval_status}</span>
                      </span>
                    </div>
                    {userProfile.approved_by && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Approved By</label>
                        <p className="text-lg">{userProfile.approved_by}</p>
                      </div>
                    )}
                    {userProfile.approved_at && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Approved At</label>
                        <p className="text-lg">{new Date(userProfile.approved_at).toLocaleString()}</p>
                      </div>
                    )}
                    {userProfile.rejection_reason && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Rejection Reason</label>
                        <p className="text-lg bg-red-500/10 text-red-400 p-3 rounded-lg">{userProfile.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timestamps */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="text-lg">{new Date(userProfile.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="text-lg">{new Date(userProfile.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowProfileModal(false)}
                  className="gradient-button"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="gradient-card max-w-md w-full relative">
            <h3 className="text-lg font-bold text-foreground mb-4">Edit User Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <Input
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="simple-input mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Department</label>
                 <Input
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="simple-input mt-1"
                  placeholder="e.g. Computer Engineering"
                />
              </div>

               <div>
                <label className="text-sm font-medium text-muted-foreground">PRN</label>
                 <Input
                  value={editingUser.prn || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, prn: e.target.value })}
                  className="simple-input mt-1"
                  placeholder="e.g. 12345678"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleUpdateUser}
                disabled={editLoading}
                className="gradient-button flex-1"
              >
                {editLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Save Changes'
                )}
              </Button>
              <Button
                onClick={() => setShowEditModal(false)}
                variant="outline"
                className="flex-1"
                disabled={editLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
