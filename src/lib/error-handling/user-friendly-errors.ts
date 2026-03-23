// User-Friendly Error Messages
// Maps technical errors to user-friendly messages with actionable suggestions

export interface UserFriendlyError {
  title: string
  message: string
  suggestion: string
  isRetryable: boolean
  severity: 'info' | 'warning' | 'error' | 'critical'
}

/**
 * Error code mappings for common errors
 */
const ERROR_MAPPINGS: Record<string, UserFriendlyError> = {
  // Database Errors
  '42P17': {
    title: 'Database Configuration Error',
    message: 'There is a configuration issue with the database security policies.',
    suggestion: 'Please contact an administrator to run the database fix script.',
    isRetryable: false,
    severity: 'critical'
  },
  'PGRST116': {
    title: 'Database Table Not Found',
    message: 'A required database table is missing.',
    suggestion: 'Please run the database setup from the admin panel.',
    isRetryable: false,
    severity: 'critical'
  },
  'PGRST301': {
    title: 'Profile Not Found',
    message: 'Your user profile could not be found.',
    suggestion: 'Try logging out and logging back in. If the problem persists, contact support.',
    isRetryable: true,
    severity: 'error'
  },
  '42501': {
    title: 'Permission Denied',
    message: 'You do not have permission to perform this action.',
    suggestion: 'Check your account status or contact an administrator.',
    isRetryable: false,
    severity: 'warning'
  },
  '42P01': {
    title: 'Database Migration Required',
    message: 'The database schema needs to be updated.',
    suggestion: 'Please contact an administrator to run the latest database migrations.',
    isRetryable: false,
    severity: 'critical'
  },
  'EMPTY_ERROR': {
    title: 'Connection Issue',
    message: 'Unable to connect to the database.',
    suggestion: 'Check your internet connection and try refreshing the page.',
    isRetryable: true,
    severity: 'error'
  },

  // Authentication Errors
  'auth/invalid-credentials': {
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect.',
    suggestion: 'Please check your credentials and try again. You can reset your password if needed.',
    isRetryable: true,
    severity: 'warning'
  },
  'auth/user-not-found': {
    title: 'Account Not Found',
    message: 'No account exists with this email address.',
    suggestion: 'Please check the email address or sign up for a new account.',
    isRetryable: false,
    severity: 'warning'
  },
  'auth/email-already-in-use': {
    title: 'Email Already Registered',
    message: 'An account with this email already exists.',
    suggestion: 'Try logging in instead, or use the password reset if you forgot your password.',
    isRetryable: false,
    severity: 'warning'
  },
  'auth/weak-password': {
    title: 'Weak Password',
    message: 'Your password is not strong enough.',
    suggestion: 'Use at least 8 characters with a mix of letters, numbers, and symbols.',
    isRetryable: true,
    severity: 'warning'
  },
  'auth/account-pending': {
    title: 'Account Pending Approval',
    message: 'Your account is waiting for admin approval.',
    suggestion: 'You will receive an email once your account is approved. This usually takes 24-48 hours.',
    isRetryable: false,
    severity: 'info'
  },
  'auth/account-rejected': {
    title: 'Account Not Approved',
    message: 'Your account registration was not approved.',
    suggestion: 'Please contact support for more information.',
    isRetryable: false,
    severity: 'error'
  },

  // Network Errors
  'network/failed-to-fetch': {
    title: 'Network Error',
    message: 'Unable to connect to the server.',
    suggestion: 'Check your internet connection and try again.',
    isRetryable: true,
    severity: 'error'
  },
  'network/timeout': {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    suggestion: 'The server might be busy. Please try again in a moment.',
    isRetryable: true,
    severity: 'warning'
  },

  // Submission Errors
  'submission/empty-code': {
    title: 'Empty Submission',
    message: 'You cannot submit empty code.',
    suggestion: 'Please write your solution before submitting.',
    isRetryable: true,
    severity: 'warning'
  },
  'submission/compilation-error': {
    title: 'Compilation Error',
    message: 'Your code has syntax errors and cannot be compiled.',
    suggestion: 'Check the error details below and fix the syntax errors.',
    isRetryable: true,
    severity: 'warning'
  },
  'submission/runtime-error': {
    title: 'Runtime Error',
    message: 'Your code crashed during execution.',
    suggestion: 'Check for null pointer errors, array out of bounds, or infinite loops.',
    isRetryable: true,
    severity: 'warning'
  },
  'submission/time-limit-exceeded': {
    title: 'Time Limit Exceeded',
    message: 'Your code took too long to execute.',
    suggestion: 'Optimize your algorithm to run faster. Consider using more efficient data structures.',
    isRetryable: true,
    severity: 'warning'
  },
  'submission/wrong-answer': {
    title: 'Wrong Answer',
    message: 'Your code produced incorrect output for one or more test cases.',
    suggestion: 'Review the test cases and check your logic carefully.',
    isRetryable: true,
    severity: 'info'
  },
  'submission/rate-limit': {
    title: 'Too Many Submissions',
    message: 'You are submitting too frequently.',
    suggestion: 'Please wait a moment before submitting again.',
    isRetryable: true,
    severity: 'warning'
  },

  // Judge0 Errors
  'judge0/unavailable': {
    title: 'Code Execution Service Unavailable',
    message: 'The code execution service is temporarily unavailable.',
    suggestion: 'Please try again in a few moments. If the problem persists, contact support.',
    isRetryable: true,
    severity: 'error'
  },
  'judge0/queue-full': {
    title: 'Execution Queue Full',
    message: 'The code execution queue is currently full.',
    suggestion: 'Please wait a moment and try again.',
    isRetryable: true,
    severity: 'warning'
  },

  // Contest Errors
  'contest/not-started': {
    title: 'Contest Not Started',
    message: 'This contest has not started yet.',
    suggestion: 'Please wait until the contest start time.',
    isRetryable: false,
    severity: 'info'
  },
  'contest/ended': {
    title: 'Contest Ended',
    message: 'This contest has already ended.',
    suggestion: 'You can no longer submit solutions for this contest.',
    isRetryable: false,
    severity: 'info'
  },
  'contest/not-registered': {
    title: 'Not Registered',
    message: 'You are not registered for this contest.',
    suggestion: 'Please register for the contest before submitting.',
    isRetryable: false,
    severity: 'warning'
  }
}

