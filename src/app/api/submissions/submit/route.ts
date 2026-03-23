import { NextRequest, NextResponse } from 'next/server'
import { judge0Client } from '@/lib/judge0/client'
import { createServerClientSafe, createServiceRoleClient } from '@/lib/supabase/server-safe'
import { wrapCodeForExecution } from '@/lib/code-templates'
import { withValidation } from '@/lib/validation/middleware'
import { withRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limit'
import { codeSubmissionSchema } from '@/lib/validation/schemas'
import { z } from 'zod'
import cacheManager from '@/lib/cache/cache-manager'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { updateUserStats } from '@/lib/services/user-stats'

// Extended schema with dryRun option
const submitSchema = codeSubmissionSchema.extend({
  dryRun: z.boolean().optional(),
  submissionId: z.string().optional() // Allow client to provide ID for realtime tracking
})

function normalize(s?: string | null) {
  if (!s) return '';
  let str = s.replace(/\r/g, '').trim();
  // Strip all spaces if it looks like an array or JSON to handle `[0, 1]` vs `[0,1]` formatting
  if ((str.startsWith('[') && str.endsWith(']')) || (str.startsWith('{') && str.endsWith('}'))) {
      str = str.replace(/\s+/g, '');
  }
  return str;
}

// Apply both validation and rate limiting
const handler = withValidation(
  async (request: NextRequest, { body }) => {
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Request body is required' },
        { status: 400 }
      )
    }

    const { problemId, contestId, code, language, dryRun, submissionId: clientSubmissionId } = body

    // --- SECURITY & AUTHENTICATION ---
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()
    
    // Require login for all submissions (except potentially dryRun if we wanted to allow guests, but let's be strict for now)
    if (!user && !dryRun) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Please log in to submit' 
      }, { status: 401 })
    }

    const userId = user?.id || null
    const supabase = createServerClientSafe()

    // Validate Contest Participation if contestId is present
    if (contestId && userId) {
      // Check if user is registered for the contest
      const { data: registration, error: regError } = await supabase
        .from('contest_registrations')
        .select('id')
        .eq('contest_id', contestId)
        .eq('user_id', userId)
        .single()
      
      if (regError || !registration) {
         return NextResponse.json({ 
          success: false, 
          error: 'Forbidden: You are not registered for this contest' 
        }, { status: 403 })
      }
    }
    // --- END SECURITY ---

    // Load problem and test cases with caching (5-minute TTL)
    const cacheKey = `problem:${problemId}:test_cases`
    
    const problem = await cacheManager.getOrFetch(
      { key: cacheKey, ttl: 300 }, // 5 minutes
      async () => {
        const { data, error: pErr } = await supabase
          .from('problems')
          .select('id, points, test_cases, function_name, parameters, return_type, code_snippets')
          .eq('id', problemId)
          .single()

        if (pErr || !data) {
          throw new Error('Problem not found')
        }

        return data
      }
    )

    if (!problem) {
      return NextResponse.json({ success: false, error: 'Problem not found' }, { status: 404 })
    }

    const tests: Array<{ input: string; expected_output: string }> = problem.test_cases || []
    if (!Array.isArray(tests) || tests.length === 0) {
      return NextResponse.json({ success: false, error: 'No test cases configured' }, { status: 400 })
    }

    const results: Array<{ idx: number; status: 'passed'|'failed'; time?: string; memory?: number; output?: string; error?: string; expected?: string }> = []
    let allPassed = true
    let executionError = ''

    // Generate submission ID for real-time tracking (use client provided if available)
    const submissionId = clientSubmissionId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Broadcast initial status
    try {
      await supabase.from('submission_status_updates').insert({
        submission_id: submissionId,
        user_id: userId, // Best effort to link user
        status: 'queued',
        message: 'Submission queued for execution',
        progress: 0,
        payload: { totalTestCases: tests.length }
      })
    } catch (e) {
      console.warn('Failed to broadcast initial status:', e)
    }

    // Execute all test cases in parallel for speed
    const testPromises = tests.map(async (t, i) => {
      try {
        // Wrap user code with main class/function for execution
        let wrappedCode: string
        try {
          wrappedCode = wrapCodeForExecution(code, language, t.input, {
             function_name: problem.function_name,
             parameters: problem.parameters,
             return_type: problem.return_type
          })
        } catch (wrapError) {
          return { 
            idx: i + 1, 
            status: 'failed' as const, 
            error: `Code wrapping failed: ${wrapError instanceof Error ? wrapError.message : 'Unknown error'}`,
            errorType: 'System Error',
            output: '',
            expected: normalize(t.expected_output)
          }
        }

        const res = await judge0Client.executeCode(wrappedCode, language, t.input)
        const out = normalize(res.stdout)
        const exp = normalize(t.expected_output)
        const passed = res.status.id === 3 && out === exp
        
        // Enhanced error messages with specific feedback and helpful suggestions
        let errorMsg = ''
        let errorType = ''
        let suggestion = ''
        
        if (!passed) {
          if (res.status.id === 6) {
            // Compilation Error
            errorType = 'Compilation Error'
            const compileError = res.compile_output || res.stderr || 'Code failed to compile'
            errorMsg = compileError
            
            // Provide helpful suggestions based on common compilation errors
            if (compileError.includes('SyntaxError') || compileError.includes('syntax error')) {
              suggestion = 'Check for missing brackets, parentheses, or semicolons'
            } else if (compileError.includes('undefined') || compileError.includes('not defined')) {
              suggestion = 'Make sure all variables and functions are properly defined before use'
            } else if (compileError.includes('type') || compileError.includes('Type')) {
              suggestion = 'Check that you are using the correct data types'
            } else if (compileError.includes('import') || compileError.includes('module')) {
              suggestion = 'Verify your import statements and module names'
            } else {
              suggestion = 'Review your code syntax and fix any compilation errors'
            }
          } else if (res.status.id === 5 || res.status.id === 14) {
            // Time Limit Exceeded
            errorType = 'Time Limit Exceeded'
            errorMsg = 'Your solution took too long to execute (> 5 seconds)'
            suggestion = 'Optimize your algorithm - consider using more efficient data structures or reducing time complexity'
          } else if (res.status.id === 4) {
            // Wrong Answer
            errorType = 'Wrong Answer'
            errorMsg = `Expected: "${exp}", Got: "${out}"`
            suggestion = 'Review the problem requirements and check your logic for edge cases'
          } else if (res.status.id === 11 || res.status.id === 12) {
            // Runtime Error
            errorType = 'Runtime Error'
            const runtimeError = res.stderr || 'Your code crashed during execution'
            errorMsg = runtimeError
            
            // Provide helpful suggestions based on common runtime errors
            if (runtimeError.includes('IndexError') || runtimeError.includes('index out of range') || runtimeError.includes('ArrayIndexOutOfBoundsException')) {
              suggestion = 'Check array/list bounds - you may be accessing an invalid index'
            } else if (runtimeError.includes('NullPointerException') || runtimeError.includes('null') || runtimeError.includes('None')) {
              suggestion = 'Check for null/None values before accessing object properties'
            } else if (runtimeError.includes('DivisionByZero') || runtimeError.includes('division by zero')) {
              suggestion = 'Add a check to prevent division by zero'
            } else if (runtimeError.includes('StackOverflow') || runtimeError.includes('maximum recursion')) {
              suggestion = 'Your recursion may be too deep - check your base case or use iteration'
            } else if (runtimeError.includes('MemoryError') || runtimeError.includes('OutOfMemoryError')) {
              suggestion = 'Your solution uses too much memory - try to optimize memory usage'
            } else {
              suggestion = 'Debug your code to find where the crash occurs'
            }
          } else if (res.status.id === 13) {
            // Internal Error
            errorType = 'System Error'
            errorMsg = 'Judge system error, please try again'
            suggestion = 'This is a temporary system issue - please retry your submission'
          } else if (res.status.id === 3 && !passed) {
            // Output mismatch
            errorType = 'Wrong Answer'
            errorMsg = `Expected: "${exp}", Got: "${out}"`
            suggestion = 'Check for extra spaces, newlines, or formatting differences in your output'
          } else {
            // Other errors
            errorType = 'Execution Error'
            errorMsg = res.status.description || 'Unknown execution error'
            suggestion = 'Please review your code and try again'
          }
        }
        
        return { 
          idx: i + 1, 
          status: passed ? 'passed' as const : 'failed' as const, 
          time: res.time, 
          memory: res.memory, 
          output: out || '', 
          expected: exp,
          error: errorMsg || undefined,
          errorType: errorType || undefined,
          suggestion: suggestion || undefined,
          statusId: res.status.id
        }
      } catch (e: any) {
        return { 
          idx: i + 1, 
          status: 'failed' as const, 
          error: e?.message || 'Network or system error',
          errorType: 'System Error',
          suggestion: 'Please check your network connection and try again',
          output: '',
          expected: normalize(t.expected_output)
        }
      }
    })

    // Broadcast processing status as tests complete
    let completedCount = 0
    let lastProgress = 0
    
    const updateProgress = async (result: any) => {
      completedCount++
      const currentProgress = Math.round((completedCount / tests.length) * 100)
      
      // Throttle updates: only update every 10% or on completion
      if (currentProgress >= lastProgress + 10 || completedCount === tests.length) {
        lastProgress = currentProgress
        try {
          await supabase.from('submission_status_updates').insert({
            submission_id: submissionId,
            user_id: userId,
            status: 'processing',
            message: `Executing test case ${completedCount}/${tests.length}`,
            progress: currentProgress,
            payload: { 
              completed: completedCount, 
              total: tests.length,
              lastResult: result
            }
          })
        } catch (e) {
          console.warn('Failed to broadcast progress:', e)
        }
      }
    }

    const testResults = await Promise.all(testPromises.map(async p => {
      const result = await p
      await updateProgress(result)
      return result
    }))
    results.push(...testResults)
    
    // Check if all passed
    allPassed = testResults.every(r => r.status === 'passed')
    
    // Get first error for user feedback
    const firstError = testResults.find(r => r.status === 'failed')
    if (firstError) {
      executionError = firstError.error || 'Some test cases failed'
    }

    // Broadcast final status
    try {
      await supabase.from('submission_status_updates').insert({
        submission_id: submissionId,
        user_id: userId,
        status: 'completed',
        message: allPassed ? 'All test cases passed!' : executionError,
        progress: 100,
        payload: { 
          allPassed, 
          results: results,
          error: executionError
        }
      })
    } catch (e) {
      console.warn('Failed to broadcast completion:', e)
    }

    if (dryRun) {
      return NextResponse.json({ success: true, allPassed, results, error: executionError })
    }

    // User ID is already fetched at the start of the handler

    // Record submission and award points atomically using database function
    let status = allPassed ? 'accepted' : 'wrong_answer'
    
    // Check if contest has ended (if contestId is provided)
    // If ended, we still accept the solution but award 0 points
    let finalPoints = problem.points
    
    if (contestId && allPassed) {
      try {
        const { data: contestData } = await supabase
          .from('contests')
          .select('end_time')
          .eq('id', contestId)
          .single()
          
        if (contestData && new Date() > new Date(contestData.end_time)) {
           // Contest ended, award 0 points
           finalPoints = 0
           // Optional: You could change status to 'accepted_late' if your DB supports it
           // but keeping 'accepted' with 0 points is standard for "upsolving"
        }
      } catch (e) {
        // Ignore error, proceed with default points
      }
    }
    
    // Calculate execution metrics
    const totalExecutionTime = results.reduce((sum, r) => {
      const time = parseFloat(r.time || '0')
      return sum + (isNaN(time) ? 0 : time)
    }, 0)
    
    const maxMemory = Math.max(...results.map(r => r.memory || 0))
    
    if (userId) {
      // Use atomic database function to record submission and award points
      try {
        const { data: result, error: rpcError } = await supabase.rpc('record_submission_with_points', {
          p_user_id: userId,
          p_problem_id: problemId,
          p_contest_id: contestId || null,
          p_language: language,
          p_code: code,
          p_status: status,
          p_execution_time: totalExecutionTime,
          p_memory_used: maxMemory,
          p_test_cases_passed: results.filter(r => r.status === 'passed').length,
          p_total_test_cases: tests.length,
          p_points: finalPoints
        })
        
        if (rpcError) {
          console.error('Error calling record_submission_with_points:', rpcError)
          // Fallback to manual insertion if RPC fails
          const { data: subData, error: insError } = await supabase.from('submissions').insert({
            user_id: userId,
            contest_id: contestId || null,
            problem_id: problemId,
            code,
            language,
            status,
            execution_time: totalExecutionTime,
            memory_used: maxMemory,
            test_cases_passed: results.filter(r => r.status === 'passed').length,
            total_test_cases: tests.length,
            score: allPassed ? finalPoints : 0,
          }).select().single()

          // If accepted, award points manually via fallback
          if (!insError && status === 'accepted') {
             await supabase.rpc('award_points_for_solve', {
               p_user_id: userId,
               p_problem_id: problemId,
               p_points: finalPoints
             })
             
             // Trigger background updates
             updateUserStats(userId).catch((err: any) => console.error('Failed to update stats background:', err))
          }
        } else if (result && result.length > 0) {
          const submissionResult = result[0]
          
          // If points were awarded (first solve), trigger background updates
          if (submissionResult.points_awarded) {
            // Update ranks dynamically (fire and forget)
            // SECIRE: Use INTERNAL_API_KEY for background tasks
            fetch(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/leaderboard/update-ranks`, {
              method: 'POST',
              headers: { 'x-internal-key': process.env.INTERNAL_API_KEY || 'default-secret' }
            }).catch(() => {})

            // Direct service call for reliability (no HTTP loopback)
            updateUserStats(userId).catch((err: any) => console.error('Failed to update stats background:', err))

          }
        }
      } catch (error) {
        console.error('Error in atomic submission recording:', error)
        // Fallback to manual insertion
        await supabase.from('submissions').insert({
          user_id: userId,
          contest_id: contestId || null,
          problem_id: problemId,
          code,
          language,
          status,
          execution_time: totalExecutionTime,
          memory_used: maxMemory,
          test_cases_passed: results.filter(r => r.status === 'passed').length,
          total_test_cases: tests.length,
          score: allPassed ? finalPoints : 0,
        })
      }
    } else {
      // No user ID (shouldn't happen with strict auth, but keeps Type Safety)
      await supabase.from('submissions').insert({
        user_id: null,
        contest_id: contestId || null,
        problem_id: problemId,
        code,
        language,
        status,
        execution_time: totalExecutionTime,
        memory_used: maxMemory,
        test_cases_passed: results.filter(r => r.status === 'passed').length,
        total_test_cases: tests.length,
        score: 0,
      })
    }

    return NextResponse.json({ success: true, allPassed, results })
  },
  {
    bodySchema: submitSchema
  }
)

// Export with rate limiting
export const POST = withRateLimit(handler, rateLimitConfigs.submissions)
