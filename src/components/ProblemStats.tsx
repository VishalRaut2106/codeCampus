'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Code, CheckCircle2, Trophy, Target } from 'lucide-react'

interface ProblemStatsProps {
  easy: number
  medium: number
  hard: number
  total: number
  totalAvailable?: {
    easy: number
    medium: number
    hard: number
    total: number
  }
}

export default function ProblemStats({ easy, medium, hard, total, totalAvailable }: ProblemStatsProps) {
  // Calculate percentages if total available is provided
  const easyPercent = totalAvailable?.easy ? Math.round((easy / totalAvailable.easy) * 100) : 0
  const mediumPercent = totalAvailable?.medium ? Math.round((medium / totalAvailable.medium) * 100) : 0
  const hardPercent = totalAvailable?.hard ? Math.round((hard / totalAvailable.hard) * 100) : 0
  const totalPercent = totalAvailable?.total ? Math.round((total / totalAvailable.total) * 100) : 0

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Problem Solving Stats
        </CardTitle>
        <CardDescription>
          Track your progress across different difficulty levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Easy Problems */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Easy</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-green-400 font-bold">{easy}</span>
                {totalAvailable && <span> / {totalAvailable.easy}</span>}
              </div>
            </div>
            {totalAvailable && (
              <div className="space-y-1">
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${easyPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">{easyPercent}% completed</p>
              </div>
            )}
          </div>

          {/* Medium Problems */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Medium</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-yellow-400 font-bold">{medium}</span>
                {totalAvailable && <span> / {totalAvailable.medium}</span>}
              </div>
            </div>
            {totalAvailable && (
              <div className="space-y-1">
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500 transition-all duration-300"
                    style={{ width: `${mediumPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">{mediumPercent}% completed</p>
              </div>
            )}
          </div>

          {/* Hard Problems */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Hard</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-red-400 font-bold">{hard}</span>
                {totalAvailable && <span> / {totalAvailable.hard}</span>}
              </div>
            </div>
            {totalAvailable && (
              <div className="space-y-1">
                <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${hardPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">{hardPercent}% completed</p>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-[#00C896]" />
                <span className="text-base font-bold text-[#00C896]">Total Solved</span>
              </div>
              <div className="text-base">
                <span className="text-[#00C896] font-bold text-2xl">{total}</span>
                {totalAvailable && <span className="text-muted-foreground"> / {totalAvailable.total}</span>}
              </div>
            </div>
            {totalAvailable && (
              <div className="space-y-1 mt-2">
                <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${totalPercent}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-right">{totalPercent}% of all problems</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
            <p className="text-lg font-bold text-[#00C896]">
              {total > 0 ? '100%' : '0%'}
            </p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Rank</p>
            <p className="text-lg font-bold text-[#00C896]">
              {totalPercent > 75 ? 'Expert' : totalPercent > 50 ? 'Advanced' : totalPercent > 25 ? 'Intermediate' : 'Beginner'}
            </p>
          </div>
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Progress</p>
            <p className="text-lg font-bold text-[#00C896]">
              {total > 0 ? '🔥' : '📚'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
