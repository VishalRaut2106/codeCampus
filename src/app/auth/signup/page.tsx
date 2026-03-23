'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { clientUserCreationService } from '@/lib/user-creation-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner'
import { Eye, EyeOff, Code2 } from 'lucide-react'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [prn, setPrn] = useState('')
  const [department, setDepartment] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    // PRN and Department are required for students
    if (!prn.trim()) {
      toast.error('PRN number is required')
      setLoading(false)
      return
    }
    
    if (!department.trim()) {
      toast.error('Department is required')
      setLoading(false)
      return
    }

    // Check if PRN already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('prn', prn.trim())
      .single()

    if (existingUser) {
      toast.error('This PRN is already registered. Please login.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            prn: prn.trim(),
            department: department.trim(),
          }
        }
      })

      if (error) {
        // Check if it's a user already exists error
        if (error.message.includes('already registered') || 
            error.message.includes('User already registered')) {
          toast.info('Account already exists. Please sign in instead.')
          router.push('/auth/login')
          return
        }
        
        toast.error(error.message)
        return
      }

        if (data.user) {
          // Show immediate success message
          toast.success('Account created successfully!')
          
          // Wait for auth session to be established
          await new Promise(resolve => setTimeout(resolve, 1500))
          
          // Try to create/verify profile
          try {
            
            const profileResult = await clientUserCreationService.createUserProfile({
              id: data.user.id,
              name: name.trim(),
              email: email.toLowerCase().trim(),
              role: 'student',
              prn: prn.trim(),
              department: department.trim()
            })
            
            if (profileResult.success) {
              toast.success(`Profile setup complete! (${profileResult.method}) Please check your email to verify your account.`)
              
              // Redirect to login with success message
              setTimeout(() => {
                router.push('/auth/login?message=account-created')
              }, 1000)
            } else {
              console.warn('Profile creation failed:', profileResult.error)
              
              // Check if it's a "already exists" scenario or duplicate
              if (profileResult.error?.includes('already exists') || 
                  profileResult.error?.includes('duplicate') ||
                  profileResult.method === 'direct_insert_duplicate') {
                toast.info('Account already exists. Redirecting to login...')
                setTimeout(() => {
                  router.push('/auth/login')
                }, 1000)
                return
              }
              
              // Show specific error message based on what failed
              if (profileResult.method === 'all_failed') {
                toast.error('Account created but profile setup failed. Please contact support.')
                setTimeout(() => {
                  router.push('/auth/login?message=profile-failed')
                }, 2000)
              } else {
                // Show warning but still redirect to login
                toast.warning(`Account created but profile needs attention. (${profileResult.method}) You can still try to log in.`)
                setTimeout(() => {
                  router.push('/auth/login?message=profile-incomplete')
                }, 2000)
              }
            }
          } catch (profileError) {
            console.error('Profile creation exception:', profileError)
            toast.warning('Account created successfully! Profile will be set up when you first log in.')
            setTimeout(() => {
              router.push('/auth/login?message=profile-pending')
            }, 1500)
          }
        }
    } catch {
      toast.error('Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
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
            <h2 className="text-xl font-semibold text-foreground mb-2">Create Account</h2>
            <p className="text-muted-foreground">Join our community of coding enthusiasts</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="simple-input w-full"
              />
            </div>

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
              <label htmlFor="prn" className="block text-sm font-medium text-foreground">
                PRN Number
              </label>
              <Input
                id="prn"
                type="text"
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
                placeholder="Enter your PRN number"
                required
                className="simple-input w-full"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="department" className="block text-sm font-medium text-foreground">
                Department
              </label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="simple-input w-full">
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI and Data Science">AI and Data Science</SelectItem>
                  <SelectItem value="CS">CS</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="ENTC">ENTC</SelectItem>
                </SelectContent>
              </Select>
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
                  placeholder="Create a password"
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
                  placeholder="Confirm your password"
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

            <Button
              type="submit"
              className="w-full simple-button"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
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