import { createClient } from '@/lib/supabase/client'

export interface DatabaseSetupResult {
  success: boolean
  error?: string
  details?: any
}

export class DatabaseSetup {
  private supabase = createClient()

  async testConnection(): Promise<DatabaseSetupResult> {
    try {
      console.log('Testing Supabase connection...')
      
      // Test basic connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) {
        return {
          success: false,
          error: `Database connection failed: ${error.message}`,
          details: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          }
        }
      }

      return {
        success: true,
        details: { data }
      }
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      }
    }
  }

  async checkTableExists(tableName: string): Promise<DatabaseSetupResult> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          return {
            success: false,
            error: `Table '${tableName}' does not exist`,
            details: error
          }
        }
        return {
          success: false,
          error: `Error checking table '${tableName}': ${error.message}`,
          details: error
        }
      }

      return {
        success: true,
        details: { tableExists: true, sampleData: data }
      }
    } catch (error) {
      return {
        success: false,
        error: `Table check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      }
    }
  }

  async checkUserTableSchema(): Promise<DatabaseSetupResult> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          username,
          prn,
          role,
          approval_status,
          department,
          mobile_number,
          linkedin_id,
          bio,
          profile_picture_url,
          profile_visible,
          approved_by,
          approved_at,
          rejection_reason,
          github_url,
          linkedin_url,
          instagram_url,
          streak,
          points,
          badges,
          created_at,
          updated_at
        `)
        .limit(1)
      
      if (error) {
        return {
          success: false,
          error: `Schema check failed: ${error.message}`,
          details: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          }
        }
      }

      return {
        success: true,
        details: { 
          schemaValid: true,
          availableFields: Object.keys(data?.[0] || {}),
          sampleData: data?.[0]
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      }
    }
  }

  async runFullDiagnostic(): Promise<{
    connection: DatabaseSetupResult
    usersTable: DatabaseSetupResult
    schema: DatabaseSetupResult
    environment: {
      supabaseUrl: boolean
      supabaseKey: boolean
    }
  }> {
    console.log('Running full database diagnostic...')
    
    const connection = await this.testConnection()
    const usersTable = await this.checkTableExists('users')
    const schema = await this.checkUserTableSchema()
    
    const environment = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }

    return {
      connection,
      usersTable,
      schema,
      environment
    }
  }
}

export const databaseSetup = new DatabaseSetup()
