/**
 * Editor Service Types
 * 
 * TypeScript interfaces for the LeetCode-style editor services.
 */

import type { ProgrammingLanguage, TestResult } from '@/types'

// ============================================================================
// CODE PERSISTENCE TYPES
// ============================================================================

/**
 * Stored code in localStorage
 */
export interface StoredCode {
  code: string
  language: ProgrammingLanguage
  problemId: string
  savedAt: string // ISO timestamp
  version: number // for migration support
}

/**
 * Split view preferences
 */
export interface SplitViewPreferences {
  ratio: number // 0-100
  lastUpdated: string
}

/**
 * Editor preferences
 */
export interface EditorPreferences {
  fontSize: number
  theme: 'light' | 'dark'
  minimap: boolean
  wordWrap: 'on' | 'off'
  tabSize: number
}

/**
 * Custom input storage
 */
export interface StoredCustomInput {
  problemId: string
  inputs: string[]
  savedAt: string
}

// ============================================================================
// CODE TEMPLATE TYPES
// ============================================================================

/**
 * Problem metadata for template generation
 */
export interface ProblemMetadata {
  id: string
  title: string
  functionName: string
  parameters: Parameter[]
  returnType: string
  description: string
}

/**
 * Function parameter
 */
export interface Parameter {
  name: string
  type: string
}

/**
 * Code template
 */
export interface CodeTemplate {
  language: ProgrammingLanguage
  template: string
  description: string
}

/**
 * Enhanced code template with metadata
 */
export interface EnhancedCodeTemplate {
  id: string
  name: string
  languageId: number
  language: ProgrammingLanguage
  code: string
  description?: string
  category: TemplateCategory
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Template category enumeration
 */
export enum TemplateCategory {
  ALGORITHM = 'algorithm',
  DATA_STRUCTURE = 'data_structure',
  WEB_DEVELOPMENT = 'web_development',
  COMPETITIVE_PROGRAMMING = 'competitive_programming',
  CUSTOM = 'custom',
  DEFAULT = 'default'
}

// ============================================================================
// EXECUTION FEEDBACK TYPES
// ============================================================================

/**
 * Test case result with enhanced feedback
 */
export interface TestCaseResult {
  index: number
  passed: boolean
  input: string
  expectedOutput: string
  actualOutput: string
  executionTime: number
  memoryUsed: number
  error?: string
  errorType?: string
  suggestion?: string
}

/**
 * Console output
 */
export interface ConsoleOutput {
  stdout: string
  stderr: string
  compileOutput?: string
}

/**
 * Execution results
 */
export interface ExecutionResults {
  status: ExecutionStatus
  testCases: TestCaseResult[]
  consoleOutput: ConsoleOutput
  executionTime: number
  memoryUsed: number
  totalTestCases: number
  passedTestCases: number
}

/**
 * Execution status
 */
export type ExecutionStatus =
  | 'accepted'
  | 'wrong_answer'
  | 'compilation_error'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'memory_limit_exceeded'

/**
 * Raw test result from Judge0
 */
export interface RawTestResult {
  status: {
    id: number
    description: string
  }
  stdout?: string
  stderr?: string
  compile_output?: string
  time?: string
  memory?: number
}

/**
 * Error category
 */
export interface ErrorCategory {
  type: 'compilation' | 'runtime' | 'timeout' | 'wrong_answer' | 'memory_limit'
  title: string
  message: string
  suggestion: string
  severity: 'error' | 'warning' | 'info'
}

/**
 * Diff result for output comparison
 */
export interface DiffResult {
  expected: string
  actual: string
  differences: Difference[]
}

/**
 * Character difference
 */
export interface Difference {
  position: number
  expectedChar: string
  actualChar: string
}

// ============================================================================
// REALTIME STATUS TYPES
// ============================================================================

export interface RealtimeExecutionStatus {
  status: 'queued' | 'processing' | 'completed' | 'error'
  message: string
  progress: number
  payload?: any
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Enhanced submission request
 */
export interface EnhancedSubmissionRequest {
  problemId: string
  contestId?: string
  code: string
  language: ProgrammingLanguage
  dryRun: boolean // true for "Run", false for "Submit"
  customInput?: string // for custom input testing
}

/**
 * Enhanced submission response
 */
export interface EnhancedSubmissionResponse {
  success: boolean
  allPassed: boolean
  results: TestCaseResult[]
  executionTime: number
  memoryUsed: number
  status: ExecutionStatus
  error?: string
}

/**
 * Template request
 */
export interface TemplateRequest {
  problemId: string
  language: ProgrammingLanguage
}

/**
 * Template response
 */
export interface TemplateResponse {
  template: string
  language: ProgrammingLanguage
  problemId: string
}
