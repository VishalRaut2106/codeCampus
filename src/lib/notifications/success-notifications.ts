// Success Notification Service
// Provides consistent success feedback across the application

import { toast } from 'sonner'

export interface SuccessNotification {
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Show success toast notification
 */
export function showSuccess(notification: string | SuccessNotification) {
  if (typeof notification === 'string') {
    toast.success(notification)
  } else {
    toast.success(notification.title, {
      description: notification.message,
      duration: notification.duration || 4000,
      action: notification.action ? {
        label: notification.action.label,
        onClick: notification.action.onClick
      } : undefined
    })
  }
}

/**
 * Predefined success messages for common actions
 */
export const SuccessMessages = {
  // Authentication
  login: 'Welcome back! You have successfully logged in.',
  logout: 'You have been logged out successfully.',
  signup: 'Account created successfully! Please check your email for verification.',
  passwordReset: 'Password reset email sent. Please check your inbox.',
  passwordChanged: 'Your password has been changed successfully.',
  emailVerified: 'Your email has been verified successfully.',

  // User Actions
  profileUpdated: 'Your profile has been updated successfully.',
  settingsSaved: 'Settings saved successfully.',
  accountDeleted: 'Your account has been deleted.',

  // Submissions
  codeSubmitted: 'Code submitted successfully! Running tests...',
  submissionAccepted: '✅ All test cases passed! Solution accepted.',
  submissionSaved: 'Your code has been saved as a draft.',

  // Problems
  problemSolved: '🎉 Congratulations! You solved the problem!',
  firstSolve: '🏆 First solve! You earned bonus points!',
  problemCreated: 'Problem created successfully.',
  problemUpdated: 'Problem updated successfully.',
  problemDeleted: 'Problem deleted successfully.',

  // Contests
  contestRegistered: 'Successfully registered for the contest!',
  contestCreated: 'Contest created successfully.',
  contestUpdated: 'Contest updated successfully.',
  contestStarted: 'Contest has started! Good luck!',
  contestEnded: 'Contest has ended. Check the leaderboard for results.',

  // Admin Actions
  userApproved: 'User approved successfully.',
  userRejected: 'User registration rejected.',
  roleChanged: 'User role updated successfully.',
  dataImported: 'Data imported successfully.',
  dataExported: 'Data exported successfully.',
  cacheCleared: 'Cache cleared successfully.',
  migrationCompleted: 'Database migration completed successfully.',

  // General
  saved: 'Changes saved successfully.',
  deleted: 'Deleted successfully.',
  created: 'Created successfully.',
  updated: 'Updated successfully.',
  copied: 'Copied to clipboard.',
  sent: 'Sent successfully.',
  uploaded: 'Uploaded successfully.',
  downloaded: 'Downloaded successfully.'
}

/**
 * Show success notification with checkmark icon
 */
export function showSuccessWithIcon(message: string) {
  toast.success(message, {
    icon: '✅'
  })
}

/**
 * Show success notification with custom icon
 */
export function showSuccessWithCustomIcon(message: string, icon: string) {
  toast.success(message, {
    icon
  })
}

/**
 * Show success notification with action button
 */
export function showSuccessWithAction(
  message: string,
  actionLabel: string,
  onAction: () => void
) {
  toast.success(message, {
    action: {
      label: actionLabel,
      onClick: onAction
    }
  })
}

/**
 * Show success notification for async operations
 */
export async function showSuccessAfterDelay(
  message: string,
  delayMs: number = 1000
) {
  await new Promise(resolve => setTimeout(resolve, delayMs))
  toast.success(message)
}

/**
 * Show progress success notification
 */
export function showProgressSuccess(
  message: string,
  progress: number
) {
  toast.success(`${message} (${progress}%)`)
}

/**
 * Show success notification with description
 */
export function showSuccessWithDescription(
  title: string,
  description: string
) {
  toast.success(title, {
    description
  })
}

/**
 * Show celebration success (for achievements)
 */
export function showCelebration(message: string) {
  toast.success(message, {
    icon: '🎉',
    duration: 5000
  })
}

/**
 * Show achievement unlocked notification
 */
export function showAchievement(
  title: string,
  description: string,
  icon: string = '🏆'
) {
  toast.success(title, {
    description,
    icon,
    duration: 6000
  })
}

/**
 * Show points earned notification
 */
export function showPointsEarned(points: number) {
  toast.success(`+${points} points earned!`, {
    icon: '⭐',
    duration: 4000
  })
}

/**
 * Show streak notification
 */
export function showStreak(days: number) {
  toast.success(`${days} day streak! 🔥`, {
    description: 'Keep up the great work!',
    duration: 4000
  })
}

/**
 * Show level up notification
 */
export function showLevelUp(level: number) {
  toast.success(`Level ${level} reached! 🎊`, {
    description: 'You\'re making great progress!',
    duration: 5000
  })
}

/**
 * Show badge earned notification
 */
export function showBadgeEarned(badgeName: string) {
  toast.success(`Badge Earned: ${badgeName}`, {
    icon: '🏅',
    description: 'Check your profile to see all your badges!',
    duration: 5000
  })
}
