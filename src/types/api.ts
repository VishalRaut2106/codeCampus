/**
 * API Request/Response Types
 * 
 * TypeScript interfaces for all API endpoint requests and responses.
 */

import type {
  User,
  Problem,
  Submission,
  Contest,
  LeaderboardEntry,
  TestResult,
  UserRole,
  ApprovalStatus,
  ProgrammingLanguage,
  ProblemDifficulty
} from './database'

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

// ============================================================================
// USER API TYPES
// ============================================================================

/**
 * User signup request
 */
export interface UserSignupRequest {
  name: string
  email: string
  password: string
  prn?: string
  department?: string
}

/**
 * User login request
 */
export interface UserLoginRequest {
  email: string
  password: string
}

/**
 * User profile update request
 */
export interface UserProfileUpdateRequest {
  name?: string
  username?: string
  bio?: string
  prn?: string
  department?: string
  github_url?: string
  linkedin_url?: string
  instagram_url?: string
  profile_visible?: boolean
}

/**
 * User approval request
 */
export interface UserApprovalRequest {
  userId: string
  action: 'approve' | 'reject'
  reason?: string
}

/**
 * Change role request
 */
export interface ChangeRoleRequest {
  userId: string
  role: UserRole
}

/**
 * User profile response
 */
export interface UserProfileResponse extends User {
  solved_problems?: number
  total_submissions?: number
}

// ============================================================================
// SUBMISSION API TYPES
// ============================================================================

/**
 * Code submission request
 */
export interface CodeSubmissionRequest {
  problemId: string
  code: string
  language: ProgrammingLanguage
  contestId?: string
}

/**
 * Submission response
 */
export interface SubmissionResponse {
  submission: Submission
  allPassed: boolean
  results: TestResult[]
  executionTime: number
  pointsAwarded: number
}

/**
 * Submission query params
 */
export interface SubmissionQueryParams {
  userId?: string
  problemId?: string
  contestId?: string
  status?: string
  limit?: number
  offset?: number
}

// ============================================================================
// PROBLEM API TYPES
// ============================================================================

/**
 * Create problem request
 */
export interface CreateProblemRequest {
  title: string
  description: string
  difficulty: ProblemDifficulty
  points: number
  time_limit?: number
  memory_limit?: number
  test_cases: Array<{
    input: string
    output: string
    isHidden?: boolean
  }>
}

/**
 * Update problem request
 */
export interface UpdateProblemRequest extends Partial<CreateProblemRequest> {
  id: string
}

/**
 * Problem query params
 */
export interface ProblemQueryParams {
  difficulty?: ProblemDifficulty
  search?: string
  limit?: number
  offset?: number
}

/**
 * Problem with user stats
 */
export interface ProblemWithStats extends Problem {
  user_solved?: boolean
  user_attempts?: number
}

// ============================================================================
// CONTEST API TYPES
// ============================================================================

/**
 * Create contest request
 */
export interface CreateContestRequest {
  name: string
  description?: string
  start_time: string
  end_time: string
  problem_ids?: string[]
}

/**
 * Update contest request
 */
export interface UpdateContestRequest extends Partial<CreateContestRequest> {
  id: string
}

/**
 * Contest registration request
 */
export interface ContestRegistrationRequest {
  contestId: string
}

/**
 * Contest query params
 */
export interface ContestQueryParams {
  status?: 'upcoming' | 'active' | 'past'
  limit?: number
  offset?: number
}

/**
 * Contest with registration status
 */
export interface ContestWithStatus extends Contest {
  is_registered?: boolean
  participant_count?: number
  problem_count?: number
}

/**
 * Contest leaderboard entry
 */
export interface ContestLeaderboardEntry {
  user_id: string
  name: string
  username?: string
  total_points: number
  problems_solved: number
  rank: number
}

// ============================================================================
// LEADERBOARD API TYPES
// ============================================================================

/**
 * Leaderboard query params
 */
export interface LeaderboardQueryParams {
  limit?: number
  offset?: number
}

/**
 * Leaderboard response
 */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[]
  total: number
  userRank?: number
}

// ============================================================================
// SEARCH API TYPES
// ============================================================================

/**
 * User search request
 */
export interface UserSearchRequest {
  query: string
  limit?: number
}

/**
 * User search response
 */
export interface UserSearchResponse {
  users: User[]
  total: number
}

// ============================================================================
// DASHBOARD API TYPES
// ============================================================================

/**
 * Dashboard stats response
 */
export interface DashboardStatsResponse {
  totalUsers: number
  totalProblems: number
  totalSubmissions: number
  totalContests: number
  pendingApprovals: number
  activeUsers: number
}

/**
 * Admin dashboard data response
 */
export interface AdminDashboardResponse {
  stats: DashboardStatsResponse
  pendingStudents: User[]
  recentSubmissions: Submission[]
  upcomingContests: Contest[]
}

/**
 * Student dashboard data response
 */
export interface StudentDashboardResponse {
  user: UserProfileResponse
  recentSubmissions: Submission[]
  recommendedProblems: Problem[]
  upcomingContests: Contest[]
}

// ============================================================================
// BATCH API TYPES
// ============================================================================

/**
 * Batch request item
 */
export interface BatchRequestItem {
  id: string
  endpoint: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  params?: Record<string, any>
  body?: any
}

/**
 * Batch response item
 */
export interface BatchResponseItem {
  id: string
  success: boolean
  data?: any
  error?: string
  status: number
}

/**
 * Batch request
 */
export interface BatchRequest {
  requests: BatchRequestItem[]
}

/**
 * Batch response
 */
export interface BatchResponse {
  results: BatchResponseItem[]
  totalRequests: number
  successCount: number
  errorCount: number
}

// ============================================================================
// MONITORING API TYPES
// ============================================================================

/**
 * Metrics query params
 */
export interface MetricsQueryParams {
  endpoint?: string
  startTime?: string
  endTime?: string
  limit?: number
}

/**
 * Metrics response
 */
export interface MetricsResponse {
  totalRequests: number
  averageResponseTime: number
  errorRate: number
  slowestEndpoints: Array<{
    endpoint: string
    averageTime: number
    count: number
  }>
}

/**
 * Alert query params
 */
export interface AlertQueryParams {
  type?: 'critical' | 'warning' | 'info'
  resolved?: boolean
  limit?: number
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: {
    database: {
      status: 'up' | 'down'
      responseTime?: number
    }
    judge0: {
      status: 'up' | 'down'
      responseTime?: number
    }
    realtime: {
      status: 'up' | 'down'
    }
  }
}
