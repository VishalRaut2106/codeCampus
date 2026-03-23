"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { } from 'lucide-react'
import { useAlertDialog } from '@/components/ui/alert-dialog'

interface Problem {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  time_limit: number
  memory_limit: number
  test_cases: unknown[]
  created_at: string
  updated_at: string
}

export default function AdminProblemsPage() {
  const router = useRouter()
  const { dialogState, showDialog, hideDialog, AlertDialogComponent } = useAlertDialog()

  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Problem | null>(null)
  const [fetchingLeetCode, setFetchingLeetCode] = useState(false)
  const [leetcodeNumber, setLeetcodeNumber] = useState('')

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [points, setPoints] = useState<number>(100)
  const [timeLimit, setTimeLimit] = useState<number>(2)
  const [memoryLimit, setMemoryLimit] = useState<number>(128)
  const [testCasesText, setTestCasesText] = useState<string>('[\n  { "input": "1 2", "expected_output": "3" }\n]')

  useEffect(() => {
    fetchInitial()
  }, [])

  const resetForm = () => {
    setEditing(null)
    setTitle('')
    setDescription('')
    setDifficulty('easy')
    setPoints(100)
    setTimeLimit(2)
    setMemoryLimit(128)
    setTestCasesText('[\n  { "input": "1 2", "expected_output": "3" }\n]')
  }

  const fetchInitial = async () => {
    try {
      // Ensure current user is admin via API check (handling 401/403)
      const response = await fetch('/api/admin/problems')

      if (response.status === 401) {
        toast.error('Please log in')
        router.push('/auth/login')
        return
      }

      if (response.status === 403) {
        toast.error('Admin access required')
        router.push('/dashboard')
        return
      }

      const result = await response.json()

      if (result.error) throw new Error(result.error)

      // The API returns { problems: [...] }
      setProblems(result.problems || [])
    } catch (e) {
      console.error(e)
      toast.error('Failed to load problems')
    } finally {
      setLoading(false)
    }
  }

  const parseTestCases = (): unknown[] | null => {
    try {
      const parsed = JSON.parse(testCasesText)
      if (!Array.isArray(parsed)) throw new Error('Test cases must be an array')
      return parsed as unknown[]
    } catch (e) {
      toast.error(`Invalid test cases JSON: ${(e as Error).message}`)
      return null
    }
  }

  const handleSave = async () => {
    const test_cases = parseTestCases()
    if (!test_cases) return

    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title,
        description,
        difficulty,
        points,
        time_limit: timeLimit,
        memory_limit: memoryLimit,
        test_cases,
      }

      let response;

      if (editing) {
        // Update
        response = await fetch('/api/admin/problems', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editing.id })
        })
      } else {
        // Create
        response = await fetch('/api/admin/problems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save problem')
      }

      toast.success(editing ? 'Problem updated' : 'Problem created')
      resetForm()
      fetchInitial()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (p: Problem) => {
    setEditing(p)
    setTitle(p.title)
    setDescription(p.description)
    setDifficulty(p.difficulty)
    setPoints(p.points)
    setTimeLimit(p.time_limit)
    setMemoryLimit(p.memory_limit)
    setTestCasesText(JSON.stringify(p.test_cases, null, 2))

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    showDialog({
      title: "Delete Problem",
      description: "Are you sure you want to delete this problem? This will also remove it from any contest associations. This action cannot be undone.",
      confirmText: "Delete Problem",
      cancelText: "Cancel",
      variant: "destructive",
      onConfirm: async () => {
        const loadingToast = toast.loading('Deleting problem...')

        try {
          const response = await fetch(`/api/admin/problems?id=${id}`, {
            method: 'DELETE'
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || 'Failed to delete problem')
          }

          toast.success('Problem deleted successfully', { id: loadingToast })
          await fetchInitial()
        } catch (e) {
          console.error('Delete exception:', e)
          toast.error(`Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`, { id: loadingToast })
        }
      }
    })
  }

  const fetchLeetCodeProblem = async () => {
    if (!leetcodeNumber.trim()) {
      toast.error('Please enter a LeetCode problem number')
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
          contestId: null // Not linking to any contest
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setLeetcodeNumber('')
        // Refresh problems list
        await fetchInitial()
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
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Admin • Problems</h1>
            <div className="flex gap-2">
              <Button
                onClick={() => resetForm()}
                className="bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-none transition-all duration-200 border-0"
              >
                New Problem
              </Button>
            </div>
          </div>

          {/* Maintenance Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Clean Problem Descriptions</h3>
                  <p className="text-sm text-muted-foreground">
                    Remove HTML tags and normalize formatting in all problem descriptions.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    if (!confirm('Are you sure? This will modify all problem descriptions.')) return
                    const toastId = toast.loading('Cleaning problems...')
                    try {
                      const res = await fetch('/api/admin/clean-problems', { method: 'POST' })
                      const data = await res.json()
                      if (data.success) {
                        toast.success(data.message, { id: toastId })
                        fetchInitial()
                      } else {
                        throw new Error(data.error)
                      }
                    } catch (e) {
                      toast.error('Failed to clean problems', { id: toastId })
                    }
                  }}
                  variant="outline"
                  className="border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                >
                  Clean HTML
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* LeetCode Import */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Import from LeetCode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Enter a LeetCode problem number to fetch and add it to your problems library
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="e.g., 1, 2, 15, 206"
                    value={leetcodeNumber}
                    onChange={(e) => setLeetcodeNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && fetchLeetCodeProblem()}
                    className="flex-1 bg-white/5 border border-white/10 rounded p-3"
                    disabled={fetchingLeetCode}
                  />
                  <Button
                    onClick={fetchLeetCodeProblem}
                    disabled={fetchingLeetCode}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {fetchingLeetCode ? (
                      <>
                        Fetching...
                      </>
                    ) : (
                      <>
                        Import Problem
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Popular:</span>
                  <button onClick={() => setLeetcodeNumber('1')} className="px-2 py-1 bg-white/5 rounded hover:bg-white/10">#1 Two Sum</button>
                  <button onClick={() => setLeetcodeNumber('2')} className="px-2 py-1 bg-white/5 rounded hover:bg-white/10">#2 Add Two Numbers</button>
                  <button onClick={() => setLeetcodeNumber('15')} className="px-2 py-1 bg-white/5 rounded hover:bg-white/10">#15 3Sum</button>
                  <button onClick={() => setLeetcodeNumber('206')} className="px-2 py-1 bg-white/5 rounded hover:bg-white/10">#206 Reverse Linked List</button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Upload */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Bulk Upload Problems (JSON or CSV)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Paste a JSON array of problems or a CSV with headers: title,description,difficulty,points,time_limit,memory_limit</p>
                <textarea id="bulk-problems" rows={8} className="w-full bg-white/5 border border-white/10 rounded p-2 font-mono" placeholder='[ {"title":"Two Sum","description":"...","difficulty":"easy","points":100,"time_limit":2,"memory_limit":128,"test_cases":[{"input":"1 2","expected_output":"3"}] } ]'></textarea>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      const el = document.getElementById('bulk-problems') as HTMLTextAreaElement
                      if (!el?.value.trim()) { toast.error('Nothing to import'); return }
                      try {
                        let items: any[] = []
                        const text = el.value.trim()
                        if (text.startsWith('[')) {
                          items = JSON.parse(text)
                        } else {
                          // CSV parse
                          const lines = text.split(/\r?\n/).filter(Boolean)
                          const headers = lines.shift()!.split(',').map(h => h.trim())
                          items = lines.map(line => {
                            const cols = line.split(',')
                            const obj: any = {}
                            headers.forEach((h, i) => obj[h] = cols[i])
                            return obj
                          })
                        }
                        // Normalize
                        const rows = items.map(it => ({
                          title: it.title,
                          description: it.description,
                          difficulty: (it.difficulty || 'easy').toLowerCase(),
                          points: Number(it.points ?? 100),
                          time_limit: Number(it.time_limit ?? 2),
                          memory_limit: Number(it.memory_limit ?? 128),
                          test_cases: Array.isArray(it.test_cases) ? it.test_cases : [],
                        }))

                        // Using fetch to POST each problem or ideally a bulk endpoint if we had one.
                        // For now, let's just loop sequentially to use our safe API
                        // Or create a bulk endpoint?
                        // Leetcode import is single.
                        // Let's iterate for now to keep it simple and reuse the secure endpoint logic

                        let successCount = 0;
                        for (const row of rows) {
                          const res = await fetch('/api/admin/problems', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(row)
                          })
                          if (res.ok) successCount++
                        }

                        toast.success(`Imported ${successCount} problems`)
                          ; (document.getElementById('bulk-problems') as HTMLTextAreaElement).value = ''
                        fetchInitial()
                      } catch (e) {
                        console.error(e)
                        toast.error('Import failed')
                      }
                    }}
                    className="bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-none transition-all duration-200 border-0"
                  >
                    Import
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg_white/10" onClick={() => { const el = document.getElementById('bulk-problems') as HTMLTextAreaElement; if (el) el.value = '' }}>Clear</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editor */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>{editing ? 'Edit Problem' : 'Create Problem'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Title</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded p-2" />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">Difficulty</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full bg-white/5 border border-white/10 rounded p-2">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Points</label>
                      <input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Time (s)</label>
                      <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded p-2" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Memory (MB)</label>
                      <input type="number" value={memoryLimit} onChange={(e) => setMemoryLimit(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded p-2" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={10} className="w-full bg-white/5 border border-white/10 rounded p-2 min-h-40" />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm text-muted-foreground mb-1">Test Cases (JSON)</label>
                <textarea value={testCasesText} onChange={(e) => setTestCasesText(e.target.value)} rows={10} className="w-full bg-white/5 border border-white/10 rounded p-2 font-mono" />
              </div>
              <div className="mt-6 flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white font-medium hover:from-[#22C55E] hover:to-[#16A34A] shadow-lg shadow-[rgba(22,163,74,0.25)] transition-all duration-200 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                {editing && (
                  <Button variant="outline" onClick={resetForm} className="border-white/20 text-white hover:bg-white/10">
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {problems.map((p) => (
                  <div key={p.id} className="flex flex-col sm:flex-row items-start justify-between p-4 bg-white/5 rounded-lg gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{p.title}</h3>
                        <Badge className={
                          p.difficulty === 'easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                            p.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border-red-500/30'
                        }>{p.difficulty}</Badge>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{p.points} pts</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 flex-1 sm:flex-none"
                        onClick={() => startEdit(p)}
                        title="Edit Problem"
                      >
                        <span className="sm:hidden ml-2">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/20 text-red-400 hover:bg-red-500/10 flex-1 sm:flex-none"
                        onClick={() => handleDelete(p.id)}
                        title="Delete Problem"
                      >
                        <span className="sm:hidden ml-2">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
                {problems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">No problems yet</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
