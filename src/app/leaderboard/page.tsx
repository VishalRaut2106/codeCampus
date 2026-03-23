'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLeaderboardData } from '@/lib/leaderboard-data'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Trophy, 
  Flame, 
  Award, 
  Crown, 
  UserPlus,
  LogIn,
  Medal,
  Star
} from 'lucide-react'

interface User {
  id: string
  name: string
  points: number
  streak: number
  badges: string[]
  rank: number
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    let refreshInterval: NodeJS.Timeout

    const fetchUsers = async () => {
      try {
        if (!isMounted) return
        
        const response = await fetch('/api/leaderboard', { cache: 'no-store' })
        const result = await response.json()

        if (!isMounted) return

        if (result.success && result.data && result.data.length > 0) {
          setUsers(result.data)
          setError(null)
        } else {
          if (result.method === 'direct_query' && (!result.data || result.data.length === 0)) {
             setUsers(getLeaderboardData()) // Fallback to demo data
             setError('Showing demo data')
          } else {
             setUsers([])
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        if (isMounted) {
          setError('Failed to connect. Showing demo data.')
          setUsers(getLeaderboardData())
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchUsers()

    // Real-time subscription
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users', filter: 'role=eq.student' },
        () => {
          clearTimeout(refreshInterval)
          refreshInterval = setTimeout(() => {
            if (isMounted) fetchUsers()
          }, 500)
        }
      )
      .subscribe()

    const periodicRefresh = setInterval(() => {
      if (isMounted && !loading) fetchUsers()
    }, 30000)

    return () => {
      isMounted = false
      clearTimeout(refreshInterval)
      clearInterval(periodicRefresh)
      supabase.removeChannel(channel)
    }
  }, [])

  const topThree = users.slice(0, 3)
  const restUsers = users.slice(3)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground">Top performers and coding achievers.</p>
          </div>
          {error && (
            <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
              {error}
            </span>
          )}
        </div>

        {/* Podium Section - Simple & Static */}
        {topThree.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 items-end">
             {/* 2nd Place */}
             {topThree[1] && (
               <div className="order-2 md:order-1 flex flex-col items-center">
                 <div className="w-full bg-muted/30 border border-border p-6 rounded-lg flex flex-col items-center relative">
                    <div className="absolute -top-6 w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold border-4 border-background">2</div>
                    <div className="mt-6 text-center">
                      <div className="font-bold text-lg">{topThree[1].name}</div>
                      <div className="text-primary font-bold">{topThree[1].points} pts</div>
                      <div className="text-xs text-muted-foreground mt-1">{topThree[1].streak} day streak</div>
                    </div>
                 </div>
               </div>
             )}

             {/* 1st Place */}
             {topThree[0] && (
               <div className="order-1 md:order-2 flex flex-col items-center">
                 <div className="w-full bg-primary/5 border border-primary/20 p-8 rounded-lg flex flex-col items-center relative shadow-lg shadow-primary/5 scale-105">
                    <div className="absolute -top-8 text-yellow-500"><Crown className="h-8 w-8 fill-current" /></div>
                    <div className="text-center mt-2">
                      <div className="font-bold text-xl">{topThree[0].name}</div>
                      <div className="text-2xl text-primary font-bold my-1">{topThree[0].points} pts</div>
                      <div className="flex justify-center gap-1 my-2">
                        {topThree[0].badges.slice(0, 3).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                 </div>
               </div>
             )}

             {/* 3rd Place */}
             {topThree[2] && (
               <div className="order-3 md:order-3 flex flex-col items-center">
                 <div className="w-full bg-muted/30 border border-border p-6 rounded-lg flex flex-col items-center relative">
                    <div className="absolute -top-6 w-12 h-12 rounded-full bg-orange-200 text-orange-800 flex items-center justify-center font-bold border-4 border-background">3</div>
                    <div className="mt-6 text-center">
                      <div className="font-bold text-lg">{topThree[2].name}</div>
                      <div className="text-primary font-bold">{topThree[2].points} pts</div>
                      <div className="text-xs text-muted-foreground mt-1">{topThree[2].streak} day streak</div>
                    </div>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* List View - Simple Table Style */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b border-border text-sm font-medium text-muted-foreground">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 md:col-span-6">User</div>
            <div className="col-span-3 md:col-span-2 text-right">Points</div>
            <div className="col-span-3 md:col-span-3 text-right">Streak</div>
          </div>
          
          <div className="divide-y divide-border">
            {restUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                <div className="col-span-1 text-center font-mono text-muted-foreground">
                  {user.rank}
                </div>
                <div className="col-span-5 md:col-span-6 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <span className="truncate">{user.name}</span>
                </div>
                <div className="col-span-3 md:col-span-2 text-right font-bold text-primary">
                  {user.points}
                </div>
                <div className="col-span-3 md:col-span-3 text-right text-muted-foreground flex items-center justify-end gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {user.streak}
                </div>
              </div>
            ))}

            {restUsers.length === 0 && topThree.length === 0 && !loading && (
              <div className="p-8 text-center text-muted-foreground">
                No users found.
              </div>
            )}
          </div>
        </div>

        {/* Auth CTA */}
        {!user && (
          <div className="mt-12 text-center p-8 bg-muted/20 rounded-lg border border-border">
            <h2 className="text-xl font-semibold mb-2">Join the Leaderboard</h2>
            <p className="text-muted-foreground mb-4">Create an account to track your progress and compete.</p>
            <div className="flex justify-center gap-4">
               <Link href="/auth/signup">
                 <Button>Create Account</Button>
               </Link>
               <Link href="/auth/login">
                 <Button variant="outline">Sign In</Button>
               </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}