'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sanitizeHtml } from '@/lib/validation/middleware'
import { Problem } from '@/types/database'

interface ProblemDescriptionPanelProps {
  problem: Problem
}

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

/**
 * CollapsibleSection Component
 * 
 * A reusable collapsible section with expand/collapse functionality
 */
function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-white/10 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left hover:text-green-400 transition-colors"
        aria-expanded={isOpen}
        aria-controls={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div
          id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="mt-3 text-gray-300"
        >
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * ProblemDescriptionPanel Component
 * 
 * Displays problem information with collapsible sections for examples,
 * constraints, and hints. Includes HTML sanitization for security.
 * 
 * Requirements: 1.5
 */
export default function ProblemDescriptionPanel({ problem }: ProblemDescriptionPanelProps) {
  // Difficulty badge color mapping
  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-400 border-green-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    hard: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  // Sanitize HTML description
  const sanitizedDescription = sanitizeHtml(problem.description)

  // Parse examples from description or test cases
  const examples = problem.test_cases
    ?.filter((tc) => !tc.isHidden)
    .slice(0, 3) // Show first 3 examples
    .map((tc, idx) => ({
      input: tc.input,
      output: tc.output,
      explanation: '', // Could be added to test case schema
    })) || []

  return (
    <div className="h-full overflow-y-auto bg-card">
      <Card className="border-0 rounded-none">
        <CardHeader className="border-b border-white/10">
          {/* Problem Title and Metadata */}
          <div className="space-y-3">
            <CardTitle className="text-2xl font-bold text-white">
              {problem.title}
            </CardTitle>
            
            <div className="flex items-center gap-3 flex-wrap">
              {/* Difficulty Badge */}
              <Badge
                className={`${difficultyColors[problem.difficulty]} border`}
                variant="outline"
              >
                {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
              </Badge>
              
              {/* Points Badge */}
              <Badge
                className="bg-blue-500/20 text-blue-400 border-blue-500/30 border"
                variant="outline"
              >
                {problem.points} Points
              </Badge>
              
              {/* Solved Count */}
              {problem.solved_count > 0 && (
                <span className="text-sm text-gray-400">
                  {problem.solved_count} solved
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Problem Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-white">Description</h3>
            <div
              className="prose prose-invert prose-sm max-w-none text-gray-300"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>

          {/* Examples Section */}
          {examples.length > 0 && (
            <CollapsibleSection title="Examples" defaultOpen={true}>
              <div className="space-y-4">
                {examples.map((example, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <p className="text-sm font-semibold text-gray-400 mb-2">
                      Example {idx + 1}:
                    </p>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-400">Input: </span>
                        <code className="text-sm text-green-400 bg-black/30 px-2 py-1 rounded">
                          {example.input}
                        </code>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-400">Output: </span>
                        <code className="text-sm text-green-400 bg-black/30 px-2 py-1 rounded">
                          {example.output}
                        </code>
                      </div>
                      {example.explanation && (
                        <div>
                          <span className="text-sm font-medium text-gray-400">Explanation: </span>
                          <span className="text-sm text-gray-300">{example.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* Constraints Section */}
          <CollapsibleSection title="Constraints" defaultOpen={false}>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Time Limit: {problem.time_limit}s</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Memory Limit: {problem.memory_limit}MB</span>
              </div>
              {/* Additional constraints could be parsed from description */}
            </div>
          </CollapsibleSection>

          {/* Hints Section */}
          <CollapsibleSection title="Hints" defaultOpen={false}>
            <div className="space-y-2 text-sm">
              <p className="text-gray-400 italic">
                Think about the problem step by step. Consider edge cases and optimal approaches.
              </p>
              {/* Hints could be added to problem schema in the future */}
            </div>
          </CollapsibleSection>
        </CardContent>
      </Card>
    </div>
  )
}
