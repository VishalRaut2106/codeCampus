'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import ResizableContestEditor from '@/components/ResizableContestEditor'
import {
  ArrowLeft
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
  created_at: string
  updated_at: string
}

export default function ProblemPage() {
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchProblem()
    }
  }, [params.id])

  const fetchProblem = async () => {
    try {
      const { data, error } = await supabase
        .from('problems')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setProblem(data)
    } catch (error) {
      console.error('Error fetching problem:', error)
      toast.error('Failed to load problem')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (code: string, language: string) => {
    try {
      const res = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          problemId: params.id, 
          code, 
          language, 
          dryRun: false 
        })
      })
      
      const ct = res.headers.get('content-type') || ''
      const data = ct.includes('application/json') 
        ? await res.json() 
        : { success: false, error: await res.text() }
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Submission failed')
      }
      
      if (!data.allPassed) {
        const passed = data.results?.filter((r: any) => r.status === 'passed').length || 0
        const total = data.results?.length || 0
        throw new Error(`${passed}/${total} test cases passed`)
      }
      
      const points = problem?.points || 0
      toast.success(`🎉 Accepted! +${points} points awarded. Rank updated.`)
      // Stay on the same page — do NOT redirect
    } catch (error: any) {
      throw error
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00C896]"></div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Problem not found</h1>
          <p className="text-muted-foreground mt-2">The problem you&apos;re looking for doesn&apos;t exist</p>
          <Button onClick={() => router.push('/problems')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Problems
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ResizableContestEditor 
      problem={problem}
      contestId=""
      isContestActive={true}
      onSubmit={async (code, language) => {
        try {
          await handleSubmit(code, language)
        } catch (error: any) {
          toast.error(error?.message || 'Submission failed')
        }
      }}
    />
  )
}
