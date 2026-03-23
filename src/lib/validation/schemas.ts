/**
 * Validation Schemas for codCampus API Endpoints
 * 
 * This file contains Zod schemas for validating all API request inputs.
 * Schemas validate request bodies, query parameters, and path parameters.
 * 
 * Security Features:
 * - Input sanitization to prevent XSS attacks
 * - Type validation to prevent injection attacks
 * - Length limits to prevent DoS attacks
 * - Format validation for emails, URLs, etc.
 */

import { z } from 'zod'

// ============================================================================
// HELPER SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' })

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email({ message: 'Invalid email format' })
  .max(255, { message: 'Email must be less than 255 characters' })
  .transform((email) => email.toLowerCase().trim())

/**
 * Sanitized string schema (prevents XSS)
 * Use this for short text inputs like names, usernames, etc.
 */
const sanitizedStringBase = z.string().transform((str) => {
  // Remove HTML tags and dangerous characters
  return str
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>'"]/g, '') // Remove dangerous characters
    .trim()
})

export const sanitizedStringSchema = sanitizedStringBase

/**
 * Create a sanitized string schema with min/max constraints
 */
export function createSanitizedString(min?: number, max?: number) {
  let schema = z.string()
  if (min !== undefined) {
    schema = schema.min(min, { message: `Must be at least ${min} characters` })
  }
  if (max !== undefined) {
    schema = schema.max(max, { message: `Must be less than ${max} characters` })
  }
  return schema.transform((str) => {
    return str
      .replace(/<[^>]*>/g, '')
      .replace(/[<>'"]/g, '')
      .trim()
  })
}

/**
 * Safe text schema (allows basic formatting but prevents XSS)
 */
const safeTextBase = z.string().transform((str) => {
  // Allow basic text but remove script tags and dangerous attributes
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim()
})

export const safeTextSchema = safeTextBase

/**
 * Create a safe text schema with max constraint
 */
export function createSafeText(max?: number) {
  let schema = z.string()
  if (max !== undefined) {
    schema = schema.max(max, { message: `Must be less than ${max} characters` })
  }
  return schema.transform((str) => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .trim()
  })
}

/**
 * Code schema (for code submissions)
 */
export const codeSchema = z
  .string()
  .min(1, { message: 'Code cannot be empty' })
  .max(50000, { message: 'Code must be less than 50000 characters' })

/**
 * Programming language schema
 */
export const languageSchema = z.enum([
  'javascript',
  'typescript',
  'python',
  'java',
  'cpp',
  'c',
  'csharp',
  'go',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin'
], { message: 'Invalid programming language' })

/**
 * Role schema
 */
export const roleSchema = z.enum(['student', 'admin'], {
  message: 'Role must be either student or admin'
})

/**
 * Approval status schema
 */
export const approvalStatusSchema = z.enum(['pending', 'approved', 'rejected'], {
  message: 'Approval status must be pending, approved, or rejected'
})

/**
 * Difficulty schema
 */
export const difficultySchema = z.enum(['easy', 'medium', 'hard'], {
  message: 'Difficulty must be easy, medium, or hard'
})

/**
 * Submission status schema
 */
export const submissionStatusSchema = z.enum([
  'pending',
  'accepted',
  'wrong_answer',
  'runtime_error',
  'time_limit_exceeded',
  'compilation_error'
], { message: 'Invalid submission status' })

// ============================================================================
// USER SCHEMAS
// ============================================================================

/**
 * User signup schema
 */
export const userSignupSchema = z.object({
  name: createSanitizedString(2, 100),
  email: emailSchema,
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(100, { message: 'Password must be less than 100 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  prn: createSanitizedString(5, 50).optional(),
  department: createSanitizedString(undefined, 100).optional()
})

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: 'Password is required' })
})

/**
 * User profile update schema
 */
