'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CheckCircle,
  ArrowUpDown,
  Search
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Problem {
  id: string
  displayId: number // Added virtual ID
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  time_limit: number
  memory_limit: number
  test_cases: any[]
  created_at: string
  updated_at: string
  solved?: boolean
}
interface Contest {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string
  is_active: boolean
  problems: Problem[]
}

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([])
  const [contests, setContests] = useState<Contest[]>([]) // Kept for stats if needed, or remove if unused in stats
  const [loading, setLoading] = useState(true)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('newest')
  const router = useRouter()
  const supabase = createClient()

  // State for suggestions
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Problem[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchProblems()])
      setLoading(false)
    }
    load()
  }, [])

  const fetchProblems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      // setUserId removal - not used anymore

      // Fetch all problems ordered by creation date (oldest first) to assign stable IDs
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .order('created_at', { ascending: true }) // Get oldest first for ID assignment

      if (error) throw error

      let problemsWithStatus: Problem[] = []

      // If user is logged in, check which problems they've solved
      if (user?.id && data) {
        const { data: solvedSubmissions } = await supabase
          .from('submissions')
          .select('problem_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted')

        const solvedProblemIds = new Set(solvedSubmissions?.map(s => s.problem_id) || [])
        
        problemsWithStatus = data.map((p, index) => ({
          ...p,
          displayId: index + 1, // Assign stable ID: Oldest is #1
          solved: solvedProblemIds.has(p.id)
        }))
      } else if (data) {
        problemsWithStatus = data.map((p, index) => ({
          ...p,
          displayId: index + 1
        }))
      }

      // Default sort (Newest First) for display - reverse the array since we fetched oldest first
      const defaultSorted = [...problemsWithStatus].reverse()
      
      setProblems(defaultSorted)
      setFilteredProblems(defaultSorted)

    } catch (error) {
      console.error('Error fetching problems:', error)
      toast.error('Failed to load problems')
    }
  }

  // Filter and sort problems
  useEffect(() => {
    let filtered = [...problems]

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(p => p.difficulty === selectedDifficulty)
    }

    // Filter by search query (Title or ID)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      // Check if query is a number (searching by Display ID)
      const isNumber = !isNaN(Number(query)) && query !== ''
      
      filtered = filtered.filter(p => {
        if (isNumber) {
          return p.displayId.toString() === query || p.displayId.toString().includes(query)
        }
        return p.title.toLowerCase().includes(query) || p.id.toLowerCase().includes(query)
      })
    }
    
    // Update suggestions for the dropdown
    if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase().trim()
       const isNumber = !isNaN(Number(query)) && query !== ''
       
       const matches = problems.filter(p => {
          if (isNumber) {
            // Prioritize exact ID match
            return p.displayId.toString().startsWith(query)
          }
           return p.title.toLowerCase().includes(query)
       }).slice(0, 5) // Limit to 5 suggestions
       setSuggestions(matches)
    } else {
      setSuggestions([])
    }

    // Sort problems
    switch (sortBy) {
      // ... existing sort cases ... (unchanged)
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'points-high':
        filtered.sort((a, b) => b.points - a.points)
        break
      case 'points-low':
        filtered.sort((a, b) => a.points - b.points)
        break
      case 'difficulty-easy':
        filtered.sort((a, b) => {
          const order = { easy: 1, medium: 2, hard: 3 }
          return order[a.difficulty] - order[b.difficulty]
        })
        break
      case 'difficulty-hard':
        filtered.sort((a, b) => {
          const order = { easy: 1, medium: 2, hard: 3 }
          return order[b.difficulty] - order[a.difficulty]
        })
        break
      default:
        break
    }
    setFilteredProblems(filtered)
  }, [problems, selectedDifficulty, sortBy, searchQuery])

  // Handle direct navigation on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const query = searchQuery.trim()
      if (!query) return

      // Specific Check: Is it an exact ID?
      const exactIdMatch = problems.find(p => p.displayId.toString() === query)
      if (exactIdMatch) {
         router.push(`/problems/${exactIdMatch.id}`)
         return
      }
      
      // Fallback: Use the first suggestion if available?
      // Or just let filtering happen. The user asked for "direct open... when id entered".
      // Above logic handles the exact ID case.
    }
  }

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
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getContestStatus = (contest: Contest) => {
    const now = new Date()
    const start = new Date(contest.start_time)
    const end = new Date(contest.end_time)

    if (now < start) return { status: 'upcoming', color: 'bg-blue-500/20 text-blue-400' }
    if (now >= start && now <= end) return { status: 'active', color: 'bg-green-500/20 text-green-400' }
    return { status: 'ended', color: 'bg-gray-500/20 text-gray-400' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00C896]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header - Minimal & Full Width */}
      <div className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-7xl px-4 py-4">
           <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
             <div>
                <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Dive into our collection of challenges to enhance your coding skills.
                </p>
             </div>
             
             {/* Stats summary (Optional, kept minimal) */}
             <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span>{problems.filter(p => p.difficulty === 'easy').length} Easy</span>
                </div>
                 <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span>{problems.filter(p => p.difficulty === 'medium').length} Medium</span>
                </div>
                 <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span>{problems.filter(p => p.difficulty === 'hard').length} Hard</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-4">
           
           {/* Filters Toolbar */}
           <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card/30 p-1 rounded-lg">
             <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-9 pl-9 pr-4 text-sm bg-background/50 border border-border/50 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
                  />
                  {/* Suggestions (kept same logic) */}
                   {showSuggestions && searchQuery.trim().length > 0 && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover/95 backdrop-blur-md border border-border rounded-md shadow-lg z-50 overflow-hidden">
                      <div className="py-1">
                        {suggestions.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 cursor-pointer transition-colors text-sm"
                            onClick={() => router.push(`/problems/${p.id}`)}
                          >
                             <span className="font-mono text-xs text-muted-foreground">#{p.displayId}</span>
                             <span className="truncate flex-1">{p.title}</span>
                             <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 uppercase ${getDifficultyColor(p.difficulty)}`}>
                               {p.difficulty}
                             </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-[120px] h-9 bg-background/50 border-border/50">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="easy" className="text-green-500">Easy</SelectItem>
                    <SelectItem value="medium" className="text-yellow-500">Medium</SelectItem>
                    <SelectItem value="hard" className="text-red-500">Hard</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             <div className="flex items-center gap-2 w-full sm:w-auto">
               <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-9 bg-background/50 border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <SelectValue placeholder="Sort" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="points-high">Highest Points</SelectItem>
                    <SelectItem value="points-low">Lowest Points</SelectItem>
                  </SelectContent>
                </Select>
             </div>
           </div>

           {/* Problems Table Header */}
           <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground border-b border-border/50">
             <div className="col-span-1">Status</div>
             <div className="col-span-6 md:col-span-7">Title</div>
             <div className="col-span-2 md:col-span-2">Difficulty</div>
             <div className="col-span-3 md:col-span-2 text-right">Points</div>
           </div>

           {/* Problems List */}
           <div className="space-y-1">
             {filteredProblems.length === 0 && !loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted/20 mb-4">
                    <Search className="h-6 w-6 opacity-50" />
                  </div>
                  <p>No problems found matching your filters.</p>
                </div>
             ) : (
               filteredProblems.map((problem, idx) => (
                 <div
                   key={problem.id}
                   onClick={() => router.push(`/problems/${problem.id}`)}
                   className={`
                     group grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-md cursor-pointer transition-colors
                     hover:bg-muted/30 border border-transparent hover:border-border/30
                     ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/5'}
                   `}
                 >
                   <div className="col-span-1">
                     {problem.solved ? (
                       <CheckCircle className="h-4 w-4 text-green-500" />
                     ) : (
                       <div className="h-4 w-4 rounded-full border border-muted-foreground/30 group-hover:border-primary/50 transition-colors" />
                     )}
                   </div>
                   
                   <div className="col-span-6 md:col-span-7 font-medium text-sm flex items-center gap-2">
                     <span className="text-muted-foreground text-xs font-mono w-8">
                       {problem.displayId}.
                     </span>
                     <span className="truncate group-hover:text-primary transition-colors">
                       {problem.title}
                     </span>
                   </div>
                   
                   <div className="col-span-2 md:col-span-2">
                     <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        problem.difficulty === 'easy' ? 'text-green-500 bg-green-500/10' :
                        problem.difficulty === 'medium' ? 'text-yellow-500 bg-yellow-500/10' :
                        'text-red-500 bg-red-500/10'
                     }`}>
                       {problem.difficulty}
                     </span>
                   </div>
                   
                   <div className="col-span-3 md:col-span-2 text-right text-xs text-muted-foreground font-mono">
                      {problem.points} pts
                   </div>
                 </div>
               ))
             )}
           </div>

           {/* Results count footer */}
           {!loading && filteredProblems.length > 0 && (
             <div className="flex justify-between items-center px-4 py-4 text-xs text-muted-foreground border-t border-border/50 mt-4">
               <div>
                  Showing {filteredProblems.length} of {problems.length} problems
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
