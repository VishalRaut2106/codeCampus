'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AdminApprovalService } from '@/lib/admin/approval-service'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Clock, CheckCircle, XCircle, ArrowRight, RefreshCw, Code2, Mail } from 'lucide-react'
// Removed debug components - no longer needed

export default function PendingApprovalPage() {
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()
  const approvalService = new AdminApprovalService()

  useEffect(() => {
    checkApprovalStatus()
    
    // Set up real-time subscription for approval status changes
    const subscription = supabase
      .channel('user-approval-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user?.id || ''}`
        },
        (payload) => {
          console.log('Approval status update received:', payload)
          checkApprovalStatus()
        }
      )
      .subscribe()
    
    // Fallback polling mechanism (every 15 seconds) for better reliability
    const interval = setInterval(checkApprovalStatus, 15000)
    
    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [user?.id])

  const checkApprovalStatus = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/auth/login')
        return
      }

      setUser(currentUser)
      
      // Get approval status from database
      const status = await approvalService.getUserApprovalStatus(currentUser.id)
      setApprovalStatus(status)

      if (status === 'approved') {
        toast.success('Your account has been approved!')
        router.push('/dashboard/student')
      }
    } catch (error) {
      console.error('Error checking approval status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    setLoading(true)
    checkApprovalStatus()
  }

  const handleBackToLogin = async () => {
    if (logoutLoading) return // Prevent multiple clicks
    
    setLogoutLoading(true)
    
    try {
      // Sign out the user first
      await supabase.auth.signOut()
      // Then redirect to login
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Error signing out:', error)
      // Still redirect to login even if signout fails
      window.location.href = '/auth/login'
    } finally {
      setLogoutLoading(false)
    }
  }

  const getStatusIcon = () => {
    switch (approvalStatus) {
      case 'approved':
        return <CheckCircle className="h-16 w-16 text-green-400" />
      case 'rejected':
        return <XCircle className="h-16 w-16 text-red-400" />
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-400" />
      default:
        return <Clock className="h-16 w-16 text-muted-foreground" />
    }
  }

  const getStatusMessage = () => {
    switch (approvalStatus) {
      case 'approved':
        return {
          title: 'Account Approved!',
          message: 'Your account has been approved. You can now access all features of the platform.',
          action: 'Continue to Dashboard'
        }
      case 'rejected':
        return {
          title: 'Account Rejected',
          message: 'Unfortunately, your account has been rejected. Please contact support for more information.',
          action: 'Contact Support'
        }
      case 'pending':
        return {
          title: 'Pending Approval',
          message: 'Your account is currently under review. Our admin team will review your application and notify you once approved.',
          action: 'Check Status'
        }
      default:
        return {
          title: 'Loading...',
          message: 'Checking your approval status...',
          action: 'Refresh'
        }
    }
  }

  const statusMessage = getStatusMessage()

  if (loading && !approvalStatus) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="gradient-card">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-4">Checking Status...</h2>
              <p className="text-muted-foreground">Please wait while we check your approval status.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="gradient-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <Code2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">codCampus</h1>
            </div>
            
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              {getStatusIcon()}
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-4">
              {statusMessage.title}
            </h2>
            
            <p className="text-muted-foreground mb-6">
              {statusMessage.message}
            </p>
          </div>

          {approvalStatus === 'pending' && (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Under Review</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Our admin team is reviewing your application. This usually takes 24-48 hours.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="simple-button w-full"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Checking...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Check Status</span>
                    </div>
                  )}
                </Button>

                <button 
                  onClick={handleBackToLogin}
                  disabled={logoutLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: logoutLoading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    opacity: logoutLoading ? 0.6 : 1,
                    zIndex: 9999,
                    position: 'relative'
                  }}
                >
                  {logoutLoading ? 'Signing out...' : 'Back to Login'}
                </button>
              </div>
            </div>
          )}

          {approvalStatus === 'approved' && (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Approved!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your account has been approved. You can now access all features.
                </p>
              </div>

              <Button
                onClick={() => router.push('/dashboard/student')}
                className="simple-button w-full"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue to Dashboard
              </Button>
            </div>
          )}

          {approvalStatus === 'rejected' && (
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Rejected</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your account has been rejected. Please contact support for more information.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/contact" className="simple-button w-full text-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Link>

                <Link href="/auth/signup" className="gradient-button-secondary w-full text-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Sign Up Again
                </Link>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Need help? Contact our support team.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact Support
                </Link>
                <button
                  onClick={handleBackToLogin}
                  disabled={logoutLoading}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {logoutLoading ? 'Signing out...' : 'Back to Login'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
