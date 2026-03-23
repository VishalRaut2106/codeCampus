'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import CodeEditor from '@/components/CodeEditor'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Clock,
  Square,
  Trophy,
  Target,
} from 'lucide-react'

interface Contest {
  id: string
  name: string
  description: string
  start_time: string
  end_time: string
  created_by: string
}

interface Question {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  test_cases: Array<{
    input: string
    expectedOutput: string
    description?: string
  }>
}

interface Submission {
  id: string
  status: 'pending' | 'accepted' | 'wrong' | 'runtime_error' | 'time_limit_exceeded'
  score: number
  submitted_at?: string
  created_at?: string
}

type ContestStatus = 'not_started' | 'running' | 'ended'

export default function ContestPage() {
  const params = useParams()
  const router = useRouter()
  const contestId = params.id as string
  const supabase = createClient()

  const [contest, setContest] = useState<Contest | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [contestStatus, setContestStatus] = useState<ContestStatus>('not_started')
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [contestStarted, setContestStarted] = useState(false)
  const [loading, setLoading] = useState(true)

  // Timer effect
  useEffect(() => {
    if (contestStatus === 'running') {
      const timer = setInterval(() => {
        const now = new Date().getTime()
        const endTime = new Date(contest?.end_time || '').getTime()
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000))

        setTimeRemaining(remaining)

        if (remaining === 0) {
          setContestStatus('ended')
          toast.info('Contest has ended!')
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [contestStatus, contest?.end_time])

  // Auto-submit when contest ends
  useEffect(() => {
    if (contestStatus === 'ended' && contestStarted) {
      handleAutoSubmit()
    }
  }, [contestStatus])

  useEffect(() => {
    const fetchContestData = async () => {
      try {
        // Fetch contest details
        const { data: contestData } = await supabase
          .from('contests')
          .select('*')
          .eq('id', contestId)
          .single()

        if (contestData) {
          setContest(contestData)

          const now = new Date()
          const startTime = new Date(contestData.start_time)
          const endTime = new Date(contestData.end_time)

          if (now < startTime) {
            setContestStatus('not_started')
          } else if (now >= startTime && now <= endTime) {
            setContestStatus('running')
            setContestStarted(true)
          } else {
            setContestStatus('ended')
          }

          // Fetch questions
          const { data: questionsData } = await supabase
            .from('problems')
            .select('*')
            .eq('contest_id', contestId)
            .order('id')

          if (questionsData) {
            setQuestions(questionsData)
            if (questionsData.length > 0) {
              setSelectedQuestion(questionsData[0])
            }
          }

          // Fetch user submissions for this contest
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: submissionsData } = await supabase
              .from('submissions')
              .select('*')
              .eq('student_id', user.id)
              .eq('contest_id', contestId)

            if (submissionsData) {
              const submissionsMap: Record<string, Submission> = {}
              submissionsData.forEach(sub => {
                submissionsMap[sub.question_id] = {
                  id: sub.id,
                  status: sub.status,
                  score: sub.score,
                  submitted_at: sub.submitted_at,
                  created_at: sub.created_at
                }
              })
              setSubmissions(submissionsMap)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching contest data:', error)
        toast.error('Failed to load contest data')
      } finally {
        setLoading(false)
      }
    }

    if (contestId) {
      fetchContestData()
    }
  }, [contestId, supabase])

  const handleStartContest = () => {
    setContestStarted(true)
    setContestStatus('running')
    toast.success('Contest started! Good luck!')
  }

  const handleSubmitCode = async (code: string, language: string) => {
    if (!selectedQuestion || !contestStarted) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to submit code')
        return
      }

      // Submit to Judge0
      const result = await fetch('/api/judge0/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          testCases: selectedQuestion.test_cases
        }),
      })

      if (!result.ok) {
        throw new Error('Failed to submit code')
      }

      const judgeResult = await result.json()

      // Save submission to database
      const { error } = await supabase
        .from('submissions')
        .insert({
          student_id: user.id,
          contest_id: contestId,
          question_id: selectedQuestion.id,
          code,
          language,
          status: judgeResult.status === 'accepted' ? 'accepted' : 'wrong',
          score: judgeResult.status === 'accepted' ? 100 : 0
        })

      if (error) {
        console.error('Error saving submission:', error)
        toast.error('Failed to save submission')
        return
      }

      // Update local state
      setSubmissions(prev => ({
        ...prev,
        [selectedQuestion.id]: {
          id: 'temp',
          status: judgeResult.status === 'accepted' ? 'accepted' : 'wrong',
          score: judgeResult.status === 'accepted' ? 100 : 0,
          submitted_at: new Date().toISOString()
        }
      }))

      if (judgeResult.status === 'accepted') {
        toast.success('🎉 Solution accepted!')
      } else {
        toast.error('❌ Solution is incorrect. Try again!')
      }
    } catch (error) {
      console.error('Error submitting code:', error)
      toast.error('Failed to submit code')
    }
  }

  const handleAutoSubmit = async () => {
    toast.info('Contest ended. Auto-submitting your current code...')
    // Auto-submit current code if contest ends
    // This would be implemented based on the current editor state
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <span className="text-green-400 font-bold">✓</span>
      case 'wrong': return <span className="text-red-400 font-bold">✗</span>
      case 'pending': return <span className="text-yellow-400 font-bold">...</span>
      default: return <span className="text-gray-400 font-bold">-</span>
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#00C896]"></div>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card">
          <CardContent className="text-center p-8">

            <h2 className="text-2xl font-bold mb-2">Contest Not Found</h2>
            <p className="text-muted-foreground">The contest you&apos;re looking for doesn&apos;t exist.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Contest Header */}
      <div className="glass-card m-6 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">{contest.name}</h1>
            <p className="text-muted-foreground mt-1">{contest.description}</p>
          </div>

          <div className="flex items-center gap-4">
            {contestStatus === 'not_started' && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Not Started
              </Badge>
            )}
            {contestStatus === 'running' && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                Running
              </Badge>
            )}
            {contestStatus === 'ended' && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                Ended
              </Badge>
            )}

            {contestStatus === 'running' && (
              <div className={`px-4 py-2 rounded-lg text-sm font-mono ${timeRemaining < 300 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'
                }`}>
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
        </div>

        {/* Contest Actions */}
        <div className="flex items-center gap-4">
          {contestStatus === 'not_started' && (
            <Button
              onClick={handleStartContest}
              className="bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-none transition-all duration-200 border-0"
            >
              Start Contest
            </Button>
          )}

          {contestStatus === 'running' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Contest in progress...</span>
            </div>
          )}

          {contestStatus === 'ended' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Contest completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Contest Content */}
      {contestStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 m-6">
          {/* Questions Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glass-card sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Problems</CardTitle>
                <CardDescription>
                  {questions.length} problems • {Object.values(submissions).filter(s => s.status === 'accepted').length} solved
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {questions.map((question, index) => {
                    const submission = submissions[question.id]
                    const isSelected = selectedQuestion?.id === question.id

                    return (
                      <div
                        key={question.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/5 hover:bg-white/10'
                          }`}
                        onClick={() => setSelectedQuestion(question)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Problem {index + 1}</span>
                          {submission && getStatusIcon(submission.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </Badge>
                          {submission?.status === 'accepted' && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">
                              Solved
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-3">
            {selectedQuestion ? (
              <div className="space-y-6">
                {/* Problem Description */}
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{selectedQuestion.title}</CardTitle>
                      <Badge className={getDifficultyColor(selectedQuestion.difficulty)}>
                        {selectedQuestion.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: selectedQuestion.description }} />
                    </div>

                    {selectedQuestion.test_cases.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3">Sample Test Cases:</h4>
                        <div className="space-y-3">
                          {selectedQuestion.test_cases.slice(0, 2).map((testCase, index) => (
                            <div key={index} className="p-3 bg-white/5 rounded-lg">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="font-medium text-green-400 mb-1">Input:</p>
                                  <pre className="bg-black/30 p-2 rounded text-xs overflow-x-auto">
                                    {testCase.input}
                                  </pre>
                                </div>
                                <div>
                                  <p className="font-medium text-blue-400 mb-1">Expected Output:</p>
                                  <pre className="bg-black/30 p-2 rounded text-xs overflow-x-auto">
                                    {testCase.expectedOutput}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Code Editor */}
                <CodeEditor
                  contestMode={true}
                  timeRemaining={timeRemaining}
                  testCases={selectedQuestion.test_cases}
                  onSubmit={handleSubmitCode}
                  language="javascript"
                />

                {/* Submission History */}
                {submissions[selectedQuestion.id] && (
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-lg">Submission History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(submissions[selectedQuestion.id].status)}
                            <span className="capitalize">{submissions[selectedQuestion.id].status}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Score: {submissions[selectedQuestion.id].score}/100
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="glass-card">
                <CardContent className="text-center p-12">

                  <h3 className="text-xl font-semibold mb-2">No Problem Selected</h3>
                  <p className="text-muted-foreground">Select a problem from the sidebar to start coding.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Contest Not Started */}
      {!contestStarted && contestStatus === 'not_started' && (
        <div className="m-6">
          <Card className="glass-card text-center p-12">

            <h2 className="text-2xl font-bold mb-4">Contest Not Started</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              This contest will begin at {new Date(contest.start_time).toLocaleString()}.
              You&apos;ll be able to start coding once the contest begins.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Start: {new Date(contest.start_time).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>{questions.length} Problems</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Contest Ended */}
      {contestStatus === 'ended' && (
        <div className="m-6">
          <Card className="glass-card text-center p-12">

            <h2 className="text-2xl font-bold mb-4">Contest Completed!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for participating! Check your submissions and view the leaderboard.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                className="bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-none transition-all duration-200 border-0"
                onClick={() => router.push('/leaderboard')}
              >
                View Leaderboard
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                View My Submissions
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
