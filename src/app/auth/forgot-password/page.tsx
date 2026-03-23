'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ArrowLeft, Mail, CheckCircle, Code2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        toast.error(error.message)
      } else {
        setEmailSent(true)
        toast.success('Password reset email sent! Check your inbox.')
      }
    } catch (error) {
      toast.error('Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="gradient-card">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-6">
                <Code2 className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">CodePVG</h1>
              </div>
              
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-4">
                Check Your Email
              </h2>
              
              <p className="text-muted-foreground mb-6">
                We&apos;ve sent a password reset link to <span className="font-semibold text-foreground">{email}</span>. 
                Please check your email and click the link to reset your password.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">What to do next:</h3>
                <ol className="text-sm text-muted-foreground space-y-1">
                  <li>1. Check your email inbox</li>
                  <li>2. Look for an email from CodePVG</li>
                  <li>3. Click the password reset link</li>
                  <li>4. Create a new password</li>
                </ol>
              </div>

              <div className="flex flex-col gap-3 h-max">
                <Button
                  onClick={() => setEmailSent(false)}
                  className="gradient-button-secondary w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Another Email
                </Button>

                <Link href="/auth/login" className="simple-button tracking-wide font-medium text-sm px-3 py-2.5 rounded-sm  w-full  text-center">
                  
                  Back to Login
                </Link>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or try again.
                </p>
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
              <h1 className="text-2xl font-bold">CodePVG</h1>
            </div>
            
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Mail className="h-10 w-10 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-4">
              Forgot Password?
            </h2>
            
            <p className="text-muted-foreground mb-6">
              No worries! Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
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

            <Button
              type="submit"
              className="w-full simple-button"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Send Reset Link</span>
                </div>
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
