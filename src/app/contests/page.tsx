'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  Trophy,
  Target,
  Code,
  Play,
  CheckCircle,
  XCircle,
  Calendar,
  Sparkles,
  Zap,
  Timer,
  Crown,
  EyeOff,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface Contest {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string
  is_active: boolean
  problems: any[]
  participants: number
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const [registeredContests, setRegisteredContests] = useState<Set<string>>(new Set())
  const [registering, setRegistering] = useState<string | null>(null)
  const [showArchive, setShowArchive] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'ended'>('all')

  // Live timer for all countdowns
  const [now, setNow] = useState(new Date())

  // Fetch Top Users for Sidebar
  const [topUsers, setTopUsers] = useState<any[]>([])

  useEffect(() => {
    const fetchTopUsers = async () => {
      try {
        const res = await fetch('/api/leaderboard?limit=5')
        const data = await res.json()
        if (data.success && data.data) {
          setTopUsers(data.data.slice(0, 5))
        }
      } catch (e) {
        console.error('Failed to fetch top users', e)
      }
    }
    fetchTopUsers()
  }, [])

  useEffect(() => {
    fetchContests()
    // Fire-and-forget cleanup of ended contests (>1 day) - Disabled to preserve history
    // fetch('/api/contests/cleanup', { method: 'POST' }).catch(() => {})

    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchContests = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select(`
          *,
          problems:contest_problems(
            problem:problems(*)
          )
        `)
        .order('start_time', { ascending: false })

      if (error) throw error
      setContests(data || [])
    } catch (error) {
      console.error('Error fetching contests:', error)
      toast.error('Failed to load contests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [contests])

  const fetchRegistrations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('contest_registrations')
        .select('contest_id')
        .eq('user_id', user.id)

      if (data) {
        setRegisteredContests(new Set(data.map(r => r.contest_id)))
      }
    } catch (e) {
      console.error('Failed to load registrations', e)
    }
  }

  const handleRegister = async (contestId: string) => {
    setRegistering(contestId)
    try {
      const res = await fetch(`/api/contests/${contestId}/register`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Successfully registered!')
        setRegisteredContests(prev => new Set([...prev, contestId]))
      } else {
        toast.error(data.error || 'Registration failed')
        if (data.message === 'Already registered') {
          setRegisteredContests(prev => new Set([...prev, contestId]))
        }
      }
    } catch (e) {
      toast.error('Registration failed')
    } finally {
      setRegistering(null)
    }
  }

  const handleUnregister = async (contestId: string) => {
    if (!confirm('Are you sure you want to unregister?')) return
    setRegistering(contestId)
    try {
      const res = await fetch(`/api/contests/${contestId}/register`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Unregistered')
        setRegisteredContests(prev => {
          const next = new Set(prev)
          next.delete(contestId)
          return next
        })
      } else {
        toast.error(data.error || 'Failed to unregister')
      }
    } catch (e) {
      toast.error('Failed to unregister')
    } finally {
      setRegistering(null)
    }
  }

  const getContestStatus = (contest: Contest) => {
    const start = new Date(contest.start_time)
    const end = new Date(contest.end_time)

    // Helper to format duration
    const formatDuration = (ms: number) => {
      const seconds = Math.floor((ms / 1000) % 60)
      const minutes = Math.floor((ms / (1000 * 60)) % 60)
      const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
      const days = Math.floor(ms / (1000 * 60 * 60 * 24))

      if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    if (now < start) {
      return {
        status: 'upcoming' as const,
        color: 'from-blue-500/20 to-blue-600/20 text-blue-400 border-blue-500/30',
        badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/50',
        timeLeft: `Starts in ${formatDuration(start.getTime() - now.getTime())}`
      }
    }
    if (now >= start && now <= end) {
      return {
        status: 'active' as const,
        color: 'from-green-500/20 to-emerald-600/20 text-green-400 border-green-500/30',
        badgeColor: 'bg-green-500/10 text-green-400 border-green-500/50',
        timeLeft: `Ends in ${formatDuration(end.getTime() - now.getTime())}`
      }
    }
    return {
      status: 'ended' as const,
      color: 'from-gray-500/20 to-gray-600/20 text-gray-400 border-gray-500/30',
      badgeColor: 'bg-gray-500/10 text-gray-400 border-gray-500/50',
      timeLeft: 'Contest ended'
    }
  }

  const getContestAction = (contest: Contest, status: ReturnType<typeof getContestStatus>) => {
    const isRegistered = registeredContests.has(contest.id)
    const isProcessing = registering === contest.id

    if (status.status === 'ended') {
      return (
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 hover:text-emerald-400 border border-emerald-600/20 font-semibold"
            size="lg"
            onClick={() => router.push(`/contests/${contest.id}`)}
          >
            <Code className="h-4 w-4 mr-2" />
            Practice
          </Button>
          <Button
            className="flex-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 border border-amber-500/20 font-semibold"
            size="lg"
            onClick={() => router.push(`/contests/${contest.id}/leaderboard`)}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Hall of Fame
          </Button>
        </div>
      )
    }

    if (isRegistered) {
      if (status.status === 'active') {
        return (
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-none"
            size="lg"
            onClick={() => router.push(`/contests/${contest.id}`)}
          >
            <Play className="h-4 w-4 mr-2 fill-current" />
            Enter Contest
          </Button>
        )
      } else {
        return (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 cursor-default hover:bg-[#16A34A]/10"
              variant="outline"
              size="lg"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Registered
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
              onClick={() => handleUnregister(contest.id)}
              disabled={isProcessing}
              title="Unregister"
            >
              <XCircle className="h-5 w-5" />
            </Button>
          </div>
        )
      }
    }

    return (
      <Button
        className={`w-full font-semibold shadow-lg transition-transform ${status.status === 'active'
          ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-none'
          : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-none'
          }`}
        size="lg"
        onClick={() => handleRegister(contest.id)}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Clock className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Target className="h-4 w-4 mr-2" />
        )}
        {status.status === 'active' ? 'Register & Enter' : 'Register Now'}
      </Button>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /* 
    Filter Logic:
    1. 'active' / 'upcoming' -> Show normally.
    2. 'ended' -> 
       - Always show the LAST 2 ended contests (so recent history is visible).
       - Hide older ended contests unless 'showArchive' is true.
  */
  const filteredContests = contests.filter((c, index) => {
    // Basic status filter
    const status = getContestStatus(c).status
    if (filter !== 'all' && status !== filter) return false

    // If it's not ended, always show
    if (status !== 'ended') return true

    // If it is ended:
    // 1. Find all ended contests
    const endedContests = contests.filter(co => getContestStatus(co).status === 'ended')
    // 2. Sort them by end_time desc (most recent first) - assuming 'contests' is already sorted by start_time desc
    // We'll rely on the index within the 'ended' group
    const endedIndex = endedContests.findIndex(ec => ec.id === c.id) // This is O(N^2) but N is small

    // 3. Show if it's one of the first 2, OR if archive is enabled
    if (endedIndex < 2) return true

    return showArchive
  })

  // Loading Skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading contests...</p>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Subtle background - cleaner */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">

        {/* Header - Simple & Academic */}
        <div className="mb-8 border-b border-border/40 pb-6">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Department Assessments
          </h1>
          <p className="text-muted-foreground">
            Complete your assigned lab challenges and assessments below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content: Assessment List */}
          <div className="lg:col-span-3 space-y-6">

            {/* Assessment Grid */}
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {filteredContests.map((contest, index) => {
                  const status = getContestStatus(contest)
                  return (
                    <motion.div
                      key={contest.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <div className="group relative bg-[#0a0a0a]/80 border border-white/5 hover:border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-[#0a0a0a] flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="h-16 w-16 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-primary/20 transition-colors">
                            <Code className={`h-8 w-8 ${status.status === 'upcoming' ? 'text-blue-500' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{contest.name}</h3>
                              <Badge variant="secondary" className={`${status.badgeColor} text-[10px] uppercase tracking-wider`}>
                                {status.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(contest.start_time)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Timer className="h-3.5 w-3.5" />
                                {Math.round((new Date(contest.end_time).getTime() - new Date(contest.start_time).getTime()) / (1000 * 60))} mins
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-auto min-w-[140px]">
                          {getContestAction(contest, status)}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {filteredContests.length === 0 && (
                <div className="text-center py-12 bg-[#0a0a0a]/30 rounded-xl border border-white/5 border-dashed">
                  <p className="text-muted-foreground">
                    {showArchive ? "No past assessments found." : "No active assessments. Check the archive!"}
                  </p>
                </div>
              )}

              {/* Archive Toggle Filter */}
              <div className="flex justify-center mt-8">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchive(!showArchive)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-2"
                >
                  {showArchive ? (
                    <>
                      <EyeOff className="h-3 w-3" /> Hide Older Assessments
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3 w-3" /> View All Past Assessments
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* Student of the Month - Moved to Top */}
            <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/5">
              <div className="absolute top-0 right-0 p-3 opacity-20">
                <Crown className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-white mb-1">Student of the Month</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Top scorer gets featured on the college notice board.
              </p>
              <Button size="sm" variant="secondary" className="w-full text-xs h-8" onClick={() => router.push('/hall-of-fame')}>
                View Hall of Fame
              </Button>
            </div>

            {/* Global Ranking Card */}
            <div className="bg-[#0a0a0a]/80 border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  College Ranking
                </h3>
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => router.push('/leaderboard')}>
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {topUsers.length > 0 ? topUsers.map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className={`
                             w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                             ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        idx === 1 ? 'bg-slate-300/20 text-slate-300' :
                          idx === 2 ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-muted-foreground'}
                          `}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 truncate">
                      <div className="font-medium truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.points} pts</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-xs text-muted-foreground">
                    Loading rankings...
                  </div>
                )}
              </div>
            </div>

            {/* Rules Card - CodePVG Specific with Read More Sheet */}
            <div className="bg-[#0a0a0a]/80 border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  CodePVG Rules
                </h3>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground">
                      Read More
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>CodePVG Assessment Guidelines</SheetTitle>
                      <SheetDescription>
                        Standard operating procedures for all college assessments.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="space-y-6 mt-6">
                      <section className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" /> Attendance & Participation
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Attendance is marked automatically based on successful submissions. You must solve at least <strong>one problem</strong> to be marked present for the lab session.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" /> Academic Integrity
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          <strong>Zero Tolerance Policy:</strong> Use of AI tools (ChatGPT, Claude, etc.) or copying code from peers is strictly prohibited.
                          We use automated plagiarism detection (MOSS). Violators will receive 0 marks and a disciplinary strike.
                        </p>
                      </section>

                      <section className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-500" /> Scoring System
                        </h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-1">
                          <li>Test cases are weighted. Partial points are awarded for partial passes.</li>
                          <li>Time complexity matters. Optimized solutions score higher.</li>
                          <li>Semester Scope: Points accumulated here contribute 20% to your final Term Work.</li>
                        </ul>
                      </section>

                      <section className="space-y-2">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <Code className="h-4 w-4 text-purple-500" /> Environment
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Allowed Languages: C++, Java, Python, JavaScript.
                          Result is based on STDOUT. Ensure no extra print statements.
                        </p>
                      </section>

                      <div className="bg-muted/30 p-4 rounded-lg border border-border/50 text-xs text-muted-foreground">
                        <strong>Note:</strong> Committee decisions on manual reviews are final.
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong className="text-foreground">Attendance:</strong> Submission = Present.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong className="text-foreground">Plagiarism:</strong> Strict No-AI Policy.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span><strong className="text-foreground">Grading:</strong> Counts towards Term Work.</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
