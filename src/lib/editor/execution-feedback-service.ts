/**
 * Execution Feedback Service
 * 
 * Formats execution results with helpful error messages and suggestions.
 * Provides context-specific debugging hints based on error types.
 */

import type {
  TestCaseResult,
  RawTestResult,
  ErrorCategory,
  DiffResult,
  Difference,
  ExecutionStatus,
} from './types'

/**
 * Judge0 status IDs
 */
const JUDGE0_STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
} as const

/**
 * Format test case result with enhanced feedback
 */
export function formatTestCaseResult(
  result: RawTestResult,
  index: number,
  input: string,
  expectedOutput: string
): TestCaseResult {
  const statusId = result.status.id
  const actualOutput = (result.stdout || '').trim()
  const passed = statusId === JUDGE0_STATUS.ACCEPTED && actualOutput === expectedOutput.trim()

  const errorCategory = categorizeError(
    statusId,
    result.stderr || '',
    result.compile_output || ''
  )

  return {
    index,
    passed,
    input,
    expectedOutput: expectedOutput.trim(),
    actualOutput,
    executionTime: parseFloat(result.time || '0'),
    memoryUsed: result.memory || 0,
    error: errorCategory.message,
    errorType: errorCategory.type,
    suggestion: errorCategory.suggestion,
  }
}

/**
 * Categorize error based on status and output
 */
export function categorizeError(
  statusId: number,
  stderr: string,
  compileOutput: string
): ErrorCategory {
  // Compilation errors
  if (statusId === JUDGE0_STATUS.COMPILATION_ERROR) {
    return {
      type: 'compilation',
      title: 'Compilation Error',
      message: compileOutput || stderr || 'Code failed to compile',
      suggestion: generateCompilationSuggestion(compileOutput || stderr),
      severity: 'error',
    }
  }

  // Runtime errors
  if (
    statusId === JUDGE0_STATUS.RUNTIME_ERROR_SIGSEGV ||
    statusId === JUDGE0_STATUS.RUNTIME_ERROR_SIGXFSZ ||
    statusId === JUDGE0_STATUS.RUNTIME_ERROR_SIGFPE ||
    statusId === JUDGE0_STATUS.RUNTIME_ERROR_SIGABRT ||
    statusId === JUDGE0_STATUS.RUNTIME_ERROR_NZEC ||
    statusId === JUDGE0_STATUS.RUNTIME_ERROR_OTHER
  ) {
    return {
      type: 'runtime',
      title: 'Runtime Error',
      message: stderr || 'Code crashed during execution',
      suggestion: generateRuntimeSuggestion(stderr, statusId),
      severity: 'error',
    }
  }

  // Time limit exceeded
  if (statusId === JUDGE0_STATUS.TIME_LIMIT_EXCEEDED) {
    return {
      type: 'timeout',
      title: 'Time Limit Exceeded',
      message: 'Your code took too long to execute',
      suggestion: generateTimeoutSuggestion(),
      severity: 'warning',
    }
  }

  // Wrong answer
  if (statusId === JUDGE0_STATUS.WRONG_ANSWER) {
    return {
      type: 'wrong_answer',
      title: 'Wrong Answer',
      message: 'Output does not match expected result',
      suggestion: generateWrongAnswerSuggestion(),
      severity: 'info',
    }
  }

  // Default case
  return {
    type: 'runtime',
    title: 'Error',
    message: stderr || 'An error occurred during execution',
    suggestion: 'Check your code for logical errors and try again',
    severity: 'error',
  }
}

/**
 * Generate suggestion for compilation errors
 */
function generateCompilationSuggestion(compileOutput: string): string {
  const output = compileOutput.toLowerCase()

  if (output.includes('syntax error') || output.includes('unexpected token')) {
    return 'Check for missing brackets, parentheses, or semicolons. Verify your syntax is correct.'
  }

  if (output.includes('undeclared') || output.includes('not defined')) {
    return 'Make sure all variables and functions are declared before use. Check for typos in variable names.'
  }

  if (output.includes('type mismatch') || output.includes('cannot convert')) {
    return 'Check that you are using the correct data types. Verify type conversions are valid.'
  }

  if (output.includes('missing return')) {
    return 'Ensure your function returns a value of the correct type in all code paths.'
  }

  if (output.includes('import') || output.includes('module')) {
    return 'Check your import statements. Make sure all required modules are imported correctly.'
  }

  return 'Review the error message carefully and check your code syntax. Look for common mistakes like missing brackets or semicolons.'
}

/**
 * Generate suggestion for runtime errors
 */
