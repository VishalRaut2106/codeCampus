'use client'

import { useEffect, useState } from 'react'

export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Handle browser extension interference
    const cleanupExtensions = () => {
      const body = document.body
      if (body) {
        // Remove common extension attributes
        const extensionAttributes = [
          'data-new-gr-c-s-check-loaded',
          'data-gr-ext-installed',
          'data-grammarly-shadow-root',
          'data-grammarly-extension',
          'data-grammarly-extension-shadow-root'
        ]
        
        extensionAttributes.forEach(attr => {
          if (body.hasAttribute(attr)) {
            body.removeAttribute(attr)
          }
        })
      }
    }

    // Clean up extensions and mark as hydrated
    cleanupExtensions()
    setIsHydrated(true)
  }, [])

  return isHydrated
}
