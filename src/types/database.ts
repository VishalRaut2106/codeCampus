/**
 * Database Model Types
 * 
 * TypeScript interfaces for all database tables and models.
 * These types ensure type safety across the application.
 */

/**
 * User role enum
 */
export type UserRole = 'student' | 'admin'

/**
 * Approval status enum
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

/**
 * Problem difficulty enum
 */
export type ProblemDifficulty = 'easy' | 'medium' | 'hard'

/**
 * Submission status enum
 */
export type SubmissionStatus =
  | 'pending'
  | 'accepted'
  | 'wrong_answer'
  | 'runtime_error'
  | 'time_limit_exceeded'
  | 'compilation_error'

/**
 * Programming language enum
 */
export type ProgrammingLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'ruby'
  | 'php'
  | 'swift'
  | 'kotlin'

/**
 * User model
 */
export interface User {
  id: string
  name: string
  email: string
  username?: string
  role: UserRole
  approval_status: ApprovalStatus
  prn?: string
  department?: string
  points: number
  streak: number
  badges: string[]
  bio?: string
  github_url?: string
  linkedin_url?: string
  instagram_url?: string
  profile_visible: boolean
  created_at: string
  updated_at: string
}

/**
 * Problem model
 */
export interface Problem {
  id: string
  title: string
  description: string
  difficulty: ProblemDifficulty
  points: number
  time_limit: number
  memory_limit: number
  test_cases: TestCase[]
  solved_count: number
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Test case model
 */
export interface TestCase {
  input: string
  output: string
  isHidden?: boolean
}

/**
 * Submission model
 */
export interface Submission {
  id: string
  user_id: string
  problem_id: string
  contest_id?: string
  code?: string
  language: ProgrammingLanguage
  status: SubmissionStatus
  execution_time?: number
  memory_used?: number
  test_results?: TestResult[]
  error_message?: string
  points_awarded: number
  submitted_at?: string
  created_at?: string // Legacy/Fallback
}

/**
 * Test result model
 */
export interface TestResult {
  index: number
  status: 'passed' | 'failed'
  time?: string
  memory?: number
  output?: string
  expected?: string
  error?: string
  errorType?: string
}

/**
 * Contest model
 */
export interface Contest {
  id: string
  name: string
  description?: string
  start_time: string
  end_time: string
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * Contest registration model
 */
export interface ContestRegistration {
  id: string
  user_id: string
  contest_id: string
  registered_at: string
}

/**
 * Contest problem model
 */
export interface ContestProblem {
  id: string
  contest_id: string
  problem_id: string
  order: number
  created_at: string
}

/**
 * Leaderboard entry model
 */
export interface LeaderboardEntry {
  id: string
  name: string
  username?: string
  points: number
  streak: number
  badges: string[]
  rank: number
  solved_count?: number
}

/**
 * Badge model
 */
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: string
}

/**
 * Error log model
 */
export interface ErrorLog {
  id: string
  user_id?: string
  endpoint: string
  error_message: string
  stack_trace?: string
  context?: Record<string, any>
  created_at: string
}

/**
 * Metrics model
 */
export interface Metrics {
  id: string
  endpoint: string
  method: string
  status_code: number
  response_time: number
  timestamp: string
}

/**
 * Alert model
 */
export interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info'
  message: string
  details?: Record<string, any>
  resolved: boolean
  created_at: string
  resolved_at?: string
}
