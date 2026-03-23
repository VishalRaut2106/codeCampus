/**
 * Code Persistence Service
 * 
 * Handles auto-save and code recovery using localStorage.
 * Manages code storage per problem-language combination.
 */

import type { ProgrammingLanguage } from '@/types'
import type { StoredCode, SplitViewPreferences, StoredCustomInput } from './types'

const STORAGE_VERSION = 1
const STORAGE_PREFIX = 'codepvg'
const MAX_AGE_DAYS = 30

/**
 * Generate storage key for code
 */
function getCodeKey(problemId: string, language: ProgrammingLanguage): string {
  return `${STORAGE_PREFIX}_code_${problemId}_${language}`
}

/**
 * Generate storage key for split ratio
 */
function getSplitRatioKey(): string {
  return `${STORAGE_PREFIX}_split_ratio`
}

/**
 * Generate storage key for custom input
 */
function getCustomInputKey(problemId: string): string {
  return `${STORAGE_PREFIX}_custom_input_${problemId}`
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Save code to localStorage
 */
export function saveCode(
  problemId: string,
  language: ProgrammingLanguage,
  code: string
): void {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage is not available')
    return
  }

  try {
    const storedCode: StoredCode = {
      code,
      language,
      problemId,
      savedAt: new Date().toISOString(),
      version: STORAGE_VERSION,
    }

    const key = getCodeKey(problemId, language)
    localStorage.setItem(key, JSON.stringify(storedCode))
  } catch (error) {
    console.error('Failed to save code:', error)
    // Handle quota exceeded error
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      cleanupOldEntries()
      // Try again after cleanup
      try {
        const storedCode: StoredCode = {
          code,
          language,
          problemId,
          savedAt: new Date().toISOString(),
          version: STORAGE_VERSION,
        }
        const key = getCodeKey(problemId, language)
        localStorage.setItem(key, JSON.stringify(storedCode))
      } catch (retryError) {
        console.error('Failed to save code after cleanup:', retryError)
      }
    }
  }
}

/**
 * Load code from localStorage
 */
export function loadCode(
  problemId: string,
  language: ProgrammingLanguage
): string | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    const key = getCodeKey(problemId, language)
    const stored = localStorage.getItem(key)

    if (!stored) {
      return null
    }

    const storedCode: StoredCode = JSON.parse(stored)

    // Check if entry is too old
    const savedAt = new Date(storedCode.savedAt)
    const now = new Date()
    const daysDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysDiff > MAX_AGE_DAYS) {
      clearCode(problemId, language)
      return null
    }

    return storedCode.code
  } catch (error) {
    console.error('Failed to load code:', error)
    return null
  }
}

/**
 * Clear code from localStorage
 */
export function clearCode(
  problemId: string,
  language: ProgrammingLanguage
): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const key = getCodeKey(problemId, language)
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Failed to clear code:', error)
  }
}

/**
 * Get saved timestamp for code
 */
export function getSavedTimestamp(
  problemId: string,
  language: ProgrammingLanguage
): Date | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    const key = getCodeKey(problemId, language)
    const stored = localStorage.getItem(key)

    if (!stored) {
      return null
    }

    const storedCode: StoredCode = JSON.parse(stored)
    return new Date(storedCode.savedAt)
  } catch (error) {
    console.error('Failed to get saved timestamp:', error)
    return null
  }
}

/**
 * Set up auto-save with interval
 * Returns cleanup function to stop auto-save
 */
export function autoSave(
  problemId: string,
  language: ProgrammingLanguage,
  getCode: () => string,
  intervalMs: number = 30000
): () => void {
  const intervalId = setInterval(() => {
    const code = getCode()
    if (code) {
      saveCode(problemId, language, code)
    }
  }, intervalMs)

  // Return cleanup function
  return () => {
    clearInterval(intervalId)
  }
}

/**
 * Save split ratio preference
 */
export function saveSplitRatio(ratio: number): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const preferences: SplitViewPreferences = {
      ratio,
      lastUpdated: new Date().toISOString(),
    }

    const key = getSplitRatioKey()
    localStorage.setItem(key, JSON.stringify(preferences))
  } catch (error) {
    console.error('Failed to save split ratio:', error)
  }
}

/**
 * Load split ratio preference
 */
export function loadSplitRatio(defaultRatio: number = 40): number {
  if (!isLocalStorageAvailable()) {
    return defaultRatio
  }

  try {
    const key = getSplitRatioKey()
    const stored = localStorage.getItem(key)

    if (!stored) {
      return defaultRatio
    }

    const preferences: SplitViewPreferences = JSON.parse(stored)
    return preferences.ratio
  } catch (error) {
    console.error('Failed to load split ratio:', error)
    return defaultRatio
  }
}

/**
 * Save custom input for a problem
 */
export function saveCustomInput(problemId: string, inputs: string[]): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const stored: StoredCustomInput = {
      problemId,
      inputs,
      savedAt: new Date().toISOString(),
    }

    const key = getCustomInputKey(problemId)
    localStorage.setItem(key, JSON.stringify(stored))
  } catch (error) {
    console.error('Failed to save custom input:', error)
  }
}

/**
 * Load custom input for a problem
 */
export function loadCustomInput(problemId: string): string[] {
  if (!isLocalStorageAvailable()) {
    return []
  }

  try {
    const key = getCustomInputKey(problemId)
    const stored = localStorage.getItem(key)

    if (!stored) {
      return []
    }

    const storedInput: StoredCustomInput = JSON.parse(stored)
    return storedInput.inputs
  } catch (error) {
    console.error('Failed to load custom input:', error)
    return []
  }
}

/**
 * Clean up old entries (> MAX_AGE_DAYS)
 */
function cleanupOldEntries(): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    const now = new Date()
    const keysToRemove: string[] = []

    // Iterate through all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(STORAGE_PREFIX)) {
        continue
      }

      try {
        const stored = localStorage.getItem(key)
        if (!stored) continue

        const data = JSON.parse(stored)
        if (!data.savedAt) continue

        const savedAt = new Date(data.savedAt)
        const daysDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24)

        if (daysDiff > MAX_AGE_DAYS) {
          keysToRemove.push(key)
        }
      } catch (error) {
        // Invalid entry, mark for removal
        keysToRemove.push(key)
      }
    }

    // Remove old entries
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
    })

    console.log(`Cleaned up ${keysToRemove.length} old entries`)
  } catch (error) {
    console.error('Failed to cleanup old entries:', error)
  }
}

/**
 * Get all stored code entries for a problem (all languages)
 */
export function getAllCodeForProblem(problemId: string): Record<ProgrammingLanguage, string> {
  const result: Record<string, string> = {}

  if (!isLocalStorageAvailable()) {
    return result as Record<ProgrammingLanguage, string>
  }

  try {
    const prefix = `${STORAGE_PREFIX}_code_${problemId}_`

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(prefix)) {
        continue
      }

      try {
        const stored = localStorage.getItem(key)
        if (!stored) continue

        const storedCode: StoredCode = JSON.parse(stored)
        result[storedCode.language] = storedCode.code
      } catch (error) {
        console.error(`Failed to load code for key ${key}:`, error)
      }
    }
  } catch (error) {
    console.error('Failed to get all code for problem:', error)
  }

  return result as Record<ProgrammingLanguage, string>
}
