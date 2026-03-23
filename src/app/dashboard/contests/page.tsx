'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

import {
  Trophy,
} from 'lucide-react'

interface Contest {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string
  status: 'upcoming' | 'live' | 'ended'
}

export default function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchContests()
  }, [])

  const fetchContests = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('start_time', { ascending: true })

      if (error) throw error

      const now = new Date()
      const processedContests = data?.map(contest => {
        const startTime = new Date(contest.start_time)
        const endTime = new Date(contest.end_time)

        let status: 'upcoming' | 'live' | 'ended' = 'ended'
        if (startTime > now) {
          status = 'upcoming'
        } else if (startTime <= now && endTime >= now) {
          status = 'live'
        }

        return {
          ...contest,
          status
        }
      }) || []

      setContests(processedContests)
    } catch (error) {
      console.error('Error fetching contests:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'ended':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen animated-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <span className="text-sm font-medium text-primary">Coding Contests</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 gradient-text">
            Live Contests
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Participate in exciting coding contests and compete with fellow students
          </p>
        </div>



        {/* codCampus Contests Section */}
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">PVG</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground">codCampus Contests</h2>
              <p className="text-muted-foreground">Our exclusive coding competitions</p>
            </div>
          </div>

          {/* Contest Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass rounded-xl p-6 text-center group hover:scale-105 transition-all duration-500">
              <div className="text-4xl font-black gradient-text mb-2">
                {contests.filter(c => c.status === 'live').length}
              </div>
              <div className="text-muted-foreground">Live Contests</div>
            </div>
            <div className="glass rounded-xl p-6 text-center group hover:scale-105 transition-all duration-500">
              <div className="text-4xl font-black gradient-text-secondary mb-2">
                {contests.filter(c => c.status === 'upcoming').length}
              </div>
              <div className="text-muted-foreground">Upcoming</div>
            </div>
            <div className="glass rounded-xl p-6 text-center group hover:scale-105 transition-all duration-500">
              <div className="text-4xl font-black gradient-text mb-2">
                {contests.filter(c => c.status === 'ended').length}
              </div>
              <div className="text-muted-foreground">Completed</div>
            </div>
          </div>

          {/* Contest Grid */}
          <div className="grid gap-6">
            {contests.length === 0 ? (
              <div className="gradient-card text-center py-12">

                <h3 className="text-2xl font-bold text-foreground mb-4">No Contests Available</h3>
                <p className="text-muted-foreground mb-6">Check back later for exciting coding contests!</p>
                <Link href="/dashboard" className="simple-button inline-flex items-center gap-2">
                  Back to Dashboard
                </Link>
              </div>
            ) : (
              contests.map((contest) => (
                <div key={contest.id} className="gradient-card group hover:scale-105 transition-all duration-500">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors break-words">
                          {contest.name}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${getStatusColor(contest.status)}`}>
                          {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 line-clamp-2">{contest.description}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Start: {formatDate(contest.start_time)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Duration: 2 hours</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>0 participants</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>3 problems</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {contest.status === 'live' && (
                        <Link href={`/dashboard/contest/${contest.id}`} className="simple-button">
                          Join Contest
                        </Link>
                      )}
                      <Link href={`/dashboard/contest/${contest.id}`} className="gradient-button-secondary">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full glass">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-foreground">Live contests updated every 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
