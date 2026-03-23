'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  Search, 
  User, 
  Crown, 
  Shield,
  Eye,
  Flame,
  Trophy,
  Award,
  XCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  username: string
  email: string
  department?: string
  role: string
  approval_status: string
  streak: number
  points: number
  badges: string[]
  created_at: string
}

interface UserSearchProps {
  currentUserId: string
  currentUserRole?: string
}

export default function UserSearch({ currentUserId, currentUserRole }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const supabase = createClient()

  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setUsers([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search-user?q=${encodeURIComponent(searchTerm)}`)
      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Failed to search users')
        return
      }

      if (result.success && result.data) {
        const otherUsers = (result.data as User[]).filter(user => user.id !== currentUserId)
        const sortedUsers = otherUsers.sort((a, b) => {
          const roleOrder = { super_admin: 0, admin: 1, student: 2 }
          const roleA = roleOrder[a.role as keyof typeof roleOrder] ?? 2
          const roleB = roleOrder[b.role as keyof typeof roleOrder] ?? 2
          return roleA - roleB
        })
        setUsers(sortedUsers)
        if (sortedUsers.length === 0) {
          toast.info('No users found')
        }
      } else {
        setUsers([])
      }
    } catch (error) {
      toast.error('Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  const [targetUser, setTargetUser] = useState<{id: string, name: string} | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'make_admin' | 'remove_admin'>('make_admin')

  const initiateMakeAdmin = (userId: string, userName: string) => {
    setTargetUser({ id: userId, name: userName })
    setConfirmAction('make_admin')
    setShowConfirmModal(true)
  }

  const initiateRemoveAdmin = (userId: string, userName: string) => {
    setTargetUser({ id: userId, name: userName })
    setConfirmAction('remove_admin')
    setShowConfirmModal(true)
  }

  const handleConfirmAction = async () => {
    if (!targetUser) return
    setShowConfirmModal(false)
    setActionLoading(targetUser.id)
    
    const isMakeAdmin = confirmAction === 'make_admin'
    const endpoint = '/api/admin/change-role'
    const body = { userId: targetUser.id, newRole: isMakeAdmin ? 'admin' : 'student' }
    
    const loadingToast = toast.loading(isMakeAdmin ? 'Granting admin access...' : 'Revoking admin access...')

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await response.json()

      if (result.success) {
        toast.success(result.message || 'Role updated successfully', { id: loadingToast })
        if (result.data) {
           // Update local state if users are returned, or re-search
           searchUsers()
        } else {
           searchUsers()
        }
      } else {
        toast.error(result.error || 'Failed to update role', { id: loadingToast })
      }
    } catch (error) {
      toast.error('Failed to update role', { id: loadingToast })
    } finally {
      setActionLoading(null)
      setTargetUser(null)
    }
  }

  const getStatusBadge = (user: User) => {
    if (user.role === 'super_admin') return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20"><Crown className="w-3 h-3 mr-1" /> Super Admin</Badge>
    if (user.role === 'admin') return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>
    return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20"><User className="w-3 h-3 mr-1" /> Student</Badge>
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search Input Area */}
      <div className="flex gap-4 items-center bg-card/50 p-4 rounded-xl border border-border/40 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            className="pl-9 h-10 bg-background/50 border-white/10 focus-visible:ring-primary/20"
          />
        </div>
        <Button 
          onClick={searchUsers} 
          disabled={loading} 
          className="px-6 bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-none border border-transparent transition-all duration-200"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Search
        </Button>
      </div>

      {/* Results List */}
      {users.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
             <span>Found {users.length} users</span>
          </div>
          {users.map((user) => (
            <div key={user.id} className="group flex items-center justify-between p-4 bg-card/40 hover:bg-card/60 border border-border/40 rounded-xl transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${
                    user.role === 'super_admin' ? 'bg-orange-600 text-white' :
                    user.role === 'admin' ? 'bg-red-600 text-white' :
                    'bg-emerald-600 text-white'
                }`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{user.name}</h3>
                    {getStatusBadge(user)}
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{user.email}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                    <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-400" /> {user.streak}</span>
                    <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-yellow-400" /> {user.points}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/profile/${user.username}`}>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Eye className="h-4 w-4 mr-2" /> View Profile
                  </Button>
                </Link>
                
                {user.id !== currentUserId && currentUserRole === 'super_admin' && (
                   user.role === 'admin' ? (
                      <Button
                        onClick={() => initiateRemoveAdmin(user.id, user.name)}
                        disabled={actionLoading === user.id}
                        size="sm"
                        variant="destructive"
                        className="h-8 bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
                      >
                         <Shield className="h-3.5 w-3.5 mr-1" /> Remove Admin
                      </Button>
                   ) : (
                      <Button
                        onClick={() => initiateMakeAdmin(user.id, user.name)}
                        disabled={actionLoading === user.id}
                        size="sm"
                        className="h-8 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20"
                      >
                         <Crown className="h-3.5 w-3.5 mr-1" /> Make Admin
                      </Button>
                   )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        searchTerm && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No users found matching "{searchTerm}"</p>
          </div>
        )
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && targetUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mx-auto ${
                confirmAction === 'make_admin' 
                  ? 'bg-yellow-500/10 text-yellow-500' 
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {confirmAction === 'make_admin' ? <Crown className="h-8 w-8" /> : <Shield className="h-8 w-8" />}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {confirmAction === 'make_admin' ? 'Grant Admin Access' : 'Revoke Admin Status'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {confirmAction === 'make_admin' 
                  ? `Are you sure you want to make ${targetUser.name} an admin? They will have full access to manage the platform.`
                  : `Are you sure you want to remove admin privileges from ${targetUser.name}? They will resume regular student access.`
                }
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowConfirmModal(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button 
                onClick={handleConfirmAction}
                className={`flex-1 ${
                  confirmAction === 'make_admin' 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
