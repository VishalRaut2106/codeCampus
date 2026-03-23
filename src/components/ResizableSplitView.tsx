'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface ResizableSplitViewProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  defaultSplitRatio?: number // 0-100, default 40
  minLeftWidth?: number // percentage, default 20
  maxLeftWidth?: number // percentage, default 80
  storageKey?: string // for persisting split ratio
  mobileBreakpoint?: number // px, default 768
  onSplitRatioChange?: (ratio: number) => void
}

/**
 * ResizableSplitView Component
 * 
 * Provides a draggable split-view layout with persistent sizing preferences.
 * Supports keyboard navigation and responsive mobile layout.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 9.1
 */
export default function ResizableSplitView({
  leftPanel,
  rightPanel,
  defaultSplitRatio = 40,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  storageKey = 'codepvg_split_ratio',
  mobileBreakpoint = 768,
  onSplitRatioChange,
}: ResizableSplitViewProps) {
  const [splitRatio, setSplitRatio] = useState(defaultSplitRatio)
  const [isResizing, setIsResizing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'left' | 'right'>('left')
  const containerRef = useRef<HTMLDivElement>(null)
  const resizerRef = useRef<HTMLDivElement>(null)

  // Load saved split ratio on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const ratio = parseFloat(saved)
        if (!isNaN(ratio) && ratio >= minLeftWidth && ratio <= maxLeftWidth) {
          setSplitRatio(ratio)
        }
      }
    }
  }, [storageKey, minLeftWidth, maxLeftWidth])

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [mobileBreakpoint])

  // Save split ratio to localStorage
  const saveSplitRatio = useCallback(
    (ratio: number) => {
      if (typeof window !== 'undefined' && storageKey) {
        localStorage.setItem(storageKey, ratio.toString())
      }
      onSplitRatioChange?.(ratio)
    },
    [storageKey, onSplitRatioChange]
  )

  // Handle mouse down on resizer
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  // Handle mouse move during resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const newLeftWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100

      if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
        setSplitRatio(newLeftWidth)
      }
    }

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false)
        saveSplitRatio(splitRatio)
      }
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, minLeftWidth, maxLeftWidth, saveSplitRatio, splitRatio])

  // Handle keyboard navigation (arrow keys)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.target !== resizerRef.current) return

      const step = 5 // 5% per key press
      let newRatio = splitRatio

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        newRatio = Math.max(minLeftWidth, splitRatio - step)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        newRatio = Math.min(maxLeftWidth, splitRatio + step)
      }

      if (newRatio !== splitRatio) {
        setSplitRatio(newRatio)
        saveSplitRatio(newRatio)
      }
    },
    [splitRatio, minLeftWidth, maxLeftWidth, saveSplitRatio]
  )

  // Mobile tabbed layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Tab Headers */}
        <div className="flex border-b border-border bg-card">
          <button
            onClick={() => setActiveTab('left')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'left'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Problem
          </button>
          <button
            onClick={() => setActiveTab('right')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'right'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Editor
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'left' ? (
            <div className="h-full overflow-y-auto">{leftPanel}</div>
          ) : (
            <div className="h-full overflow-y-auto">{rightPanel}</div>
          )}
        </div>
      </div>
    )
  }

  // Desktop split view layout
  return (
    <div
      ref={containerRef}
      className="flex h-full overflow-hidden relative"
      role="group"
      aria-label="Resizable split view"
    >
      {/* Left Panel */}
      <div
        className="overflow-y-auto border-r border-border bg-card"
        style={{ width: `${splitRatio}%` }}
        role="region"
        aria-label="Left panel"
      >
        {leftPanel}
      </div>

      {/* Resizer */}
      <div
        ref={resizerRef}
        className={`relative w-1 cursor-col-resize transition-colors group ${
          isResizing
            ? 'bg-primary'
            : 'bg-border hover:bg-primary/50'
        }`}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="separator"
        aria-label="Resize panels"
        aria-valuenow={splitRatio}
        aria-valuemin={minLeftWidth}
        aria-valuemax={maxLeftWidth}
        aria-orientation="vertical"
      >
        {/* Visual indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="w-1 h-8 bg-primary rounded-full" />
        </div>
      </div>

      {/* Right Panel */}
      <div
        className="flex-1 overflow-y-auto bg-card"
        style={{ width: `${100 - splitRatio}%` }}
        role="region"
        aria-label="Right panel"
      >
        {rightPanel}
      </div>
    </div>
  )
}
