'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Save, X, FileCode } from 'lucide-react'

interface CreateContestProblemProps {
  contestId: string
  contestName: string
  onProblemCreated: (problemId: string) => void
}

export default function CreateContestProblem({ contestId, contestName, onProblemCreated }: CreateContestProblemProps) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [timeLimit, setTimeLimit] = useState('2000')
  const [memoryLimit, setMemoryLimit] = useState('128')
  const [testCases, setTestCases] = useState('[]')
  const [isExclusive, setIsExclusive] = useState(true)

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDifficulty('easy')
    setTimeLimit('2000')
    setMemoryLimit('128')
    setTestCases('[]')
    setIsExclusive(true)
    setShowForm(false)
  }

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      toast.error('Problem title is required')
      return
    }

    if (title.length < 3) {
      toast.error('Problem title must be at least 3 characters')
      return
    }

    if (!description.trim()) {
      toast.error('Problem description is required')
      return
    }

    if (description.length < 20) {
      toast.error('Problem description must be at least 20 characters')
      return
    }

    // Validate time and memory limits
    const timeLimitNum = parseInt(timeLimit)
    const memoryLimitNum = parseInt(memoryLimit)

    if (isNaN(timeLimitNum) || timeLimitNum < 100 || timeLimitNum > 10000) {
      toast.error('Time limit must be between 100ms and 10000ms')
      return
    }

    if (isNaN(memoryLimitNum) || memoryLimitNum < 16 || memoryLimitNum > 1024) {
      toast.error('Memory limit must be between 16MB and 1024MB')
      return
    }

    setSaving(true)
    const loadingToast = toast.loading('Creating problem...')

    try {
      // Parse and validate test cases
      let parsedTestCases = []
      if (testCases.trim() && testCases !== '[]') {
        try {
          parsedTestCases = JSON.parse(testCases)
          
          // Validate test case format
          if (!Array.isArray(parsedTestCases)) {
            throw new Error('Test cases must be an array')
          }

          // Validate each test case has input and output
          for (let i = 0; i < parsedTestCases.length; i++) {
            const tc = parsedTestCases[i]
            if (!tc.input || !tc.output) {
              throw new Error(`Test case ${i + 1} must have both "input" and "output" fields`)
            }
          }
        } catch (parseError) {
          toast.error(`Invalid test cases JSON: ${parseError instanceof Error ? parseError.message : 'Invalid format'}`, { id: loadingToast })
          setSaving(false)
          return
        }
      }

      // Calculate points based on difficulty
      const points = difficulty === 'easy' ? 100 : difficulty === 'medium' ? 200 : 300

      // Create the problem
      const { data: problem, error: problemError } = await supabase
        .from('problems')
        .insert({
          title: title.trim(),
          description: description.trim(),
          difficulty,
          points,
          time_limit: timeLimitNum,
          memory_limit: memoryLimitNum,
          test_cases: parsedTestCases,
        })
        .select()
        .single()

      if (problemError) {
        console.error('Problem creation error:', problemError)
        
        // Handle specific errors
        if (problemError.message?.includes('duplicate')) {
          throw new Error('A problem with this title already exists')
        } else if (problemError.message?.includes('permission')) {
          throw new Error('You do not have permission to create problems. Please ensure you are an approved admin.')
        } else {
          throw new Error(problemError.message || 'Failed to create problem')
        }
      }

      if (!problem) {
        throw new Error('Problem was created but no data was returned')
      }

      toast.loading('Assigning problem to contest...', { id: loadingToast })

      // Assign problem to contest
      const { error: assignError } = await supabase
        .from('contest_problems')
        .insert({
          contest_id: contestId,
          problem_id: problem.id,
          points: points,
          order_index: 0, // Will be updated by admin if needed
        })

      if (assignError) {
        console.error('Problem assignment error:', assignError)
        
        // Problem was created but assignment failed - inform user
        toast.warning(`Problem "${title}" was created but couldn't be assigned to contest. You can assign it manually.`, { id: loadingToast })
        
        // Still call the callback so the problem list refreshes
        onProblemCreated(problem.id)
        resetForm()
        return
      }

      toast.success(`✅ Problem "${title}" created and assigned to contest!`, { id: loadingToast })
      onProblemCreated(problem.id)
      resetForm()
    } catch (error) {
      console.error('Create problem error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to create problem: ${errorMessage}`, { id: loadingToast })
    } finally {
      setSaving(false)
    }
  }

  if (!showForm) {
    return (
      <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
              <FileCode className="h-4 w-4 text-purple-400" />
              Create New Problem for This Contest
            </h4>
            <p className="text-xs text-muted-foreground">
              Create a brand new problem that will be exclusive to this contest
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Problem
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="glass-card border-purple-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-purple-400" />
              Create New Problem
            </CardTitle>
            <CardDescription>
              Creating for: <span className="font-semibold text-foreground">{contestName}</span>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetForm}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Problem Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Two Sum"
                className="w-full bg-white/5 border border-white/10 rounded p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Difficulty *
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full bg-white/5 border border-white/10 rounded p-2"
              >
                <option value="easy">Easy (100 points)</option>
                <option value="medium">Medium (200 points)</option>
                <option value="hard">Hard (300 points)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Visibility
              </label>
              <select
                value={isExclusive ? 'exclusive' : 'public'}
                onChange={(e) => setIsExclusive(e.target.value === 'exclusive')}
                className="w-full bg-white/5 border border-white/10 rounded p-2"
              >
                <option value="exclusive">Contest Exclusive (visible only during contest)</option>
                <option value="public">Public (visible in problems list immediately)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Problem Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              placeholder="Describe the problem in detail. Include:&#10;- Problem statement&#10;- Input format&#10;- Output format&#10;- Constraints&#10;- Examples"
              className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Tip: Include input/output format, constraints, and examples in the description
            </p>
          </div>

          {/* Test Cases */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Test Cases (JSON format)
            </label>
            <textarea
              value={testCases}
              onChange={(e) => setTestCases(e.target.value)}
              rows={6}
              placeholder='[{"input": "1 2", "output": "3"}, {"input": "5 10", "output": "15"}]'
              className="w-full bg-white/5 border border-white/10 rounded p-2 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Format: Array of objects with "input" and "output" fields. Leave as [] if adding later.
            </p>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Time Limit (ms)
              </label>
              <input
                type="number"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Memory Limit (MB)
              </label>
              <input
                type="number"
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded p-2"
              />
            </div>
          </div>

          {/* Info Badge */}
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> This problem will be assigned to the contest "{contestName}". 
              {isExclusive 
                ? " It will be exclusive to this contest and become public after the contest ends (requires COMPLETE_CONTEST_SYSTEM.sql)." 
                : " It will be immediately visible in the public problems list."}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Creating...' : 'Create & Assign Problem'}
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