function generateRuntimeSuggestion(stderr: string, statusId: number): string {
  const error = stderr.toLowerCase()

  // Segmentation fault
  if (statusId === JUDGE0_STATUS.RUNTIME_ERROR_SIGSEGV || error.includes('segmentation fault')) {
    return 'Check for array/pointer out of bounds access, null pointer dereference, or stack overflow. Verify all array indices are valid.'
  }

  // Division by zero
  if (statusId === JUDGE0_STATUS.RUNTIME_ERROR_SIGFPE || error.includes('division by zero')) {
    return 'Check for division by zero. Add validation to ensure divisors are not zero.'
  }

  // Index errors
  if (error.includes('index') || error.includes('out of bounds') || error.includes('out of range')) {
    return 'Check array/list bounds. You may be accessing an invalid index. Verify loop conditions and array sizes.'
  }

  // Null/undefined errors
  if (error.includes('null') || error.includes('undefined') || error.includes('none')) {
    return 'Check for null/undefined values. Make sure variables are initialized before use.'
  }

  // Type errors
  if (error.includes('type error') || error.includes('cannot read property')) {
    return 'Check data types. You may be trying to use a method on an incompatible type.'
  }

  // Stack overflow
  if (error.includes('stack overflow') || error.includes('maximum recursion')) {
    return 'Check for infinite recursion or very deep recursion. Consider using iteration instead of recursion.'
  }

  // Memory errors
  if (error.includes('memory') || error.includes('allocation')) {
    return 'Check for memory leaks or excessive memory usage. Consider optimizing your data structures.'
  }

  return 'Review the error message and check your code logic. Look for edge cases that might cause crashes.'
}

/**
 * Generate suggestion for timeout errors
 */
function generateTimeoutSuggestion(): string {
  return 'Your algorithm is too slow. Consider:\n' +
    '• Using more efficient data structures (hash maps, sets)\n' +
    '• Reducing time complexity (avoid nested loops if possible)\n' +
    '• Using dynamic programming or memoization\n' +
    '• Optimizing your algorithm approach'
}

/**
 * Generate suggestion for wrong answer
 */
function generateWrongAnswerSuggestion(): string {
  return 'Review the problem requirements carefully. Check:\n' +
    '• Edge cases (empty input, single element, etc.)\n' +
    '• Off-by-one errors in loops or indices\n' +
    '• Integer overflow for large numbers\n' +
    '• Output format (spacing, newlines, etc.)'
}

/**
 * Generate error-specific suggestion
 */
export function generateErrorSuggestion(errorType: string, errorMessage: string): string {
  switch (errorType) {
    case 'compilation':
      return generateCompilationSuggestion(errorMessage)
    case 'runtime':
      return generateRuntimeSuggestion(errorMessage, 0)
    case 'timeout':
      return generateTimeoutSuggestion()
    case 'wrong_answer':
      return generateWrongAnswerSuggestion()
    default:
      return 'Check your code for errors and try again'
  }
}

/**
 * Highlight differences between expected and actual output
 */
export function highlightOutputDiff(expected: string, actual: string): DiffResult {
  const differences: Difference[] = []
  const maxLength = Math.max(expected.length, actual.length)

  for (let i = 0; i < maxLength; i++) {
    const expectedChar = expected[i] || ''
    const actualChar = actual[i] || ''

    if (expectedChar !== actualChar) {
      differences.push({
        position: i,
        expectedChar,
        actualChar,
      })
    }
  }

  return {
    expected,
    actual,
    differences,
  }
}

/**
 * Format execution time for display
 */
export function formatExecutionTime(timeInSeconds: number): string {
  if (timeInSeconds < 0.001) {
    return `${(timeInSeconds * 1000000).toFixed(0)}μs`
  } else if (timeInSeconds < 1) {
    return `${(timeInSeconds * 1000).toFixed(2)}ms`
  } else {
    return `${timeInSeconds.toFixed(2)}s`
  }
}

/**
 * Format memory usage for display
 */
export function formatMemoryUsage(memoryInKB: number): string {
  if (memoryInKB < 1024) {
    return `${memoryInKB.toFixed(2)} KB`
  } else {
    return `${(memoryInKB / 1024).toFixed(2)} MB`
  }
}

/**
 * Determine execution status from test results
 */
export function determineExecutionStatus(
  testResults: TestCaseResult[]
): ExecutionStatus {
  if (testResults.length === 0) {
    return 'runtime_error'
  }

  // Check if all passed
  const allPassed = testResults.every((result) => result.passed)
  if (allPassed) {
    return 'accepted'
  }

  // Check for specific error types
  const hasCompilationError = testResults.some(
    (result) => result.errorType === 'compilation'
  )
  if (hasCompilationError) {
    return 'compilation_error'
  }

  const hasTimeout = testResults.some((result) => result.errorType === 'timeout')
  if (hasTimeout) {
    return 'time_limit_exceeded'
  }

  const hasRuntimeError = testResults.some((result) => result.errorType === 'runtime')
  if (hasRuntimeError) {
    return 'runtime_error'
  }

  // Default to wrong answer
  return 'wrong_answer'
}

/**
 * Get status badge color
 */
export function getStatusBadgeColor(status: ExecutionStatus): string {
  switch (status) {
    case 'accepted':
      return 'green'
    case 'wrong_answer':
      return 'red'
    case 'compilation_error':
      return 'orange'
    case 'runtime_error':
      return 'red'
    case 'time_limit_exceeded':
      return 'yellow'
    case 'memory_limit_exceeded':
      return 'yellow'
    default:
      return 'gray'
  }
}

/**
 * Get status badge text
 */
export function getStatusBadgeText(status: ExecutionStatus): string {
  switch (status) {
    case 'accepted':
      return 'Accepted'
    case 'wrong_answer':
      return 'Wrong Answer'
    case 'compilation_error':
      return 'Compilation Error'
    case 'runtime_error':
      return 'Runtime Error'
    case 'time_limit_exceeded':
      return 'Time Limit Exceeded'
    case 'memory_limit_exceeded':
      return 'Memory Limit Exceeded'
    default:
      return 'Error'
  }
}
