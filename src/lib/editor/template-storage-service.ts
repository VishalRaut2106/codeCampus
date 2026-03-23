/**
 * Template Storage Service
 * 
 * Handles template persistence with graceful degradation and recovery mechanisms.
 * Supports local storage with session storage fallback and data corruption recovery.
 */

import type { EnhancedCodeTemplate } from './types'

/**
 * Storage data structure
 */
interface TemplateStorageData {
  version: string
  savedAt: string
  templates: EnhancedCodeTemplate[]
}

/**
 * Storage configuration
 */
interface StorageConfig {
  primaryKey: string
  fallbackKey: string
  version: string
}

/**
 * Template Storage Service class
 */
export class TemplateStorageService {
  private static instance: TemplateStorageService
  private config: StorageConfig

  private constructor() {
    this.config = {
      primaryKey: 'custom_templates',
      fallbackKey: 'custom_templates_session',
      version: '1.0',
    }
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TemplateStorageService {
    if (!TemplateStorageService.instance) {
      TemplateStorageService.instance = new TemplateStorageService()
    }
    return TemplateStorageService.instance
  }

  /**
   * Load templates from storage with fallback mechanism
   */
  public async loadTemplates(): Promise<EnhancedCodeTemplate[]> {
    try {
      // Try primary storage (localStorage)
      const primaryData = await this.loadFromStorage('localStorage')
      if (primaryData && this.validateStorageData(primaryData)) {
        return primaryData.templates
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }

    try {
      // Fallback to session storage
      const fallbackData = await this.loadFromStorage('sessionStorage')
      if (fallbackData && this.validateStorageData(fallbackData)) {
        return fallbackData.templates
      }
    } catch (error) {
      console.warn('Failed to load from sessionStorage:', error)
    }

    // Return empty array if both fail
    return []
  }

  /**
   * Save templates to storage with fallback mechanism
   */
  public async saveTemplates(templates: EnhancedCodeTemplate[]): Promise<void> {
    const data: TemplateStorageData = {
      version: this.config.version,
      savedAt: new Date().toISOString(),
      templates,
    }

    const serializedData = JSON.stringify(data)

    // Try primary storage first
    try {
      localStorage.setItem(this.config.primaryKey, serializedData)
      return
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }

    // Fallback to session storage
    try {
      sessionStorage.setItem(this.config.fallbackKey, serializedData)
    } catch (error) {
      console.error('Failed to save to sessionStorage as well:', error)
      throw new Error('Unable to persist templates to any storage mechanism')
    }
  }

  /**
   * Clear all template data from storage
   */
  public async clearTemplates(): Promise<void> {
    try {
      localStorage.removeItem(this.config.primaryKey)
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }

    try {
      sessionStorage.removeItem(this.config.fallbackKey)
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error)
    }
  }

  /**
   * Export templates as JSON string
   */
  public async exportTemplates(templates: EnhancedCodeTemplate[]): Promise<string> {
    const exportData = {
      version: this.config.version,
      exportedAt: new Date().toISOString(),
      source: 'template-manager',
      templates: templates.filter(template => !template.isDefault), // Only export custom templates
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import templates from JSON string
   */
  public async importTemplates(jsonData: string): Promise<EnhancedCodeTemplate[]> {
    try {
      const importData = JSON.parse(jsonData)
      
      if (!this.validateImportData(importData)) {
        throw new Error('Invalid import data format')
      }

      // Validate each template
      const validTemplates: EnhancedCodeTemplate[] = []
      for (const templateData of importData.templates) {
        try {
          const template: EnhancedCodeTemplate = {
            ...templateData,
            id: this.generateTemplateId(), // Generate new ID to avoid conflicts
            createdAt: new Date(templateData.createdAt || new Date()),
            updatedAt: new Date(),
            isDefault: false, // Imported templates are always custom
          }

          if (this.validateTemplateData(template)) {
            validTemplates.push(template)
          }
        } catch (error) {
          console.warn('Skipping invalid template during import:', error)
        }
      }

      return validTemplates
    } catch (error) {
      throw new Error(`Failed to import templates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check storage availability and capacity
   */
  public async checkStorageHealth(): Promise<{
    localStorage: boolean
    sessionStorage: boolean
    capacity: {
      localStorage?: number
      sessionStorage?: number
    }
  }> {
    const result = {
      localStorage: false,
      sessionStorage: false,
      capacity: {} as { localStorage?: number; sessionStorage?: number },
    }

    // Test localStorage
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      result.localStorage = true
      
      // Estimate capacity (rough approximation)
      result.capacity.localStorage = this.estimateStorageCapacity('localStorage')
    } catch (error) {
      result.localStorage = false
    }

    // Test sessionStorage
    try {
      const testKey = '__storage_test__'
      sessionStorage.setItem(testKey, 'test')
      sessionStorage.removeItem(testKey)
      result.sessionStorage = true
      
      // Estimate capacity (rough approximation)
      result.capacity.sessionStorage = this.estimateStorageCapacity('sessionStorage')
    } catch (error) {
      result.sessionStorage = false
    }

    return result
  }

  /**
   * Recover from corrupted data by resetting to defaults
   */
  public async recoverFromCorruption(): Promise<void> {
    console.warn('Recovering from template data corruption...')
    
    // Clear all corrupted data
    await this.clearTemplates()
    
    // Could optionally create backup of corrupted data for debugging
    try {
      const corruptedData = localStorage.getItem(this.config.primaryKey)
      if (corruptedData) {
        localStorage.setItem(`${this.config.primaryKey}_corrupted_${Date.now()}`, corruptedData)
      }
    } catch (error) {
      // Ignore backup errors
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Load data from specific storage type
   */
  private async loadFromStorage(storageType: 'localStorage' | 'sessionStorage'): Promise<TemplateStorageData | null> {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage
    const key = storageType === 'localStorage' ? this.config.primaryKey : this.config.fallbackKey
    
    const data = storage.getItem(key)
    if (!data) return null

    return JSON.parse(data)
  }

  /**
   * Validate storage data structure
   */
  private validateStorageData(data: any): data is TemplateStorageData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.version === 'string' &&
      typeof data.savedAt === 'string' &&
      Array.isArray(data.templates)
    )
  }

  /**
   * Validate import data structure
   */
  private validateImportData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      Array.isArray(data.templates) &&
      data.templates.length >= 0
    )
  }

  /**
   * Validate individual template data
   */
  private validateTemplateData(template: any): template is EnhancedCodeTemplate {
    return (
      template &&
      typeof template === 'object' &&
      typeof template.id === 'string' &&
      typeof template.name === 'string' &&
      typeof template.code === 'string' &&
      typeof template.language === 'string' &&
      typeof template.languageId === 'number' &&
      typeof template.category === 'string' &&
      typeof template.isDefault === 'boolean'
    )
  }

  /**
   * Generate unique template ID
   */
  private generateTemplateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Estimate storage capacity (rough approximation)
   */
  private estimateStorageCapacity(storageType: 'localStorage' | 'sessionStorage'): number {
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage
    
    try {
      // Get current usage
      let currentSize = 0
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (key) {
          const value = storage.getItem(key)
          if (value) {
            currentSize += key.length + value.length
          }
        }
      }

      // Rough estimate: most browsers allow 5-10MB for localStorage
      // This is a very rough approximation
      const estimatedTotal = storageType === 'localStorage' ? 5 * 1024 * 1024 : 5 * 1024 * 1024 // 5MB
      return Math.max(0, estimatedTotal - currentSize)
    } catch (error) {
      return 0
    }
  }
}

/**
 * Convenience functions for direct usage
 */

/**
 * Get storage service instance
 */
export function getTemplateStorageService(): TemplateStorageService {
  return TemplateStorageService.getInstance()
}

/**
 * Load templates from storage
 */
export async function loadTemplatesFromStorage(): Promise<EnhancedCodeTemplate[]> {
  const service = getTemplateStorageService()
  return service.loadTemplates()
}

/**
 * Save templates to storage
 */
export async function saveTemplatesToStorage(templates: EnhancedCodeTemplate[]): Promise<void> {
  const service = getTemplateStorageService()
  return service.saveTemplates(templates)
}

/**
 * Export templates to JSON
 */
export async function exportTemplatesToJSON(templates: EnhancedCodeTemplate[]): Promise<string> {
  const service = getTemplateStorageService()
  return service.exportTemplates(templates)
}

/**
 * Import templates from JSON
 */
export async function importTemplatesFromJSON(jsonData: string): Promise<EnhancedCodeTemplate[]> {
  const service = getTemplateStorageService()
  return service.importTemplates(jsonData)
}

/**
 * Check storage health
 */
export async function checkTemplateStorageHealth() {
  const service = getTemplateStorageService()
  return service.checkStorageHealth()
}

/**
 * Recover from storage corruption
 */
export async function recoverFromTemplateStorageCorruption(): Promise<void> {
  const service = getTemplateStorageService()
  return service.recoverFromCorruption()
}