/**
 * API Batch Endpoint
 * Combines multiple API requests into a single call to reduce network overhead
 * Requirements: 5.1
 */

import { NextRequest, NextResponse } from 'next/server'

interface BatchRequest {
  id: string
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, any>
  body?: any
}

interface BatchResponse {
  success: boolean
  results: Record<string, {
    success: boolean
    data?: any
    error?: string
    status?: number
  }>
  executionTime: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { requests } = await request.json() as { requests: BatchRequest[] }
    
    // Validate input
    if (!Array.isArray(requests) || requests.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: requests must be a non-empty array',
        },
        { status: 400 }
      )
    }

    // Validate each request has required fields
    for (const req of requests) {
      if (!req.id || !req.endpoint) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request: each request must have id and endpoint',
          },
          { status: 400 }
        )
      }
    }

    // Execute all requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (req) => {
        try {
          // Validate endpoint to prevent SSRF
          if (!req.endpoint.startsWith('/') || req.endpoint.includes('://') || req.endpoint.includes('..')) {
             throw new Error('Invalid endpoint: must be a relative path starting with /')
          }

          // Build URL with query parameters
          // Use the incoming request's origin to ensure we stay on the same domain
          const url = new URL(req.endpoint, request.url)
          
          if (req.params) {
            Object.entries(req.params).forEach(([key, value]) => {
              url.searchParams.append(key, String(value))
            })
          }

          // Create request options
          const options: RequestInit = {
            method: req.method || 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Forward authentication headers
              ...(request.headers.get('cookie') && {
                cookie: request.headers.get('cookie')!,
              }),
            },
          }

          // Add body for POST/PUT requests
          if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
            options.body = JSON.stringify(req.body)
          }

          // Make the request
          const response = await fetch(url.toString(), options)
          const data = await response.json()

          return {
            id: req.id,
            success: response.ok,
            data: data,
            status: response.status,
          }
        } catch (error) {
          return {
            id: req.id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 500,
          }
        }
      })
    )

    // Process results and handle partial failures
    const processedResults: Record<string, any> = {}
    let hasFailures = false

    results.forEach((result, index) => {
      const requestId = requests[index].id
      
      if (result.status === 'fulfilled') {
        processedResults[requestId] = result.value
        if (!result.value.success) {
          hasFailures = true
        }
      } else {
        processedResults[requestId] = {
          success: false,
          error: result.reason?.message || 'Request failed',
          status: 500,
        }
        hasFailures = true
      }
    })

    const executionTime = Date.now() - startTime

    // Return combined response
    return NextResponse.json({
      success: !hasFailures,
      results: processedResults,
      executionTime,
      metadata: {
        totalRequests: requests.length,
        successfulRequests: Object.values(processedResults).filter(
          (r) => r.success
        ).length,
        failedRequests: Object.values(processedResults).filter(
          (r) => !r.success
        ).length,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