export const userProfileUpdateSchema = z.object({
  name: createSanitizedString(2, 100).optional(),
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(50, { message: 'Username must be less than 50 characters' })
    .regex(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
    .transform((str) => str.trim())
    .optional(),
  bio: createSafeText(500).optional(),
  prn: createSanitizedString(undefined, 50).optional(),
  department: createSanitizedString(undefined, 100).optional(),
  github_url: z
    .string()
    .url({ message: 'Invalid GitHub URL' })
    .regex(/^https:\/\/(www\.)?github\.com\//, { message: 'Must be a valid GitHub URL' })
    .optional()
    .or(z.literal('')),
  linkedin_url: z
    .string()
    .url({ message: 'Invalid LinkedIn URL' })
    .regex(/^https:\/\/(www\.)?linkedin\.com\//, { message: 'Must be a valid LinkedIn URL' })
    .optional()
    .or(z.literal('')),
  instagram_url: z
    .string()
    .url({ message: 'Invalid Instagram URL' })
    .regex(/^https:\/\/(www\.)?instagram\.com\//, { message: 'Must be a valid Instagram URL' })
    .optional()
    .or(z.literal('')),
  profile_visible: z.boolean().optional()
})

/**
 * User approval schema
 */
export const userApprovalSchema = z.object({
  userId: uuidSchema,
  action: z.enum(['approve', 'reject'], { message: 'Action must be approve or reject' }),
  reason: createSanitizedString(undefined, 500).optional()
})

/**
 * Change role schema
 */
export const changeRoleSchema = z.object({
  userId: uuidSchema,
  role: roleSchema
})

// ============================================================================
// SUBMISSION SCHEMAS
// ============================================================================

/**
 * Code submission schema
 */
export const codeSubmissionSchema = z.object({
  problemId: uuidSchema,
  code: codeSchema,
  language: languageSchema,
  contestId: uuidSchema.optional()
})

/**
 * Submission query schema
 */
export const submissionQuerySchema = z.object({
  userId: uuidSchema.optional(),
  problemId: uuidSchema.optional(),
  contestId: uuidSchema.optional(),
  status: submissionStatusSchema.optional(),
  limit: z
    .string()
    .regex(/^\d+$/, { message: 'Limit must be a number' })
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .regex(/^\d+$/, { message: 'Offset must be a number' })
    .transform(Number)
    .pipe(z.number().min(0))
    .optional()
})

// ============================================================================
// PROBLEM SCHEMAS
// ============================================================================

/**
 * Test case schema
 */
export const testCaseSchema = z.object({
  input: z.string(),
  output: z.string(),
  isHidden: z.boolean().optional().default(false)
})

/**
 * Create problem schema
 */
export const createProblemSchema = z.object({
  title: createSanitizedString(5, 200),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(10000, { message: 'Description must be less than 10000 characters' })
    .transform((str) => {
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .trim()
    }),
  difficulty: difficultySchema,
  points: z
    .number()
    .int({ message: 'Points must be an integer' })
    .min(0, { message: 'Points must be non-negative' })
    .max(1000, { message: 'Points must be less than 1000' }),
  time_limit: z
    .number()
    .int({ message: 'Time limit must be an integer' })
    .min(100, { message: 'Time limit must be at least 100ms' })
    .max(30000, { message: 'Time limit must be less than 30000ms' })
    .optional()
    .default(1000),
  memory_limit: z
    .number()
    .int({ message: 'Memory limit must be an integer' })
    .min(16, { message: 'Memory limit must be at least 16MB' })
    .max(512, { message: 'Memory limit must be less than 512MB' })
    .optional()
    .default(128),
  test_cases: z
    .array(testCaseSchema)
    .min(1, { message: 'At least one test case is required' })
    .max(50, { message: 'Maximum 50 test cases allowed' })
})

/**
 * Update problem schema
 */
export const updateProblemSchema = createProblemSchema.partial().extend({
  id: uuidSchema
})

/**
 * Problem query schema
 */
export const problemQuerySchema = z.object({
  difficulty: difficultySchema.optional(),
  search: z.string()
    .max(100, { message: 'Search query must be less than 100 characters' })
    .transform((str) => str.replace(/<[^>]*>/g, '').replace(/[<>'"]/g, '').trim())
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/, { message: 'Limit must be a number' })
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .regex(/^\d+$/, { message: 'Offset must be a number' })
    .transform(Number)
    .pipe(z.number().min(0))
    .optional()
})

// ============================================================================
// CONTEST SCHEMAS
// ============================================================================

/**
 * Create contest schema
 */
export const createContestSchema = z.object({
  name: createSanitizedString(5, 200),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(10000, { message: 'Description must be less than 10000 characters' })
    .transform((str) => {
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .trim()
    })
    .optional(),
  start_time: z
    .string()
    .datetime({ message: 'Invalid start time format' })
    .refine((date) => new Date(date) > new Date(), {
      message: 'Start time must be in the future'
    }),
  end_time: z
    .string()
    .datetime({ message: 'Invalid end time format' })
}).refine((data) => new Date(data.end_time) > new Date(data.start_time), {
  message: 'End time must be after start time',
  path: ['end_time']
})

/**
 * Update contest schema
 */
export const updateContestSchema = z.object({
  id: uuidSchema,
  name: createSanitizedString(5, 200).optional(),
  description: z.string()
    .min(10, { message: 'Description must be at least 10 characters' })
    .max(10000, { message: 'Description must be less than 10000 characters' })
    .transform((str) => {
      return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
        .trim()
    })
    .optional(),
  start_time: z
    .string()
    .datetime({ message: 'Invalid start time format' })
    .optional(),
  end_time: z
    .string()
    .datetime({ message: 'Invalid end time format' })
    .optional()
})

/**
 * Contest registration schema
 */
export const contestRegistrationSchema = z.object({
  contestId: uuidSchema
})

/**
 * Contest query schema
 */
export const contestQuerySchema = z.object({
  status: z.enum(['upcoming', 'active', 'past'], { message: 'Invalid contest status' }).optional(),
  limit: z
    .string()
    .regex(/^\d+$/, { message: 'Limit must be a number' })
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .regex(/^\d+$/, { message: 'Offset must be a number' })
    .transform(Number)
    .pipe(z.number().min(0))
    .optional()
})

// ============================================================================
// LEADERBOARD SCHEMAS
// ============================================================================

/**
 * Leaderboard query schema
 */
export const leaderboardQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, { message: 'Limit must be a number' })
    .default('50')
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .regex(/^\d+$/, { message: 'Offset must be a number' })
    .default('0')
    .transform(Number)
    .pipe(z.number().min(0))
})

// ============================================================================
// SEARCH SCHEMAS
// ============================================================================

/**
 * User search schema
 */
export const userSearchSchema = z.object({
  query: z.string()
    .min(1, { message: 'Search query is required' })
    .max(100, { message: 'Search query must be less than 100 characters' })
    .transform((str) => str.replace(/<[^>]*>/g, '').replace(/[<>'"]/g, '').trim()),
  limit: z
    .string()
    .regex(/^\d+$/, { message: 'Limit must be a number' })
    .default('10')
    .transform(Number)
    .pipe(z.number().min(1).max(50))
})

// ============================================================================
// JUDGE0 SCHEMAS
// ============================================================================

/**
 * Judge0 submission schema
 */
export const judge0SubmissionSchema = z.object({
  source_code: codeSchema,
  language_id: z.number().int().min(1).max(100),
  stdin: z.string().max(10000).optional(),
  expected_output: z.string().max(10000).optional(),
  cpu_time_limit: z.number().min(0.1).max(30).optional(),
  memory_limit: z.number().int().min(1000).max(512000).optional()
})

// ============================================================================
// EXPORT ALL SCHEMAS
// ============================================================================

export const schemas = {
  // User schemas
  userSignup: userSignupSchema,
  userLogin: userLoginSchema,
  userProfileUpdate: userProfileUpdateSchema,
  userApproval: userApprovalSchema,
  changeRole: changeRoleSchema,
  
  // Submission schemas
  codeSubmission: codeSubmissionSchema,
  submissionQuery: submissionQuerySchema,
  
  // Problem schemas
  createProblem: createProblemSchema,
  updateProblem: updateProblemSchema,
  problemQuery: problemQuerySchema,
  
  // Contest schemas
  createContest: createContestSchema,
  updateContest: updateContestSchema,
  contestRegistration: contestRegistrationSchema,
  contestQuery: contestQuerySchema,
  
  // Leaderboard schemas
  leaderboardQuery: leaderboardQuerySchema,
  
  // Search schemas
  userSearch: userSearchSchema,
  
  // Judge0 schemas
  judge0Submission: judge0SubmissionSchema,
  
  // Helper schemas
  uuid: uuidSchema,
  email: emailSchema,
  sanitizedString: sanitizedStringSchema,
  safeText: safeTextSchema,
  code: codeSchema,
  language: languageSchema,
  role: roleSchema,
  approvalStatus: approvalStatusSchema,
  difficulty: difficultySchema,
  submissionStatus: submissionStatusSchema
}
