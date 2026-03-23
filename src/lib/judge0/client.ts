// Judge0 API client for code compilation and execution
// Using local or self-hosted Judge0 instances

import { submissionQueue } from './submission-queue'
import { retryWithBackoff, shouldRetryJudge0Error } from './retry-logic'
import { configurationManager, ConfigurationError } from './configuration-manager'

interface SubmissionRequest {
  source_code: string
  language_id: number
  stdin?: string
  expected_output?: string
  cpu_time_limit?: number
  memory_limit?: number
}

interface SubmissionResponse {
  token: string
  status: {
    id: number
    description: string
  }
  stdout?: string
  stderr?: string
  compile_output?: string
  time?: string
  memory?: number
  exit_code?: number
}

interface Language {
  id: number
  name: string
  extensions: string[]
}

// Supported languages mapping
export const LANGUAGES: Record<string, Language> = {
  javascript: { id: 63, name: 'JavaScript (Node.js)', extensions: ['js'] },
  python: { id: 71, name: 'Python (3.8.1)', extensions: ['py'] },
  java: { id: 62, name: 'Java (OpenJDK 13.0.1)', extensions: ['java'] },
  cpp: { id: 54, name: 'C++ (GCC 9.2.0)', extensions: ['cpp', 'cc', 'cxx'] },
  c: { id: 50, name: 'C (GCC 9.2.0)', extensions: ['c'] },
  csharp: { id: 51, name: 'C# (Mono 6.6.0.161)', extensions: ['cs'] },
  go: { id: 60, name: 'Go (1.13.5)', extensions: ['go'] },
  rust: { id: 73, name: 'Rust (1.40.0)', extensions: ['rs'] },
  php: { id: 68, name: 'PHP (7.4.1)', extensions: ['php'] },
  ruby: { id: 72, name: 'Ruby (2.7.0)', extensions: ['rb'] },
  swift: { id: 83, name: 'Swift (5.2.3)', extensions: ['swift'] },
  kotlin: { id: 78, name: 'Kotlin (1.3.70)', extensions: ['kt'] },
  scala: { id: 81, name: 'Scala (2.13.2)', extensions: ['scala'] },
  r: { id: 80, name: 'R (4.0.0)', extensions: ['r'] },
  matlab: { id: 82, name: 'MATLAB (R2019b)', extensions: ['m'] },
  typescript: { id: 74, name: 'TypeScript (3.7.4)', extensions: ['ts'] },
  dart: { id: 75, name: 'Dart (2.6.0)', extensions: ['dart'] },
  lua: { id: 64, name: 'Lua (5.3.5)', extensions: ['lua'] },
  perl: { id: 85, name: 'Perl (5.26.2)', extensions: ['pl'] },
  haskell: { id: 61, name: 'Haskell (Glasgow 8.8.1)', extensions: ['hs'] },
  clojure: { id: 86, name: 'Clojure (1.10.1)', extensions: ['clj'] },
  elixir: { id: 57, name: 'Elixir (1.9.4)', extensions: ['ex'] },
  erlang: { id: 58, name: 'Erlang (OTP 22.2)', extensions: ['erl'] },
  fortran: { id: 59, name: 'Fortran (GFortran 9.2.0)', extensions: ['f90', 'f95', 'f03'] },
  pascal: { id: 67, name: 'Pascal (FPC 3.0.4)', extensions: ['pas'] },
  cobol: { id: 77, name: 'COBOL (GnuCOBOL 2.2)', extensions: ['cob'] },
  bash: { id: 46, name: 'Bash (5.0.0)', extensions: ['sh'] },
  sql: { id: 82, name: 'SQL (SQLite 3.27.2)', extensions: ['sql'] },
  html: { id: 30, name: 'HTML (5.0.0)', extensions: ['html', 'htm'] },
  css: { id: 31, name: 'CSS (3.0.0)', extensions: ['css'] },
  xml: { id: 32, name: 'XML (1.0.0)', extensions: ['xml'] },
  json: { id: 35, name: 'JSON (1.0.0)', extensions: ['json'] },
  yaml: { id: 36, name: 'YAML (1.2.0)', extensions: ['yaml', 'yml'] },
  markdown: { id: 37, name: 'Markdown (1.0.0)', extensions: ['md'] },
}

