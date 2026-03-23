'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, RefreshCw, Trophy, Crown, Timer } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../components/ui/table'
import { createClient } from '@/lib/supabase/client'

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  total_score: number
  penalty: number
  solved_problems: string[]
  problems_status: Record<string, {
    attempts: number
    solved: boolean
    solved_at: number
  }>
}

export default function ContentLeaderboardPage() {
  const params = useParams()
  const router = useRouter()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [contestName, setContestName] = useState('')
  const [contestEndTime, setContestEndTime] = useState<Date | null>(null)
  const [problemCols, setProblemCols] = useState<string[]>([])

  useEffect(() => {
    fetchContestDetails()
    fetchLeaderboard()

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLeaderboard(true)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchContestDetails = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('contests')
      .select('name, end_time, problems:contest_problems(problem_id)')
      .eq('id', params.id)
      .single()
    
    if (data) {
      setContestName(data.name)
      if (data.end_time) setContestEndTime(new Date(data.end_time))
      if (data.problems) {
        // We just store IDs to map columns, assuming order is irrelevant or sorted by DB
        //Ideally we'd fetch titles too, but for now IDs are columns
        setProblemCols(data.problems.map((p: any) => p.problem_id))
      }
    }
  }

  const fetchLeaderboard = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    else setRefreshing(true)

    try {
      const res = await fetch(`/api/contests/${params.id}/leaderboard`)
      const data = await res.json()
      
      if (data.success) {
        setLeaderboard(data.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400 fill-current" />
    if (rank === 2) return <Badge variant="outline" className="border-slate-300 text-slate-300">2nd</Badge>
    if (rank === 3) return <Badge variant="outline" className="border-amber-700 text-amber-700">3rd</Badge>
    return <span className="text-muted-foreground font-mono">#{rank}</span>
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => router.back()}>
               <ArrowLeft className="h-5 w-5" />
             </Button>
             <div>
               <h1 className="text-2xl font-bold flex items-center gap-2">
                 <Trophy className="h-6 w-6 text-primary" />
                 {contestName || 'Contest'} Leaderboard
               </h1>
               <p className="text-sm text-muted-foreground flex items-center gap-2">
                 <Timer className="h-3 w-3" />
                 Last updated: {lastUpdated.toLocaleTimeString()}
               </p>
             </div>
          </div> {/* This div was previously closed incorrectly */}

          <div className="flex gap-2">
            {contestEndTime && new Date() > contestEndTime && (
            <Button 
                variant="outline"
                className="border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10"
                onClick={async () => {
                  try {
                    toast.info('Calculating winners and awarding points...')
                    const res = await fetch(`/api/contests/${params.id}/finalize`, { method: 'POST' })
                    const result = await res.json()
                    if (result.success) {
                      toast.success(`🎉 Awarded points to top ${result.results.length} winners!`)
                      fetchLeaderboard() 
                    } else {
                      toast.error('Failed to finalize: ' + result.error)
                    }
                  } catch (e) {
                    toast.error('Error finalizing contest')
                  }
                }}
              >
                <Crown className="h-4 w-4 mr-2" />
                Finalize & Award Prizes
            </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => fetchLeaderboard()} 
              disabled={refreshing || loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="glass-card">
          <CardContent className="p-0">
             <Table>
               <TableHeader>
                 <TableRow className="hover:bg-transparent">
                   <TableHead className="w-[80px]">Rank</TableHead>
                   <TableHead>User</TableHead>
                   <TableHead className="text-right">Score</TableHead>
                   <TableHead className="text-right">Penalty</TableHead>
                   {/* Problem Columns */}
                   {problemCols.map((pid, idx) => (
                     <TableHead key={pid} className="text-center w-[100px]">P{idx + 1}</TableHead>
                   ))}
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {loading && leaderboard.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={4 + problemCols.length} className="h-48 text-center">
                       <div className="flex items-center justify-center">
                         <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                       </div>
                     </TableCell>
                   </TableRow>
                 ) : leaderboard.length === 0 ? (
                    <TableRow>
                     <TableCell colSpan={4 + problemCols.length} className="h-48 text-center text-muted-foreground">
                       No participants yet. Be the first to join!
                     </TableCell>
                   </TableRow>
                 ) : (
                   leaderboard.map((entry) => (
                     <TableRow key={entry.user_id}>
                       <TableCell className="font-medium">
                         <div className="flex items-center justify-center w-8">
                           {getRankBadge(entry.rank)}
                         </div>
                       </TableCell>
                       <TableCell className="font-semibold text-primary">
                         {entry.username}
                       </TableCell>
                       <TableCell className="text-right font-bold">
                         {entry.total_score}
                       </TableCell>
                       <TableCell className="text-right text-muted-foreground font-mono">
                         {entry.penalty}m
                       </TableCell>
                       {/* Problem Cells */}
                       {problemCols.map((pid) => {
                         const status = entry.problems_status[pid]
                         if (!status || status.attempts === 0 && !status.solved) {
                           return <TableCell key={pid} className="text-center text-muted-foreground/30">-</TableCell>
                         }
                         if (status.solved) {
                           return (
                             <TableCell key={pid} className="text-center">
                               <div className="flex flex-col items-center">
                                 <span className="text-green-500 font-bold text-lg">✓</span>
                                 <span className="text-[10px] text-muted-foreground">{status.solved_at}m</span>
                                 {status.attempts > 0 && (
                                   <span className="text-[10px] text-red-400">(-{status.attempts})</span>
                                 )}
                               </div>
                             </TableCell>
                           )
                         }
                         return (
                           <TableCell key={pid} className="text-center">
                             <span className="text-red-500 font-medium">-{status.attempts}</span>
                           </TableCell>
                         )
                       })}
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
