/**
 * useApiRequest Hook
 * 
 * Custom hook for making API requests with loading, error, and success states.
 * Reduces boilerplate code in components that make API calls.
 */

import { useState, useCallback } from 'react'

/**
 * API request state
 */
export interface ApiRequestState<T> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

/**
 * Custom hook for making API requests
 * 
 * @returns Object with state and execute function
 */
export function useApiRequest<T = any>() {
  const [state, setState] = useState<ApiRequestState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false
  })

  /**
   * Execute an API request
   * 
   * @param url - API endpoint URL
   * @param options - Request options
   */
  const execute = useCallback(async (
    url: string,
    options: ApiRequestOptions = {}
  ) => {
    const {
      method = 'GET',
      body,
      headers = {},
      onSuccess,
      onError
    } = options

    // Reset state and set loading
    setState({
      data: null,
      loading: true,
      error: null,
      success: false
    })

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Request failed')
      }

      // Success
      setState({
        data: data.data,
        loading: false,
        error: null,
        success: true
      })

      if (onSuccess) {
        onSuccess(data.data)
      }

      return data.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        success: false
      })

      if (onError) {
        onError(errorMessage)
      }

      throw error
    }
  }, [])

  /**
   * Reset the state
   */
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}
