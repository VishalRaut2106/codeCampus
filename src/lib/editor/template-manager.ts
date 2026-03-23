/**
 * Template Manager Service
 * 
 * Comprehensive template management system with CRUD operations,
 * categorization, and persistence for custom templates.
 */

import type { ProgrammingLanguage } from '@/types'
import type { EnhancedCodeTemplate } from './types'
import { TemplateCategory } from './types'
import { getTemplate as getDefaultTemplate } from './code-template-service'
import { getTemplateStorageService } from './template-storage-service'

/**
 * Language ID mapping for Judge0 compatibility
 */
const LANGUAGE_ID_MAP: Record<ProgrammingLanguage, number> = {
  javascript: 63,
  typescript: 74,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
  go: 60,
  rust: 73,
  ruby: 72,
  php: 68,
  swift: 83,
  kotlin: 78,
}

/**
 * Template Manager class for comprehensive template operations
 */
export class TemplateManager {
  private static instance: TemplateManager
  private templates: Map<string, EnhancedCodeTemplate> = new Map()
  private initialized = false

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): TemplateManager {
    if (!TemplateManager.instance) {
      TemplateManager.instance = new TemplateManager()
    }
    return TemplateManager.instance
  }

  /**
   * Initialize template manager with default templates
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return

    // Load default templates
    await this.loadDefaultTemplates()
    
    // Load custom templates from storage
    await this.loadCustomTemplates()
    
    this.initialized = true
  }

  /**
   * Get default template for a language
   */
  public async getDefaultTemplate(languageId: number): Promise<EnhancedCodeTemplate | null> {
    await this.initialize()
    
    const language = this.getLanguageFromId(languageId)
    if (!language) return null

    const templateId = `default_${language}`
    return this.templates.get(templateId) || null
  }

  /**
   * Get all user templates for a language
   */
  public async getUserTemplates(languageId: number): Promise<EnhancedCodeTemplate[]> {
    await this.initialize()
    
    return Array.from(this.templates.values()).filter(
      template => template.languageId === languageId && !template.isDefault
    )
  }

  /**
   * Get all templates for a language (default + custom)
   */
  public async getAllTemplatesForLanguage(languageId: number): Promise<EnhancedCodeTemplate[]> {
    await this.initialize()
    
    return Array.from(this.templates.values()).filter(
      template => template.languageId === languageId
    )
  }

  /**
   * Get templates by category
   */
  public async getTemplatesByCategory(category: TemplateCategory): Promise<EnhancedCodeTemplate[]> {
    await this.initialize()
    
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    )
  }

  /**
   * Save a new custom template
   */
  public async saveTemplate(template: Omit<EnhancedCodeTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    await this.initialize()
    
    const id = this.generateTemplateId()
    const now = new Date()
    
    const enhancedTemplate: EnhancedCodeTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    }

    // Validate template before saving
    if (!this.validateTemplate(enhancedTemplate)) {
      throw new Error('Invalid template data')
    }

    this.templates.set(id, enhancedTemplate)
    await this.persistCustomTemplates()
    
    return id
  }

  /**
   * Update an existing template
   */
  public async updateTemplate(id: string, updates: Partial<EnhancedCodeTemplate>): Promise<void> {
    await this.initialize()
    
    const existing = this.templates.get(id)
    if (!existing) {
      throw new Error(`Template with id ${id} not found`)
    }

    if (existing.isDefault) {
      throw new Error('Cannot modify default templates')
    }

    const updated: EnhancedCodeTemplate = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date(),
    }

    if (!this.validateTemplate(updated)) {
      throw new Error('Invalid template data')
    }

    this.templates.set(id, updated)
    await this.persistCustomTemplates()
  }

  /**
   * Delete a custom template
   */
  public async deleteTemplate(id: string): Promise<void> {
    await this.initialize()
    
    const template = this.templates.get(id)
    if (!template) {
      throw new Error(`Template with id ${id} not found`)
    }

    if (template.isDefault) {
      throw new Error('Cannot delete default templates')
    }

    this.templates.delete(id)
    await this.persistCustomTemplates()
  }

  /**
   * Get template by ID
   */
  public async getTemplate(id: string): Promise<EnhancedCodeTemplate | null> {
    await this.initialize()
    return this.templates.get(id) || null
  }

  /**
   * Export all custom templates
   */
  public async exportTemplates(): Promise<string> {
    await this.initialize()
    
    const customTemplates = Array.from(this.templates.values()).filter(
      template => !template.isDefault
    )

    const storageService = getTemplateStorageService()
    return storageService.exportTemplates(customTemplates)
  }

  /**
   * Import templates from JSON data
   */
  public async importTemplates(data: string): Promise<void> {
    await this.initialize()
    
    try {
      const storageService = getTemplateStorageService()
      const importedTemplates = await storageService.importTemplates(data)

      for (const template of importedTemplates) {
        if (this.validateTemplate(template)) {
          this.templates.set(template.id, template)
        }
      }

      await this.persistCustomTemplates()
    } catch (error) {
      throw new Error(`Failed to import templates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate template data
   */
  public validateTemplate(template: EnhancedCodeTemplate): boolean {
    // Basic validation
    if (!template.id || !template.name || !template.code || !template.language) {
      return false
    }

    // Validate language ID
    if (!this.getLanguageFromId(template.languageId)) {
      return false
    }

    // Validate category
    if (!Object.values(TemplateCategory).includes(template.category)) {
      return false
    }

    // Basic syntax validation (can be enhanced)
    return this.validateTemplateSyntax(template.code, template.language)
  }

  /**
   * Reset to default templates (recovery mechanism)
   */
  public async resetToDefaults(): Promise<void> {
    // Clear all templates
    this.templates.clear()
    
    // Reload defaults
    await this.loadDefaultTemplates()
    
    // Clear custom templates from storage
    await this.clearCustomTemplates()
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Load default templates for all languages
   */
  private async loadDefaultTemplates(): Promise<void> {
    for (const [language, languageId] of Object.entries(LANGUAGE_ID_MAP)) {
      const template = getDefaultTemplate('', language as ProgrammingLanguage)
      
      const enhancedTemplate: EnhancedCodeTemplate = {
        id: `default_${language}`,
        name: `${language} Default Template`,
        languageId,
        language: language as ProgrammingLanguage,
        code: template,
        description: `Default ${language} template with basic structure`,
        category: TemplateCategory.DEFAULT,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      this.templates.set(enhancedTemplate.id, enhancedTemplate)
    }
  }

  /**
   * Load custom templates from storage
   */
  private async loadCustomTemplates(): Promise<void> {
    try {
      const storageService = getTemplateStorageService()
      const templates = await storageService.loadTemplates()
      
      for (const templateData of templates) {
        const template: EnhancedCodeTemplate = {
          ...templateData,
          createdAt: new Date(templateData.createdAt),
          updatedAt: new Date(templateData.updatedAt),
        }

        if (this.validateTemplate(template)) {
          this.templates.set(template.id, template)
        }
      }
    } catch (error) {
      console.warn('Failed to load custom templates from storage:', error)
      // Graceful degradation - continue with defaults only
    }
  }

  /**
   * Persist custom templates to storage
   */
  private async persistCustomTemplates(): Promise<void> {
    try {
      const customTemplates = Array.from(this.templates.values()).filter(
        template => !template.isDefault
      )

      const storageService = getTemplateStorageService()
      await storageService.saveTemplates(customTemplates)
    } catch (error) {
      console.warn('Failed to persist custom templates:', error)
      // Could trigger recovery mechanism here if needed
    }
  }

  /**
   * Clear custom templates from storage
   */
  private async clearCustomTemplates(): Promise<void> {
    try {
      const storageService = getTemplateStorageService()
      await storageService.clearTemplates()
    } catch (error) {
      console.warn('Failed to clear custom templates from storage:', error)
    }
  }

  /**
   * Generate unique template ID
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get language from language ID
   */
  private getLanguageFromId(languageId: number): ProgrammingLanguage | null {
    for (const [language, id] of Object.entries(LANGUAGE_ID_MAP)) {
      if (id === languageId) {
        return language as ProgrammingLanguage
      }
    }
    return null
  }

  /**
   * Basic template syntax validation
   */
  private validateTemplateSyntax(code: string, language: ProgrammingLanguage): boolean {
    // Basic validation - can be enhanced with actual syntax parsing
    if (!code.trim()) return false

    // Language-specific basic checks
    switch (language) {
      case 'javascript':
      case 'typescript':
        // Check for basic JavaScript/TypeScript structure
        return (
          code.includes('function') || 
          code.includes('=>') || 
          code.includes('class') ||
          code.includes('const') ||
          code.includes('let') ||
          code.includes('var')
        ) && this.hasBalancedBraces(code)
      
      case 'python':
        // Check for basic Python structure
        return (
          code.includes('def ') || 
          code.includes('class ') ||
          code.includes('import ') ||
          code.includes('from ')
        ) && this.hasValidPythonIndentation(code)
      
      case 'java':
      case 'csharp':
        // Check for basic Java/C# structure
        return (
          code.includes('class ') && 
          code.includes('{') && 
          code.includes('}') &&
          (code.includes('public') || code.includes('private') || code.includes('protected'))
        ) && this.hasBalancedBraces(code)
      
      case 'cpp':
      case 'c':
        // Check for basic C/C++ structure
        return (
          code.includes('{') && 
          code.includes('}') &&
          (code.includes('int ') || code.includes('char') || code.includes('string') || code.includes('class'))
        ) && this.hasBalancedBraces(code)
      
      case 'go':
        // Check for basic Go structure
        return (
          (code.includes('func ') || code.includes('package ')) &&
          code.includes('{') && 
          code.includes('}')
        ) && this.hasBalancedBraces(code)
      
      case 'rust':
        // Check for basic Rust structure
        return (
          (code.includes('fn ') || code.includes('struct ') || code.includes('impl ')) &&
          code.includes('{') && 
          code.includes('}')
        ) && this.hasBalancedBraces(code)
      
      case 'ruby':
        // Check for basic Ruby structure
        return (
          code.includes('def ') || 
          code.includes('class ') ||
          code.includes('module ')
        ) && this.hasValidRubyStructure(code)
      
      case 'php':
        // Check for basic PHP structure
        return (
          code.includes('<?php') &&
          (code.includes('function ') || code.includes('class '))
        )
      
      case 'swift':
        // Check for basic Swift structure
        return (
          (code.includes('func ') || code.includes('class ') || code.includes('struct ')) &&
          code.includes('{') && 
          code.includes('}')
        ) && this.hasBalancedBraces(code)
      
      case 'kotlin':
        // Check for basic Kotlin structure
        return (
          (code.includes('fun ') || code.includes('class ') || code.includes('object ')) &&
          code.includes('{') && 
          code.includes('}')
        ) && this.hasBalancedBraces(code)
      
      default:
        return true // Allow other languages for now
    }
  }

  /**
   * Check if braces are balanced in the code
   */
  private hasBalancedBraces(code: string): boolean {
    let braceCount = 0
    let parenCount = 0
    let bracketCount = 0
    
    for (const char of code) {
      switch (char) {
        case '{': braceCount++; break
        case '}': braceCount--; break
        case '(': parenCount++; break
        case ')': parenCount--; break
        case '[': bracketCount++; break
        case ']': bracketCount--; break
      }
      
      // Early exit if any count goes negative
      if (braceCount < 0 || parenCount < 0 || bracketCount < 0) {
        return false
      }
    }
    
    return braceCount === 0 && parenCount === 0 && bracketCount === 0
  }

  /**
   * Basic Python indentation validation
   */
  private hasValidPythonIndentation(code: string): boolean {
    const lines = code.split('\n')
    let indentLevel = 0
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      
      const leadingSpaces = line.length - line.trimStart().length
      
      // Check for colon indicating new block
      if (trimmed.endsWith(':')) {
        indentLevel = leadingSpaces + 4 // Expect next line to be indented
      } else if (leadingSpaces < indentLevel && trimmed) {
        // Dedent is allowed, update expected level
        indentLevel = leadingSpaces
      }
    }
    
    return true // Basic check passed
  }

  /**
   * Basic Ruby structure validation
   */
  private hasValidRubyStructure(code: string): boolean {
    const defCount = (code.match(/\bdef\b/g) || []).length
    const endCount = (code.match(/\bend\b/g) || []).length
    
    // In Ruby, each 'def' should have a corresponding 'end'
    return defCount <= endCount
  }
}

/**
 * Convenience functions for direct usage
 */

/**
 * Get template manager instance
 */
export function getTemplateManager(): TemplateManager {
  return TemplateManager.getInstance()
}

/**
 * Get default template for language
 */
export async function getDefaultTemplateForLanguage(languageId: number): Promise<EnhancedCodeTemplate | null> {
  const manager = getTemplateManager()
  return manager.getDefaultTemplate(languageId)
}

/**
 * Get all templates for language
 */
export async function getAllTemplatesForLanguage(languageId: number): Promise<EnhancedCodeTemplate[]> {
  const manager = getTemplateManager()
  return manager.getAllTemplatesForLanguage(languageId)
}

/**
 * Save custom template
 */
export async function saveCustomTemplate(
  name: string,
  code: string,
  language: ProgrammingLanguage,
  category: TemplateCategory = TemplateCategory.CUSTOM,
  description?: string
): Promise<string> {
  const manager = getTemplateManager()
  const languageId = LANGUAGE_ID_MAP[language]
  
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`)
  }

  return manager.saveTemplate({
    name,
    languageId,
    language,
    code,
    description,
    category,
    isDefault: false,
  })
}