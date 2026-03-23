'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Activity } from 'lucide-react'

interface ContributionData {
  date: string
  count: number
}

interface ContributionsGraphProps {
  data?: ContributionData[]
}

export default function ContributionsGraph({ data }: ContributionsGraphProps) {
  // Generate full year of data (365 days)
  const generateContributionData = (): ContributionData[] => {
    const fullData: ContributionData[] = []
    const today = new Date()
    
    // Create a map of actual contributions
    const contributionMap = new Map<string, number>()
    if (data) {
      data.forEach(d => {
        contributionMap.set(d.date, d.count)
      })
    }
    
    // Generate last 365 days
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      fullData.push({
        date: dateStr,
        count: contributionMap.get(dateStr) || 0
      })
    }
    
    return fullData
  }

  const contributions = generateContributionData()
  
  // Get the last year of data
  const yearData = contributions
  
  // Calculate stats
  const totalContributions = yearData.reduce((sum, day) => sum + day.count, 0)
  const activeDays = yearData.filter(day => day.count > 0).length
  const currentStreak = (() => {
    let streak = 0
    for (let i = yearData.length - 1; i >= 0; i--) {
      if (yearData[i].count > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  })()

  // Get intensity level for color
  const getIntensity = (count: number): string => {
    if (count === 0) return 'bg-[#161b22]' // Darker block
    if (count === 1) return 'bg-[#0e4429]' // Level 1
    if (count === 2) return 'bg-[#006d32]' // Level 2
    if (count === 3) return 'bg-[#26a641]' // Level 3
    return 'bg-[#39d353]' // Level 4
  }

  // Group data by weeks
  const weeks = []
  for (let i = 0; i < yearData.length; i += 7) {
    weeks.push(yearData.slice(i, i + 7))
  }

  return (
    <Card className="glass-card border-none bg-transparent shadow-none p-0">
      <CardHeader className="pb-3 px-0">
        <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-base font-normal text-muted-foreground">
            {totalContributions} submissions in the past one year
          </CardTitle>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div>Total active days: <span className="text-foreground font-medium">{activeDays}</span></div>
            <div>Current streak: <span className="text-foreground font-medium">{currentStreak}</span></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        {/* Graph */}
        <div className="space-y-2 overflow-x-auto pb-4 custom-scrollbar">
          {/* Month labels - Approximation */}
          <div className="flex text-xs text-muted-foreground ml-8">
            {['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'].map(m => (
               <span key={m} className="flex-1 min-w-[32px]">{m}</span>
            ))}
          </div>

          <div className="flex gap-1">
            {/* Days of week */}
            <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pr-2 pt-[2px]">
               <div className="h-3"></div>
               <div className="h-3">Mon</div>
               <div className="h-3"></div>
               <div className="h-3">Wed</div>
               <div className="h-3"></div>
               <div className="h-3">Fri</div>
               <div className="h-3"></div>
            </div>

            {/* Contribution grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`w-3 h-3 rounded-sm ${getIntensity(day.count)} hover:ring-1 hover:ring-white transition-all cursor-pointer`}
                      title={`${day.date}: ${day.count} submissions`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-[#161b22]"></div>
              <div className="w-3 h-3 rounded-sm bg-[#0e4429]"></div>
              <div className="w-3 h-3 rounded-sm bg-[#006d32]"></div>
              <div className="w-3 h-3 rounded-sm bg-[#26a641]"></div>
              <div className="w-3 h-3 rounded-sm bg-[#39d353]"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
