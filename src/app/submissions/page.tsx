'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Timer, ArrowLeft, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Submission {
  id: string
  submitted_at?: string
  created_at?: string // Fallback property
  status: string
  language: string
  problem: {
    id: string
    title: string
    difficulty: string
  }
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error } = await supabase
          .from('submissions')
          .select(`
            id,
            submitted_at,
            status,
            language,
            problem:problems(id, title, difficulty)
          `)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })

        if (data) {
          const formattedData = data.map((sub: any) => ({
            ...sub,
            // Map backend submitted_at to frontend created_at if we want to keep frontend interface, 
            // OR better, update frontend interface.
            // Let's update frontend interface to match backend.
            submitted_at: sub.submitted_at,
            problem: Array.isArray(sub.problem) ? sub.problem[0] : sub.problem
          })).filter((sub: any) => sub.problem) // specific check to filter out null problems

          setSubmissions(formattedData)
        }
      } catch (error) {
        console.error('Error loading submissions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [router, supabase])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'wrong_answer': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'wrong_answer': return <XCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <Timer className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">My Submissions</h1>
        </div>

        <div className="grid gap-4">
          {submissions.length === 0 ? (
            <Card className="bg-card border-white/5">
              <CardContent className="p-12 text-center text-muted-foreground">
                No submissions found. Start solving problems!
              </CardContent>
            </Card>
          ) : (
            submissions.map((sub) => (
              <Card key={sub.id} className="bg-card border-white/5 hover:border-white/10 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={`flex gap-2 items-center px-3 py-1 ${getStatusColor(sub.status)}`}>
                      {getStatusIcon(sub.status)}
                      <span className="capitalize">{sub.status.replace('_', ' ')}</span>
                    </Badge>

                    <div>
                      <h3 className="font-semibold text-lg hover:text-primary cursor-pointer" onClick={() => router.push(`/problems/${sub.problem.id}`)}>
                        {sub.problem.title}
                      </h3>
                      <div className="text-sm text-muted-foreground flex gap-3">
                        <span>{new Date(sub.submitted_at || sub.created_at || new Date().toISOString()).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{sub.language}</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant="secondary" className="bg-white/5">
                    {sub.problem.difficulty}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
