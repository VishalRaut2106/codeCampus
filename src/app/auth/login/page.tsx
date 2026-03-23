'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Eye, EyeOff, Code2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Check if user is already logged in and handle URL messages
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for URL messages
        const urlParams = new URLSearchParams(window.location.search)
        const message = urlParams.get('message')

        if (message === 'account-created') {
          toast.success('Account created successfully! Please log in to continue.')
        } else if (message === 'profile-incomplete') {
          toast.info('Account created! Profile setup will complete when you log in.')
        } else if (message === 'profile-pending') {
          toast.info('Account created! Please log in to complete your profile.')
        }

        // Quick session check
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          setCheckingAuth(false)
          return
        }

        // Validate session with getUser
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // User is already logged in, check their profile and redirect
          const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('role, approval_status, username, is_restricted')
            .eq('id', user.id)
            .single()

          // If database is not set up, fail gracefully
          if (profileError && (profileError.code === 'PGRST116' || profileError.message?.includes('relation "users" does not exist'))) {
            console.log('Database not set up yet')
            // Just continue - let user try to login normally
            setCheckingAuth(false)
            return
          }

          if (userProfile && !profileError) {
            if (userProfile.is_restricted || userProfile.approval_status === 'restricted') {
              // User is restricted, sign them out and show error
              await supabase.auth.signOut()
              toast.error('Banned by admin')
              // Don't return, let checkingAuth set to false to show login
            } else if (userProfile.approval_status === 'approved') {
              if (userProfile.role === 'admin') {
                router.push('/dashboard/admin')
              } else {
                router.push(`/profile/${userProfile.username}`)
              }
              return
            } else {
              router.push('/auth/pending-approval')
              return
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (data.user) {
        // Check user profile and approval status
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role, approval_status, username, is_restricted')
          .eq('id', data.user.id)
          .single()

        // If database is not set up, redirect to admin setup
        if (profileError && (profileError.code === 'PGRST116' || profileError.message?.includes('relation "users" does not exist'))) {
          toast.info('Database setup required. Redirecting to admin setup.')
          router.push('/dashboard/admin?tab=setup')
          return
        }

        if (userProfile && !profileError) {
          // Check for restriction first
          if (userProfile.is_restricted || userProfile.approval_status === 'restricted') {
            await supabase.auth.signOut()
            toast.error('Banned by admin')
            return
          }

          // Check approval status
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
            toast.success('Welcome back to the Matrix!')
            return
          }
        } else {
          // No profile found, redirect to pending approval
          toast.info('Your account is being set up. Please wait for admin approval.')
          router.push('/auth/pending-approval')
          return
        }
      }
    } catch {
      toast.error('Access denied. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="simple-card text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <Code2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">CodePVG</h1>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Checking authentication...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="simple-card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-6">
              <Code2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">CodePVG</h1>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="simple-input w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="simple-input w-full pr-15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-0 h-full px-4 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all duration-150 hover:bg-muted/50 rounded-r-md cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full simple-button"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-4">
            {/* Important Information */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">Important Information</h3>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>• New accounts require admin approval</li>
                <li>• Check your email for verification link</li>
                <li>• Contact admin if approval is delayed</li>
                <li>• PRN number is required for student accounts</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link href="/auth/forgot-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}