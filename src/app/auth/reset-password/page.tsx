'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Eye, EyeOff, CheckCircle, XCircle, Code2, ArrowRight } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const initSession = async () => {
      // Check if we have the necessary tokens in the URL
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const type = searchParams.get('type')
      
      if (type !== 'recovery') {
        setError('Invalid reset link type. Please request a new password reset.')
        return
      }
      
      if (!accessToken || !refreshToken) {
        setError('Invalid reset link. Please request a new password reset.')
        return
      }

      try {
        // Set the session with the tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        
        if (error) {
          console.error('Session error:', error)
          setError('Failed to verify reset link. Please request a new one.')
        }
      } catch (err) {
        console.error('Session setup error:', err)
        setError('Failed to initialize password reset. Please try again.')
      }
    }
    
    initSession()
  }, [searchParams, supabase.auth])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        toast.success('Password updated successfully!')
      }
    } catch (error) {
      setError('Failed to update password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    router.push('/dashboard/student')
  }

  if (success) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="gradient-card">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-6">
                <Code2 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">codCampus</h1>
              </div>
              
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-4">
                Password Updated!
              </h2>
              
              <p className="text-muted-foreground mb-6">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Success!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your password has been updated and you&apos;re now signed in.
                </p>
              </div>

              <Button
                onClick={handleContinue}
                className="simple-button w-full"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="gradient-card">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-6">
                <Code2 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">codCampus</h1>
              </div>
              
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/10 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-400" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-4">
                Invalid Reset Link
              </h2>
              
              <p className="text-muted-foreground mb-6">
                {error}
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Error</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/auth/forgot-password" className="simple-button w-full text-center">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Request New Reset Link
                </Link>

                <Link href="/auth/login" className="gradient-button-secondary w-full text-center">
                  Back to Login
                </Link>
              </div>
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
              <Code2 className="h-10 w-10 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-4">
              Reset Password
            </h2>
            
            <p className="text-muted-foreground mb-6">
              Enter your new password below. Make sure it&apos;s secure and easy to remember.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  className="simple-input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  className="simple-input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full simple-button"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
