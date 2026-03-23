'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import ResizableContestEditor from '@/components/ResizableContestEditor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Trophy,
  Crown
} from 'lucide-react'

interface Problem {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  time_limit: number
  memory_limit: number
  test_cases: any[]
}

interface Contest {
  id: string
  name: string
  start_time: string
  end_time: string
}

export default function ContestPage() {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null)
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [problems, setProblems] = useState<Problem[]>([])
  const [contest, setContest] = useState<Contest | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  // Custom hook-like logic for countdown
  const [timeLeft, setTimeLeft] = useState<{ type: 'starts' | 'ends' | 'ended', str: string }>({ type: 'ended', str: '--:--:--' })

  useEffect(() => {
    if (!contest) return

    const calculateTime = () => {
      const n = new Date()
      const s = new Date(contest.start_time)
      const e = new Date(contest.end_time)

      if (n < s) {
        // Starts in future
        const diff = s.getTime() - n.getTime()
        return { type: 'starts' as const, diff }
      } else if (n < e) {
        // Active
        const diff = e.getTime() - n.getTime()
        return { type: 'ends' as const, diff }
      } else {
        // Ended
        return { type: 'ended' as const, diff: 0 }
      }
    }

    const formatDiff = (ms: number) => {
      const seconds = Math.floor((ms / 1000) % 60)
      const minutes = Math.floor((ms / (1000 * 60)) % 60)
      const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
      const days = Math.floor(ms / (1000 * 60 * 60 * 24))

      if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    const timer = setInterval(() => {
      const status = calculateTime()
      setTimeLeft({
        type: status.type,
        str: status.type === 'ended' ? 'Ended' : formatDiff(status.diff)
      })
    }, 1000)

    // Initial call
    const status = calculateTime()
    setTimeLeft({
      type: status.type,
      str: status.type === 'ended' ? 'Ended' : formatDiff(status.diff)
    })

    return () => clearInterval(timer)
  }, [contest])

  useEffect(() => {
    if (params.id) {
      fetchContest()
    }
  }, [params.id])

  const fetchContest = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select(`
          *,
          problems:contest_problems(
            order_index,
            points,
            problem:problems(*)
          )
        `)
        .eq('id', params.id)
        .single()

      if (error || !data) {
        toast.error('Contest not found')
        router.push('/contests')
        return
      }

      setContest(data)
      const contestProblems = data.problems
        ?.map((cp: any) => cp.problem)
        .filter((p: any) => p !== null)
        .sort((a: any, b: any) => {
          const aIndex = data.problems.find((cp: any) => cp.problem?.id === a.id)?.order_index || 0
          const bIndex = data.problems.find((cp: any) => cp.problem?.id === b.id)?.order_index || 0
          return aIndex - bIndex
        }) || []

      setProblems(contestProblems)

      if (contestProblems.length > 0) {
        setSelectedProblem(contestProblems[0])
        setCurrentProblemIndex(0)
      }
    } catch (error) {
      console.error('Error fetching contest:', error)
      toast.error('Failed to load contest')
      router.push('/contests')
    } finally {
      setLoading(false)
    }
  }

  const goToNextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      const nextIndex = currentProblemIndex + 1
      setCurrentProblemIndex(nextIndex)
      setSelectedProblem(problems[nextIndex])
      toast.info(`Problem ${nextIndex + 1}`)
    }
  }

  const goToPreviousProblem = () => {
    if (currentProblemIndex > 0) {
      const prevIndex = currentProblemIndex - 1
      setCurrentProblemIndex(prevIndex)
      setSelectedProblem(problems[prevIndex])
      toast.info(`Problem ${prevIndex + 1}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00C896]"></div>
      </div>
    )
  }

  // Contest Logic and Countdown
  const now = new Date()
  const endTime = contest?.end_time ? new Date(contest.end_time) : null
  const startTime = contest?.start_time ? new Date(contest.start_time) : null



  // View: Upcoming Contest
  if (timeLeft.type === 'starts') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="relative">
            <Trophy className="h-32 w-32 text-primary mx-auto opacity-20 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-mono font-bold">{timeLeft.str}</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold">Contest Starting Soon</h1>
          <p className="text-muted-foreground">
            Get ready! The problems will be revealed when the timer hits zero.
          </p>
          <Button variant="outline" onClick={() => router.push('/contests')} className="w-full">
            Back to Contests
          </Button>
        </div>
      </div>
    )
  }

  // View: Ended Contest
  if (timeLeft.type === 'ended') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6">
          <Trophy className="h-24 w-24 text-muted-foreground mx-auto opacity-50" />
          <h1 className="text-3xl font-bold">Contest Ended</h1>
          <p className="text-muted-foreground">
            This contest has ended. Check the leaderboard to see the winners!
          </p>
          <Button onClick={() => router.push(`/contests/${params.id}/leaderboard`)} className="w-full" size="lg">
            View Final Leaderboard
          </Button>
          <Button variant="outline" onClick={() => router.push('/contests')} className="w-full">
            Back to Contests
          </Button>
        </div>
      </div>
    )
  }

  // Dashboard view (Active)
  if (!selectedProblem) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-zinc-900/40 border border-white/5 p-6 md:p-8 rounded-xl relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="h-48 w-48" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 px-3 py-1 animate-pulse">
                        Live Contest
                      </Badge>
                      {endTime && (
                        <span className="text-sm text-muted-foreground">Ends today at {endTime.toLocaleTimeString()}</span>
                      )}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">{contest?.name || 'codCampus Challenge'}</h1>
                    <p className="text-xl text-muted-foreground mt-2 max-w-2xl">
                      Solve {problems.length} problems within the time limit to climb the leaderboard.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => router.push(`/contests/${params.id}/leaderboard`)} variant="outline" className="gap-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      Live Leaderboard
                    </Button>
                  </div>
                </div>

                {/* Timer Card */}
                <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/10 min-w-[280px] text-center">
                  <p className="text-sm text-muted-foreground mb-1 uppercase tracking-wider font-medium">Time Remaining</p>
                  <div className="text-4xl font-mono font-bold tracking-wider text-primary tabular-nums">
                    {timeLeft.str}
                  </div>
                  <div className="flex justify-center gap-8 mt-2 text-xs text-muted-foreground">
                    <span>HRS</span>
                    <span>MIN</span>
                    <span>SEC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Problems List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Problems <Badge variant="secondary" className="rounded-full">{problems.length}</Badge>
              </h2>

              <div className="bg-zinc-900/50 border border-white/5 rounded-xl overflow-hidden">
                <div className="divide-y divide-white/5">
                  {problems.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No problems available in this contest yet.
                    </div>
                  ) : (
                    problems.map((problem, idx) => (
                      <div key={problem.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => {
                        setSelectedProblem(problem)
                        setCurrentProblemIndex(idx)
                      }}>
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-lg text-muted-foreground group-hover:text-primary transition-colors">
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{problem.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className={`capitalize ${problem.difficulty === 'easy' ? 'text-green-400 border-green-500/30' :
                                problem.difficulty === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                                  'text-red-400 border-red-500/30'
                                }`}>
                                {problem.difficulty}
                              </Badge>
                              <span>•</span>
                              <span>{problem.points} points</span>
                            </div>
                          </div>
                        </div>

                        <Button>
                          Solve
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Your Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Solved</span>
                    <span className="font-medium">0 / {problems.length}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-0" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rank</span>
                    <span className="font-medium">- / -</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                <h3 className="font-semibold mb-2">Rules</h3>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                  <li>Contest ends strictly at the closing time.</li>
                  <li>Ranking is based on Total Score only.</li>
                  <li>Ties are broken by who finished earlier.</li>
                  <li>Rate limit: 1 submission every 12 seconds.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Editor View
  return (
    <ResizableContestEditor
      problem={selectedProblem}
      contestId={params.id as string}
      isContestActive={true}
      currentProblemIndex={currentProblemIndex}
      totalProblems={problems.length}
      onPreviousProblem={goToPreviousProblem}
      onNextProblem={goToNextProblem}
      onBackToContest={() => {
        setSelectedProblem(null)
      }}
      onSubmit={async (code, language) => {
        try {
          toast.info('Submitting solution...')
          const res = await fetch('/api/submissions/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemId: selectedProblem.id,
              contestId: params.id,
              code,
              language,
              dryRun: false
            })
          })
          const data = await res.json()

          if (!res.ok || !data.success) {
            toast.error(data.error || 'Submission failed')
            return
          }

          if (!data.allPassed) {
            toast.error('Tests failed')
            return
          }

          toast.success('✅ Solution accepted!')
        } catch (error) {
          console.error('Submission error:', error)
          toast.error('Failed to submit solution')
        }
      }}
    />
  )
}
