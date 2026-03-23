/**
 * LeetCode-style problem templates with boilerplate code
 * Supports both predefined templates and custom user templates
 */

export interface ProblemTemplate {
  id: string
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  description: string
  examples: Array<{
    input: string
    output: string
    explanation?: string
  }>
  constraints: string[]
  templates: Record<string, string>
}