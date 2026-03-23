'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Lock,
  LogIn,
  UserPlus,
  Code2,
  Trophy,
  Target,
  Users,
  Star,
  Zap,
  Crown
} from 'lucide-react'

interface LoginPromptProps {
  title?: string
  description?: string
  features?: string[]
  redirectPath?: string
}

export default function LoginPrompt({ 
  title = "Join codCampus to Continue",
  description = "Access coding problems, contests, and compete with other developers",
  features = [
    "Solve 100+ coding problems",
    "Participate in live contests", 
    "Track your progress and ranking",
    "Compete with other developers",
    "Earn points and achievements"
  ],
  redirectPath
}: LoginPromptProps) {
  const router = useRouter()

  const handleLogin = () => {
    const loginUrl = redirectPath 
      ? `/auth/login?redirect=${encodeURIComponent(redirectPath)}`
      : '/auth/login'
    router.push(loginUrl)
  }

  const handleSignup = () => {
    const signupUrl = redirectPath 
      ? `/auth/signup?redirect=${encodeURIComponent(redirectPath)}`
      : '/auth/signup'
    router.push(signupUrl)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Card className="glass-card border-primary/20">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <Code2 className="h-12 w-12 text-primary" />
                <Lock className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 bg-background rounded-full p-1" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold gradient-text mb-2">
              {title}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              {description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Features List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="flex-shrink-0">
                    {index === 0 && <Target className="h-5 w-5 text-green-400" />}
                    {index === 1 && <Trophy className="h-5 w-5 text-yellow-400" />}
                    {index === 2 && <Star className="h-5 w-5 text-blue-400" />}
                    {index === 3 && <Users className="h-5 w-5 text-purple-400" />}
                    {index === 4 && <Crown className="h-5 w-5 text-orange-400" />}
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">100+</div>
                <div className="text-xs text-muted-foreground">Problems</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">50+</div>
                <div className="text-xs text-muted-foreground">Contests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold gradient-text">1000+</div>
                <div className="text-xs text-muted-foreground">Users</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleSignup}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-12"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Create Account
              </Button>
              <Button 
                onClick={handleLogin}
                variant="outline" 
                className="flex-1 border-primary/30 hover:bg-primary/10 h-12"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </div>

            {/* Additional Info */}
            <div className="text-center pt-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium">Free to join</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Join thousands of developers improving their coding skills
              </p>
            </div>

            {/* Public Access Note */}
            <div className="text-center pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">
                You can still view the{' '}
                <Link href="/leaderboard" className="text-primary hover:underline">
                  leaderboard
                </Link>
                {' '}without an account
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}