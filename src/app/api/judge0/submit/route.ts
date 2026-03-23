import { NextRequest, NextResponse } from 'next/server'
import { judge0Client } from '@/lib/judge0/client'
import { ConfigurationError } from '@/lib/judge0/configuration-manager'
import { wrapCodeForExecution } from '@/lib/code-templates'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { source_code, language_id, stdin, expected_output } = body

    if (!source_code) {
      return NextResponse.json({ error: 'Source code is required' }, { status: 400 })
    }

    try {
      // Try to execute code using the real Judge0 client
      // This will check health and submit to the configured endpoint (local or remote)
      const languageMap: Record<number, string> = {
        63: 'javascript',
        71: 'python',
        62: 'java',
        54: 'cpp',
        50: 'c'
      }
      
      const languageName = languageMap[language_id] || 'python'
      
      // Wrap code with boilerplate before execution
      const wrappedCode = wrapCodeForExecution(source_code, languageName, stdin || '')
      
      const result = await judge0Client.executeCode(
        wrappedCode,
        languageName,
        stdin,
        expected_output
      )

      return NextResponse.json(result)
      
    } catch (error) {
      console.error('Judge0 execution failed:', error)
      
      // Return the actual error so users know what went wrong
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return NextResponse.json({
        token: 'error-' + Date.now(),
        status: {
          id: 13,
          description: 'Internal Error'
        },
        stdout: '',
        stderr: '',
        compile_output: '',
        message: `Judge0 service error: ${errorMessage}. Make sure Judge0 is running (docker-compose up in the judge0 folder) or configure a RapidAPI key.`,
        time: '0',
        memory: 0
      }, { status: 503 })
    }

  } catch (error) {
    return NextResponse.json({
      error: 'Submission failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}