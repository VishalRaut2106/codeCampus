/**
 * Component Props Types
 * 
 * TypeScript interfaces for React component props.
 */

import type { ReactNode } from 'react'
import type {
  User,
  Problem,
  Submission,
  Contest,
  LeaderboardEntry,
  ProgrammingLanguage,
  SubmissionStatus
} from './database'

// ============================================================================
// COMMON COMPONENT PROPS
// ============================================================================

/**
 * Base component props
 */
export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

/**
 * Loading state props
 */
export interface LoadingStateProps {
  loading: boolean
  error?: string | null
  children: ReactNode
}

/**
 * Error display props
 */
export interface ErrorDisplayProps {
  error: string | Error
  onRetry?: () => void
  className?: string
}

/**
 * Success confirmation props
 */
export interface SuccessConfirmationProps {
  message: string
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

// ============================================================================
// USER COMPONENT PROPS
// ============================================================================

/**
 * User profile props
 */
export interface UserProfileProps {
  user: User
  isOwnProfile?: boolean
  onUpdate?: (user: User) => void
}

/**
 * User card props
 */
export interface UserCardProps {
  user: User
  onClick?: (user: User) => void
  showActions?: boolean
  className?: string
}

/**
 * User search bar props
 */
export interface UserSearchBarProps {
  onSelect: (user: User) => void
  placeholder?: string
  className?: string
}

/**
 * Admin approval interface props
 */
export interface AdminApprovalInterfaceProps {
  students: User[]
  onApprove: (userId: string) => Promise<void>
  onReject: (userId: string, reason?: string) => Promise<void>
  loading?: boolean
}

// ============================================================================
// PROBLEM COMPONENT PROPS
// ============================================================================

/**
 * Problem card props
 */
export interface ProblemCardProps {
  problem: Problem
  onClick?: (problem: Problem) => void
  showDifficulty?: boolean
  showPoints?: boolean
  className?: string
}

/**
 * Problem list props
 */
export interface ProblemListProps {
  problems: Problem[]
  loading?: boolean
  onProblemClick?: (problem: Problem) => void
  emptyMessage?: string
}

/**
 * Problem stats props
 */
export interface ProblemStatsProps {
  problem: Problem
  userSolved?: boolean
  userAttempts?: number
}

// ============================================================================
// CODE EDITOR COMPONENT PROPS
// ============================================================================

/**
 * Code editor props
 */
export interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: ProgrammingLanguage
  onLanguageChange?: (language: ProgrammingLanguage) => void
  readOnly?: boolean
  height?: string
  theme?: 'vs-dark' | 'vs-light'
  className?: string
}

/**
 * Base code editor props
 */
export interface BaseCodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: ProgrammingLanguage
  readOnly?: boolean
  height?: string
  theme?: 'vs-dark' | 'vs-light'
}

/**
 * Contest code editor props
 */
export interface ContestCodeEditorProps extends CodeEditorProps {
  problemId: string
  contestId: string
  onSubmit: (code: string, language: ProgrammingLanguage) => Promise<void>
  submitting?: boolean
}

// ============================================================================
// SUBMISSION COMPONENT PROPS
// ============================================================================

/**
 * Submission card props
 */
export interface SubmissionCardProps {
  submission: Submission
  onClick?: (submission: Submission) => void
  showProblem?: boolean
  showUser?: boolean
  className?: string
}

/**
 * Submission list props
 */
export interface SubmissionListProps {
  submissions: Submission[]
  loading?: boolean
  onSubmissionClick?: (submission: Submission) => void
  emptyMessage?: string
}

/**
 * Submission status badge props
 */
export interface SubmissionStatusBadgeProps {
  status: SubmissionStatus
  className?: string
}

// ============================================================================
// CONTEST COMPONENT PROPS
// ============================================================================

/**
 * Contest card props
 */
export interface ContestCardProps {
  contest: Contest
  onClick?: (contest: Contest) => void
  isRegistered?: boolean
  onRegister?: (contestId: string) => Promise<void>
  className?: string
}

/**
 * Contest list props
 */
export interface ContestListProps {
  contests: Contest[]
  loading?: boolean
  onContestClick?: (contest: Contest) => void
  emptyMessage?: string
}

/**
 * Contest leaderboard props
 */
export interface ContestLeaderboardProps {
  contestId: string
  entries: LeaderboardEntry[]
  loading?: boolean
  currentUserId?: string
}

// ============================================================================
// LEADERBOARD COMPONENT PROPS
// ============================================================================

/**
 * Leaderboard props
 */
export interface LeaderboardProps {
  entries: LeaderboardEntry[]
  loading?: boolean
  currentUserId?: string
  onUserClick?: (userId: string) => void
}

/**
 * Leaderboard entry props
 */
export interface LeaderboardEntryProps {
  entry: LeaderboardEntry
  isCurrentUser?: boolean
  onClick?: () => void
  className?: string
}

// ============================================================================
// DASHBOARD COMPONENT PROPS
// ============================================================================

/**
 * Dashboard stats card props
 */
export interface DashboardStatsCardProps {
  title: string
  value: number | string
  icon?: ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  className?: string
}

/**
 * Admin dashboard props
 */
export interface AdminDashboardProps {
  stats: {
    totalUsers: number
    totalProblems: number
    totalSubmissions: number
    pendingApprovals: number
  }
  pendingStudents: User[]
  onApprove: (userId: string) => Promise<void>
  onReject: (userId: string, reason?: string) => Promise<void>
}

/**
 * Student dashboard props
 */
export interface StudentDashboardProps {
  user: User
  recentSubmissions: Submission[]
  recommendedProblems: Problem[]
  upcomingContests: Contest[]
}

// ============================================================================
// NAVIGATION COMPONENT PROPS
// ============================================================================

/**
 * Navbar props
 */
export interface NavbarProps {
  user?: User | null
  onLogout?: () => void
}

/**
 * Profile button props
 */
export interface ProfileButtonProps {
  user: User
  onLogout: () => void
}

// ============================================================================
// FORM COMPONENT PROPS
// ============================================================================

/**
 * Login form props
 */
export interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  loading?: boolean
  error?: string
}

/**
 * Signup form props
 */
export interface SignupFormProps {
  onSubmit: (data: {
    name: string
    email: string
    password: string
    prn?: string
    department?: string
  }) => Promise<void>
  loading?: boolean
  error?: string
}

/**
 * Profile edit form props
 */
export interface ProfileEditFormProps {
  user: User
  onSubmit: (data: Partial<User>) => Promise<void>
  loading?: boolean
  error?: string
}

// ============================================================================
// UTILITY COMPONENT PROPS
// ============================================================================

/**
 * Modal props
 */
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Pagination props
 */
export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

/**
 * Badge props
 */
export interface BadgeProps {
  text: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

/**
 * Contributions graph props
 */
export interface ContributionsGraphProps {
  userId: string
  data: Array<{
    date: string
    count: number
  }>
  className?: string
}
