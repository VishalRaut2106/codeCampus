import { beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    get length() {
      return Object.keys(store).length
    },
  }
})()

// Set up localStorage mock
global.localStorage = localStorageMock as Storage

// Set up portal container for Radix UI components
beforeEach(() => {
  localStorage.clear()
  
  // Create a portal container for Radix UI portals
  const portalRoot = document.createElement('div')
  portalRoot.setAttribute('id', 'radix-portal-root')
  document.body.appendChild(portalRoot)
})

// Clean up after each test
afterEach(() => {
  localStorage.clear()
  
  // Clean up portal container
  const portalRoot = document.getElementById('radix-portal-root')
  if (portalRoot) {
    document.body.removeChild(portalRoot)
  }
})