export class Judge0Client {
  private configManager: typeof configurationManager
  private healthCheckCache: { isHealthy: boolean; lastCheck: number } | null = null
  private readonly HEALTH_CHECK_CACHE_DURATION = 30000 // 30 seconds

  constructor(configManager?: typeof configurationManager) {
    this.configManager = configManager || configurationManager
  }

  /**
   * Get the current Judge0 endpoint from configuration manager
   */
  private getEndpoint(): string {
    try {
      return this.configManager.getJudge0Endpoint()
    } catch (error) {
      console.error('Failed to get Judge0 endpoint:', error)
      throw new Error(`Judge0 configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Browser-compatible base64 encode
   */
  private toBase64(str: string): string {
    if (typeof window !== 'undefined') {
      // Browser: use TextEncoder + btoa
      const bytes = new TextEncoder().encode(str)
      let binary = ''
      bytes.forEach(b => binary += String.fromCharCode(b))
      return btoa(binary)
    } else {
      // Node.js (SSR / API routes)
      return Buffer.from(str, 'utf8').toString('base64')
    }
  }

  /**
   * Browser-compatible base64 decode
   */
  private fromBase64(str: string): string {
    if (typeof window !== 'undefined') {
      // Browser: use atob + TextDecoder
      const binary = atob(str)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return new TextDecoder().decode(bytes)
    } else {
      // Node.js (SSR / API routes)
      return Buffer.from(str, 'base64').toString('utf8')
    }
  }

  /**
   * Get headers for Judge0 requests, including RapidAPI headers when configured
   */
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add RapidAPI headers if configured
    if (this.configManager.isRapidAPIConfigured()) {
      const apiKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_RAPIDAPI_KEY : ''
      if (apiKey) {
        headers['X-RapidAPI-Key'] = apiKey
        headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com'
      }
    }

    return headers
  }

  /**
   * Validate endpoint before making requests
   */
  private async validateEndpointBeforeRequest(): Promise<void> {
    try {
      const endpoint = this.getEndpoint()

      // Use cached health check if available and recent
      if (this.healthCheckCache && 
          (Date.now() - this.healthCheckCache.lastCheck) < this.HEALTH_CHECK_CACHE_DURATION) {
        if (!this.healthCheckCache.isHealthy) {
          throw new Error(`Judge0 instance at ${endpoint} is not healthy (cached result)`)
        }
        return
      }

      // Perform health check and cache result
      const isHealthy = await this.performHealthCheck(endpoint)
      this.healthCheckCache = {
        isHealthy,
        lastCheck: Date.now()
      }

      if (!isHealthy) {
        throw new Error(`Judge0 instance at ${endpoint} is not healthy`)
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error
      }
      throw new Error(`Endpoint validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Perform health check on Judge0 instance
   */
  private async performHealthCheck(endpoint: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${endpoint}/languages`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.warn(`Health check failed for ${endpoint}:`, error)
      return false
    }
  }

  /**
   * Handle configuration changes by clearing health check cache
   */
  public handleConfigurationChange(): void {
    this.healthCheckCache = null
    console.log('[Judge0Client] Configuration changed, health check cache cleared')
  }

  /**
   * Submit code for execution (with retry logic)
   */
  async submitCode(request: SubmissionRequest): Promise<string> {
    // Validate endpoint before making request
    await this.validateEndpointBeforeRequest()

    const retryConfig = this.configManager.getRetryConfig()
    
    return retryWithBackoff(
      async () => {
        try {
          // Validate input
          if (!request.source_code || !request.source_code.trim()) {
            throw new Error('Source code is required')
          }
          
          if (!request.language_id || request.language_id <= 0) {
            throw new Error('Valid language ID is required')
          }

          const endpoint = this.getEndpoint()
          const url = `${endpoint}/submissions?base64_encoded=true&wait=false`
          
          // Encode source code and stdin to base64 to handle UTF-8 issues
          const sourceCodeBase64 = this.toBase64(request.source_code)
          const stdinBase64 = request.stdin ? this.toBase64(request.stdin) : ''
          const expectedOutputBase64 = request.expected_output ? this.toBase64(request.expected_output) : null
          
          const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
              source_code: sourceCodeBase64,
              language_id: request.language_id,
              stdin: stdinBase64,
              expected_output: expectedOutputBase64,
              cpu_time_limit: request.cpu_time_limit || 2,
              memory_limit: request.memory_limit || 128000,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
          }

          const data: SubmissionResponse = await response.json()
          
          if (!data.token) {
            throw new Error('No token received from Judge0 API')
          }
          
          return data.token
        } catch (error) {
          console.error('Error submitting code:', error)
          throw new Error(`Failed to submit code for execution: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      },
      {
        maxRetries: retryConfig.maxAttempts - 1, // maxAttempts includes initial attempt
        baseDelay: retryConfig.baseDelay,
        shouldRetry: shouldRetryJudge0Error
      }
    )
  }

  /**
   * Get submission result by token (with retry logic)
   */
  async getSubmission(token: string): Promise<SubmissionResponse> {
    const retryConfig = this.configManager.getRetryConfig()
    
    return retryWithBackoff(
      async () => {
        try {
          if (!token || !token.trim()) {
            throw new Error('Valid token is required')
          }

          const endpoint = this.getEndpoint()
          const url = `${endpoint}/submissions/${token}?base64_encoded=true`
          const response = await fetch(url, {
            method: 'GET',
            headers: this.getHeaders(),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
          }

          const data: SubmissionResponse = await response.json()
          
          if (!data.status) {
            throw new Error('Invalid response format from Judge0 API')
          }
          
          // Decode base64 encoded fields
          if (data.stdout) {
            try {
              data.stdout = this.fromBase64(data.stdout)
            } catch (e) {
              // If decoding fails, keep original value
            }
          }
          
          if (data.stderr) {
            try {
              data.stderr = this.fromBase64(data.stderr)
            } catch (e) {
              // If decoding fails, keep original value
            }
          }
          
          if (data.compile_output) {
            try {
              data.compile_output = this.fromBase64(data.compile_output)
            } catch (e) {
              // If decoding fails, keep original value
            }
          }
          
          return data
        } catch (error) {
          console.error('Error getting submission:', error)
          throw new Error(`Failed to get submission result: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      },
      {
        maxRetries: retryConfig.maxAttempts - 1, // maxAttempts includes initial attempt
        baseDelay: retryConfig.baseDelay,
        shouldRetry: shouldRetryJudge0Error
      }
    )
  }

  /**
   * Submit code and wait for result (with queuing)
   */
  async executeCode(
    sourceCode: string,
    language: string,
    stdin?: string,
    expectedOutput?: string
  ): Promise<SubmissionResponse> {
    const languageInfo = LANGUAGES[language.toLowerCase()]
    if (!languageInfo) {
      throw new Error(`Unsupported language: ${language}`)
    }

    // Validate source code
    if (!sourceCode || sourceCode.trim().length === 0) {
      throw new Error('Source code cannot be empty')
    }

    // Generate unique ID for this submission
    const submissionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Enqueue the submission to limit concurrent Judge0 API calls
    return submissionQueue.enqueue(submissionId, async () => {
      // Submit code with enhanced limits
      const token = await this.submitCode({
        source_code: sourceCode,
        language_id: languageInfo.id,
        stdin: stdin || '',
        expected_output: expectedOutput,
        cpu_time_limit: 5, // 5 seconds max
        memory_limit: 256000, // 256MB max
      })

      // Poll for result with exponential backoff
      let attempts = 0
      const maxAttempts = 40
      let delay = 500 // Start with 500ms

      while (attempts < maxAttempts) {
        const result = await this.getSubmission(token)

        // Check if processing is complete (status >= 3)
        if (result.status.id >= 3) {
          // Add additional validation
          if (result.status.id === 3 && !result.stdout && !result.stderr) {
            // Successful execution but no output - might be an issue
            result.stdout = result.stdout || ''
          }
          return result
        }

        // Exponential backoff with jitter
        const jitter = Math.random() * 200
        await new Promise(resolve => setTimeout(resolve, delay + jitter))
        delay = Math.min(delay * 1.2, 2000) // Cap at 2 seconds
        attempts++
      }

      // Return timeout error with proper status
      return {
        token,
        status: {
          id: 14, // Time Limit Exceeded during judging
          description: 'Execution timed out - code took too long to run'
        },
        stdout: '',
        stderr: 'Time limit exceeded',
        time: '5.000',
        memory: 0
      }
    })
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    return submissionQueue.getStats()
  }

  /**
   * Get all supported languages
   */
  async getLanguages(): Promise<Language[]> {
    try {
      // Validate endpoint before making request
      await this.validateEndpointBeforeRequest()
      
      const endpoint = this.getEndpoint()
      const response = await fetch(`${endpoint}/languages`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting languages:', error)
      // Return our predefined languages if API fails
      return Object.values(LANGUAGES)
    }
  }

  /**
   * Validate code syntax (basic check)
   */
  /**
   * Validate code syntax (basic check)
   * Only checks if code is non-empty — let Judge0 handle real compilation/syntax validation
   */
  validateCode(sourceCode: string, language: string): { valid: boolean; error?: string } {
    const languageInfo = LANGUAGES[language.toLowerCase()]
    if (!languageInfo) {
      return { valid: false, error: 'Unsupported language' }
    }

    if (!sourceCode || sourceCode.trim().length === 0) {
      return { valid: false, error: 'Source code cannot be empty' }
    }

    return { valid: true }
  }

  /**
   * Check Judge0 instance connectivity and health
   */
  async checkHealth(): Promise<{ healthy: boolean; endpoint: string; error?: string }> {
    try {
      const endpoint = this.getEndpoint()
      const isHealthy = await this.performHealthCheck(endpoint)
      
      return {
        healthy: isHealthy,
        endpoint,
        error: isHealthy ? undefined : 'Health check failed'
      }
    } catch (error) {
      const endpoint = this.configManager.getJudge0Endpoint()
      return {
        healthy: false,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get current configuration summary
   */
  getConfigurationSummary(): {
    endpoint: string;
    environment: 'development' | 'production';
    isRapidAPI: boolean;
    healthStatus: 'unknown' | 'healthy' | 'unhealthy';
    lastHealthCheck?: number;
  } {
    try {
      const configSummary = this.configManager.getConfigurationSummary()
      
      let healthStatus: 'unknown' | 'healthy' | 'unhealthy' = 'unknown'
      if (this.healthCheckCache) {
        healthStatus = this.healthCheckCache.isHealthy ? 'healthy' : 'unhealthy'
      }

      return {
        endpoint: configSummary.endpoint,
        environment: configSummary.environment,
        isRapidAPI: configSummary.isRapidAPI,
        healthStatus,
        lastHealthCheck: this.healthCheckCache?.lastCheck
      }
    } catch (error) {
      return {
        endpoint: 'INVALID',
        environment: 'development',
        isRapidAPI: false,
        healthStatus: 'unknown'
      }
    }
  }

  /**
   * Force refresh health check cache
   */
  async refreshHealthCheck(): Promise<boolean> {
    try {
      const endpoint = this.getEndpoint()
      const isHealthy = await this.performHealthCheck(endpoint)
      
      this.healthCheckCache = {
        isHealthy,
        lastCheck: Date.now()
      }
      
      return isHealthy
    } catch (error) {
      console.error('Failed to refresh health check:', error)
      return false
    }
  }
}

// Create default client instance
export const judge0Client = new Judge0Client()
