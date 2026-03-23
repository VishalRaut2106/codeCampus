'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, ExternalLink, Trophy, Users, Zap } from 'lucide-react'
import { LeetCodeContest, LeetCodeContestService } from '@/lib/leetcode/contest-service'

interface LeetCodeContestsProps {
  maxContests?: number;
  showStatus?: boolean;
}

export default function LeetCodeContests({ maxContests = 5, showStatus = true }: LeetCodeContestsProps) {
  const [contests, setContests] = useState<(LeetCodeContest & { status: { status: string; timeRemaining?: number; progress?: number } })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true)
        const contestsWithStatus = await LeetCodeContestService.getAllContestsWithStatus()
        setContests(contestsWithStatus.slice(0, maxContests))
        setError(null)
      } catch (err) {
        console.error('Error fetching contests:', err)
        setError('Failed to fetch LeetCode contests')
      } finally {
        setLoading(false)
      }
    }

    fetchContests()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchContests, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [maxContests])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'upcoming':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'ended':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      default:
        return 'text-muted-foreground bg-muted/10 border-muted/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <Zap className="h-4 w-4" />
      case 'upcoming':
        return <Clock className="h-4 w-4" />
      case 'ended':
        return <Trophy className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-muted/20 rounded w-3/4"></div>
              <div className="h-6 bg-muted/20 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted/20 rounded w-1/2"></div>
              <div className="h-4 bg-muted/20 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass rounded-xl p-6 text-center">
        <div className="text-muted-foreground mb-2">⚠️</div>
        <p className="text-muted-foreground">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 text-primary hover:underline"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (contests.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Contests Available</h3>
        <p className="text-muted-foreground">Check back later for upcoming LeetCode contests!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold gradient-text">Live LeetCode Contests</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Live Updates</span>
        </div>
      </div>

      {contests.map((contest, index) => (
        <div key={contest.url} className="gradient-card group hover:scale-105 transition-all duration-500">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {contest.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(contest.startTime).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{LeetCodeContestService.formatDuration(contest.duration)}</span>
                </div>
              </div>
            </div>
            
            {showStatus && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(contest.status.status)}`}>
                {getStatusIcon(contest.status.status)}
                <span className="text-sm font-medium capitalize">{contest.status.status}</span>
              </div>
            )}
          </div>

          {contest.status.status === 'live' && contest.status.progress !== undefined && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Contest Progress</span>
                <span>{contest.status.progress}%</span>
              </div>
              <div className="w-full bg-muted/20 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${contest.status.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {contest.status.timeRemaining && contest.status.timeRemaining > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-foreground">
                  {contest.status.status === 'live' ? 'Time Remaining: ' : 'Starts in: '}
                </span>
                <span className="font-bold gradient-text">
                  {LeetCodeContestService.formatTimeRemaining(contest.status.timeRemaining)}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>LeetCode</span>
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                <span>Competitive</span>
              </div>
            </div>
            
            <a
              href={contest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="simple-button inline-flex items-center gap-2 text-sm px-4 py-2"
            >
              <ExternalLink className="h-4 w-4" />
              Join Contest
            </a>
          </div>
        </div>
      ))}

      <div className="text-center mt-6">
        <a
          href="https://leetcode.com/contest/"
          target="_blank"
          rel="noopener noreferrer"
          className="gradient-button-secondary inline-flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          View All LeetCode Contests
        </a>
      </div>
    </div>
  )
}
