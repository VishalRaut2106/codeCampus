"use client"

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { } from 'lucide-react'
import { useAlertDialog } from '@/components/ui/alert-dialog'
import CreateContestProblem from '@/components/CreateContestProblem'

interface Problem {
  id: string
  title: string
}

interface Contest {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string
  platform?: string | null
  external_url?: string | null
  participants?: number
  problems_count?: number
}

export default function AdminContestsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { dialogState, showDialog, hideDialog, AlertDialogComponent } = useAlertDialog()

  const [contests, setContests] = useState<Contest[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null)
  const [assignedProblemIds, setAssignedProblemIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchingLeetCode, setFetchingLeetCode] = useState(false)
  const [leetcodeNumber, setLeetcodeNumber] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  useEffect(() => {
    const init = async () => {
      await fetchInitial()
      try {
        const { count } = await supabase.from('contests').select('id', { count: 'exact', head: true })
      } catch { }
    }
    init()
  }, [])

  useEffect(() => {
    if (editId && contests.length > 0) {
      const target = contests.find(c => c.id === editId)
      if (target) {
        startEdit(target)
        // clean up URL
        window.history.replaceState(null, '', '/dashboard/admin/contests')
      }
    }
  }, [editId, contests])

  const fetchInitial = async () => {
    try {
      // Fetch contests from API
      const contestsRes = await fetch('/api/admin/contests', { cache: 'no-store' })
      if (contestsRes.status === 401 || contestsRes.status === 403) {
        toast.error('Admin access required')
        router.push('/dashboard')
        return
      }
      const contestsData = await contestsRes.json()

      // Fetch problems (keep as direct DB for now, or move to API if needed, but contests is the priority)
      const { data: problemsData } = await supabase.from('problems').select('id, title').order('created_at', { ascending: false })

      console.log('🔍 DEBUG: Raw API Response:', contestsData)
      console.log('🔍 DEBUG: First contest data:', contestsData.contests?.[0])

      if (contestsData.contests) {
        setContests(contestsData.contests as Contest[])
      }
      setProblems((problemsData || []) as Problem[])
    } catch (e) {
      console.error('Failed to load contests:', e)
      toast.error('Failed to load contests')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedContest(null)
    setAssignedProblemIds(new Set())
    setName('')
    setDescription('')
    setStart('')
    setEnd('')
  }

  const startCreate = () => {
    resetForm()
  }

  const startEdit = async (contest: Contest) => {
    // Check contest status and warn user
    const now = new Date()
    const start = new Date(contest.start_time)
    const end = new Date(contest.end_time)

    if (now > end) {
      toast.warning('⚠️ This contest has ended. Changes will not affect past participants.', {
        duration: 5000
      })
    } else if (now >= start && now <= end) {
      toast.warning('⚠️ This contest is currently LIVE! Edit carefully as changes affect active participants.', {
        duration: 5000
      })
    }

    setSelectedContest(contest)
    setName(contest.name)
    setDescription(contest.description || '')
    setStart(new Date(contest.start_time).toISOString().slice(0, 16))
    setEnd(new Date(contest.end_time).toISOString().slice(0, 16))

    // Load assigned problems
    const { data, error } = await supabase
      .from('contest_problems')
      .select('problem_id')
      .eq('contest_id', contest.id)

    if (!error && data) {
      setAssignedProblemIds(new Set(data.map((r: any) => r.problem_id)))
    } else {
      setAssignedProblemIds(new Set())
    }
  }

  const saveContest = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Contest name is required')
      return
    }

    if (name.trim().length < 3) {
      toast.error('Contest name must be at least 3 characters')
      return
    }

    if (!start) {
      toast.error('Start time is required')
      return
    }

    if (!end) {
      toast.error('End time is required')
      return
    }

    // Validate dates
    const startDate = new Date(start)
    const endDate = new Date(end)
    const now = new Date()

    if (isNaN(startDate.getTime())) {
      toast.error('Invalid start time')
      return
    }

    if (isNaN(endDate.getTime())) {
      toast.error('Invalid end time')
      return
    }

    if (endDate <= startDate) {
      toast.error('End time must be after start time')
      return
    }

    // Check if contest duration is reasonable (at least 30 minutes)
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
    if (durationMinutes < 30) {
      toast.error('Contest duration must be at least 30 minutes')
      return
    }

    // Warn if contest is very long (more than 24 hours)
    if (durationMinutes > 1440) {
      const confirmed = confirm('This contest is longer than 24 hours. Are you sure?')
      if (!confirmed) return
    }

    // Warn if start time is in the past (only for new contests)
    if (!selectedContest && startDate < now) {
      const confirmed = confirm('Start time is in the past. The contest will start immediately. Continue?')
      if (!confirmed) return
    }

    setSaving(true)
    const loadingToast = toast.loading(selectedContest ? 'Updating contest...' : 'Creating contest...')

    try {
      const response = await fetch('/api/admin/contests', {
        method: selectedContest ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedContest?.id,
          name: name.trim(),
          description: description.trim(),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save contest')
      }

      toast.success(selectedContest ? '✅ Contest updated successfully!' : '✅ Contest created successfully!', { id: loadingToast })

      resetForm()
      await fetchInitial()
    } catch (e) {
      console.error('Contest save error:', e)
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? String((e as any).message) : 'Unknown error occurred')
      toast.error(`Save failed: ${errorMessage}`, { id: loadingToast })
    } finally {
      setSaving(false)
    }
  }

  const toggleProblem = (id: string) => {
    setAssignedProblemIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const saveAssignments = async () => {
    if (!selectedContest) {
      toast.error('Please select a contest first')
      return
    }

    setSaving(true)
    try {
      // Load current assignments
      const { data: current, error: fetchError } = await supabase
        .from('contest_problems')
        .select('problem_id')
        .eq('contest_id', selectedContest.id)

      if (fetchError) {
        console.error('Error fetching current assignments:', fetchError)
        throw new Error(`Failed to fetch current assignments: ${fetchError.message}`)
      }

      const currentSet = new Set((current || []).map((r: any) => r.problem_id as string))

      const toAdd = Array.from(assignedProblemIds).filter(id => !currentSet.has(id))
      const toRemove = Array.from(currentSet).filter(id => !assignedProblemIds.has(id))

      console.log('Assignment changes:', { toAdd, toRemove })

      if (toAdd.length > 0) {
        const inserts = toAdd.map((pid, idx) => ({
          contest_id: selectedContest.id,
          problem_id: pid,
          order_index: idx
        }))

        const { error: insertError } = await supabase
          .from('contest_problems')
          .insert(inserts)

        if (insertError) {
          console.error('Error inserting assignments:', insertError)
          throw new Error(`Failed to add problems: ${insertError.message}`)
        }
      }

      if (toRemove.length > 0) {
        for (const pid of toRemove) {
          const { error: deleteError } = await supabase
            .from('contest_problems')
            .delete()
            .eq('contest_id', selectedContest.id)
            .eq('problem_id', pid)

          if (deleteError) {
            console.error('Error deleting assignment:', deleteError)
            throw new Error(`Failed to remove problem: ${deleteError.message}`)
          }
        }
      }

      toast.success(`Assignments saved! Added: ${toAdd.length}, Removed: ${toRemove.length}`)
    } catch (e) {
      console.error('Assignment error:', e)
      const errorMessage = e instanceof Error ? e.message : 'Failed to save assignments'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const fetchLeetCodeProblem = async () => {
    if (!leetcodeNumber.trim()) {
      toast.error('Please enter a LeetCode problem number')
      return
    }

    if (!selectedContest) {
      toast.error('Please select a contest first')
      return
    }

    setFetchingLeetCode(true)
    try {
      const response = await fetch('/api/leetcode/problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionNumber: leetcodeNumber,
          contestId: selectedContest.id
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setLeetcodeNumber('')
        // Refresh problems and assignments
        await fetchInitial()
        if (result.problem) {
          setAssignedProblemIds(prev => new Set([...prev, result.problem.id]))
        }
      } else {
        toast.error(result.error || 'Failed to fetch problem')
      }
    } catch (error) {
      console.error('Error fetching LeetCode problem:', error)
      toast.error('Failed to fetch problem from LeetCode')
    } finally {
      setFetchingLeetCode(false)
    }
  }

  const deleteContest = async (id: string) => {
    try {
      // Get contest details
      const contest = contests.find(c => c.id === id)
      if (!contest) {
        toast.error('Contest not found')
        return
      }

      // Check if contest is currently live
      const now = new Date()
      const start = new Date(contest.start_time)
      const end = new Date(contest.end_time)

      if (now >= start && now <= end) {
        toast.error('Cannot delete a live contest! Please wait until it ends.')
        return
      }

      // Check if contest has participants
      const { count: participantsCount } = await supabase
        .from('contest_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('contest_id', id)

      // Check if contest has problems
      const { count: problemsCount } = await supabase
        .from('contest_problems')
        .select('*', { count: 'exact', head: true })
        .eq('contest_id', id)

      // Build warning message
      let warningMessage = "Are you sure you want to delete this contest?"
      if (participantsCount && participantsCount > 0) {
        warningMessage += `\n\n⚠️ This contest has ${participantsCount} registered participant${participantsCount > 1 ? 's' : ''}.`
      }
      if (problemsCount && problemsCount > 0) {
        warningMessage += `\n⚠️ This contest has ${problemsCount} assigned problem${problemsCount > 1 ? 's' : ''}.`
      }
      warningMessage += "\n\nThis action cannot be undone."

      showDialog({
        title: "Delete Contest",
        description: warningMessage,
        confirmText: "Delete Contest",
        cancelText: "Cancel",
        variant: "destructive",
        onConfirm: async () => {
          const loadingToast = toast.loading('Deleting contest...')
          try {
            const response = await fetch(`/api/admin/contests?id=${id}`, {
              method: 'DELETE'
            })

            const data = await response.json()

            if (!response.ok) {
              throw new Error(data.error || 'Failed to delete contest')
            }

            toast.success('✅ Contest deleted successfully', { id: loadingToast })
            if (selectedContest?.id === id) resetForm()
            await fetchInitial()
          } catch (e) {
            console.error('Delete error:', e)
            const errorMessage = e instanceof Error ? e.message : 'Unknown error'
            toast.error(`Delete failed: ${errorMessage}`, { id: loadingToast })
          }
        }
      })
    } catch (error) {
      console.error('Delete validation error:', error)
      toast.error('Failed to validate contest deletion')
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00C896]"></div>
      </div>
    )
  }

  return (
    <>
      <AlertDialogComponent />
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Admin • Contests</h1>
            <div className="flex gap-2">

              <Button
                className="bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-none transition-all duration-200 border-0"
                onClick={startCreate}
              >
                New Contest
              </Button>
            </div>
          </div>

          {/* Editor */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{selectedContest ? 'Edit Contest' : 'Create Contest'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Start Time</label>
                    <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">End Time</label>
                    <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={8} className="w-full bg-white/5 border border-white/10 rounded p-2" />
                </div>
              </div>
              <div className="mt-6">
                <Button
                  onClick={saveContest}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-none transition-all duration-200 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* List and Assignment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Contests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contests.map((c) => {
                    // Only show edit/delete for non-LeetCode contests
                    const isLeetCodeContest = c.platform === 'leetcode' || c.external_url?.includes('leetcode.com')

                    return (
                      <div key={c.id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
                        {/* Header Row: Title, Platform Badge, and Counts */}
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg truncate">{c.name}</h3>
                              {c.platform && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex-shrink-0 text-xs">
                                  {c.platform.toUpperCase()}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {c.description || 'No description'}
                            </p>
                          </div>

                          {/* Counts on the right */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{c.participants || 0}</div>
                              <div className="text-[10px] text-muted-foreground">Participants</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{c.problems_count || 0}</div>
                              <div className="text-[10px] text-muted-foreground">Problems</div>
                            </div>
                          </div>
                        </div>

                        {/* Date Row */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">Start:</span>
                            <span>{new Date(c.start_time).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-semibold">End:</span>
                            <span>{new Date(c.end_time).toLocaleDateString()}</span>
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                            onClick={() => router.push(`/contests/${c.id}`)}
                            title="View Contest"
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => startEdit(c)}
                            title="Edit Contest"
                          >
                            Edit
                          </Button>
                          {!isLeetCodeContest && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                              onClick={() => deleteContest(c.id)}
                              title="Delete Contest"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {contests.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No contests yet</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Assign Problems {selectedContest ? `• ${selectedContest.name}` : ''}</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedContest ? (
                  <div className="text-muted-foreground">Select a contest to assign problems.</div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <>
                        {/* Create New Problem Component */}
                        <CreateContestProblem
                          contestId={selectedContest.id}
                          contestName={selectedContest.name}
                          onProblemCreated={(problemId) => {
                            setAssignedProblemIds(prev => new Set([...prev, problemId]))
                            fetchInitial()
                          }}
                        />
                        {/* LeetCode Problem Fetcher */}
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">

                            Add from LeetCode
                          </h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            Enter a LeetCode problem number to fetch and add it to this contest
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g., 1, 2, 15, 206"
                              value={leetcodeNumber}
                              onChange={(e) => setLeetcodeNumber(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && fetchLeetCodeProblem()}
                              className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-sm"
                              disabled={fetchingLeetCode}
                            />
                            <Button
                              onClick={fetchLeetCodeProblem}
                              disabled={fetchingLeetCode || !leetcodeNumber}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              size="sm"
                            >
                              {fetchingLeetCode ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              ) : (
                                <>Add</>
                              )}
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          Examples: 1 (Two Sum), 2 (Add Two Numbers), 15 (3Sum), 206 (Reverse Linked List)
                        </p>
                      </>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-muted-foreground">Select Existing Problems</label>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAssignedProblemIds(new Set(problems.map(p => p.id)))}>Select All</Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAssignedProblemIds(new Set())}>Clear</Button>
                        </div>
                      </div>
                      <div className="max-h-[300px] overflow-auto space-y-2">
                        {problems.map((p) => (
                          <label key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                            <input type="checkbox" checked={assignedProblemIds.has(p.id)} onChange={() => toggleProblem(p.id)} />
                            <span>{p.title}</span>
                          </label>
                        ))}
                        {problems.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">No problems available</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">Bulk assign by Problem IDs or Titles (one per line)</label>
                        <textarea id="bulk-assign" rows={6} className="w-full bg-white/5 border border-white/10 rounded p-2 font-mono" placeholder="problem-id-1\nproblem-id-2\nTwo Sum" onBlur={(e) => {
                          const lines = e.target.value.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
                          if (lines.length === 0) return
                          const next = new Set(assignedProblemIds)
                          for (const line of lines) {
                            const byId = problems.find(p => p.id === line)
                            const byTitle = problems.find(p => p.title.toLowerCase() === line.toLowerCase())
                            const match = byId || byTitle
                            if (match) next.add(match.id)
                          }
                          setAssignedProblemIds(next)
                        }} />
                      </div>
                      <Button
                        onClick={saveAssignments}
                        disabled={saving}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-none transition-all duration-200 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Assignments
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card >
          </div >
        </div >
      </div >
    </>
  )
}
