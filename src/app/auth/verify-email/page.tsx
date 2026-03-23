'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Mail, Clock } from 'lucide-react'

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    handleEmailVerification()
  }, [])

  const handleEmailVerification = async () => {
    try {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (token && type === 'signup') {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        })

        if (error) {
          setError('Invalid or expired verification link')
          setLoading(false)
          return
        }

        if (data.user) {
          setVerified(true)
          toast.success('Email verified successfully!')
          
          // Check if user needs admin approval
          const { data: userProfile } = await supabase
            .from('users')
            .select('approval_status, role')
            .eq('id', data.user.id)
            .single()

          if (userProfile?.approval_status === 'pending') {
            // Redirect to pending approval page
            setTimeout(() => {
              router.push('/auth/pending-approval')
            }, 2000)
          } else if (userProfile?.approval_status === 'approved') {
            // Redirect to appropriate dashboard based on role
            setTimeout(() => {
              if (userProfile.role === 'admin') {
                router.push('/dashboard/admin')
              } else {
                router.push('/dashboard/student')
              }
            }, 2000)
          } else {
            // Default redirect
            setTimeout(() => {
              router.push('/dashboard')
            }, 2000)
          }
        }
      } else {
        setError('Invalid verification link')
      }
    } catch (err) {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: searchParams.get('email') || ''
      })

      if (error) {
        toast.error('Failed to resend verification email')
      } else {
        toast.success('Verification email sent!')
      }
    } catch (err) {
      toast.error('Failed to resend verification email')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="simple-card text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Verifying Email...</h2>
            <p className="text-muted-foreground">Please wait while we verify your email address.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="simple-card text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-500">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={() => router.push('/auth/login')} className="w-full">
                Go to Login
              </Button>
              <Button onClick={resendVerification} variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Resend Verification
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="simple-card text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-500">Email Verified!</h2>
            <p className="text-muted-foreground mb-6">
              Your email has been successfully verified. You will be redirected shortly.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="simple-card text-center">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Check Your Email</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>
          <div className="space-y-3">
            <Button onClick={() => router.push('/auth/login')} className="w-full">
              Go to Login
            </Button>
            <Button onClick={resendVerification} variant="outline" className="w-full">
              <Mail className="h-4 w-4 mr-2" />
              Resend Verification
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}