/**
 * Get user-friendly error message from error object
 */
export function getUserFriendlyError(error: any): UserFriendlyError {
  // Handle empty or malformed errors
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    return ERROR_MAPPINGS['EMPTY_ERROR']
  }

  // Check for error code
  if (error.code && ERROR_MAPPINGS[error.code]) {
    return ERROR_MAPPINGS[error.code]
  }

  // Check for error message patterns
  const message = error.message || String(error)

  if (message.includes('Failed to fetch') || message.includes('Network error')) {
    return ERROR_MAPPINGS['network/failed-to-fetch']
  }

  if (message.includes('timeout') || message.includes('timed out')) {
    return ERROR_MAPPINGS['network/timeout']
  }

  if (message.includes('permission denied') || message.includes('not authorized')) {
    return ERROR_MAPPINGS['42501']
  }

  if (message.includes('not found') || message.includes('does not exist')) {
    return ERROR_MAPPINGS['PGRST301']
  }

  // Default error
  return {
    title: 'An Error Occurred',
    message: 'Something went wrong while processing your request.',
    suggestion: 'Please try again. If the problem persists, contact support.',
    isRetryable: true,
    severity: 'error'
  }
}

/**
 * Get error message for specific contexts
 */
export function getContextualError(error: any, context: string): UserFriendlyError {
  const baseError = getUserFriendlyError(error)

  // Customize based on context
  switch (context) {
    case 'login':
      return {
        ...baseError,
        suggestion: baseError.suggestion + ' You can also try resetting your password.'
      }
    
    case 'signup':
      return {
        ...baseError,
        suggestion: baseError.suggestion + ' Make sure all required fields are filled correctly.'
      }
    
    case 'submission':
      return {
        ...baseError,
        suggestion: baseError.suggestion + ' Check your code and test cases carefully.'
      }
    
    case 'contest':
      return {
        ...baseError,
        suggestion: baseError.suggestion + ' Make sure you are registered for the contest.'
      }
    
    default:
      return baseError
  }
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: any, context?: string): {
  title: string
  message: string
  suggestion: string
  canRetry: boolean
} {
  const friendlyError = context 
    ? getContextualError(error, context)
    : getUserFriendlyError(error)

  return {
    title: friendlyError.title,
    message: friendlyError.message,
    suggestion: friendlyError.suggestion,
    canRetry: friendlyError.isRetryable
  }
}

/**
 * Check if error should show retry button
 */
export function shouldShowRetry(error: any): boolean {
  const friendlyError = getUserFriendlyError(error)
  return friendlyError.isRetryable
}

/**
 * Get error severity for styling
 */
export function getErrorSeverity(error: any): 'info' | 'warning' | 'error' | 'critical' {
  const friendlyError = getUserFriendlyError(error)
  return friendlyError.severity
}

/**
 * Sanitize error message to hide sensitive information
 */
export function sanitizeErrorMessage(error: any): string {
  const message = error.message || String(error)
  
  // Remove sensitive patterns
  let sanitized = message
    .replace(/password[=:]\s*\S+/gi, 'password=***')
    .replace(/token[=:]\s*\S+/gi, 'token=***')
    .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***')
    .replace(/secret[=:]\s*\S+/gi, 'secret=***')
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***')
  
  return sanitized
}
