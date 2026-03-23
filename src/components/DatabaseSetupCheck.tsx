'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DatabaseStatus {
  connection: boolean
  usersTable: boolean
  requiredColumns: boolean
  rlsEnabled: boolean
  errors: string[]
}

export default function DatabaseSetupCheck() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [runningMigration, setRunningMigration] = useState(false)

  const checkDatabase = async () => {
    setLoading(true)
    setStatus(null)
    
    const supabase = createClient()
    const errors: string[] = []
    let connection = false
    let usersTable = false
    let requiredColumns = false
    let rlsEnabled = false

    try {
      // Test connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (connectionError) {
        if (connectionError.code === 'PGRST116' || connectionError.message?.includes('relation "users" does not exist')) {
          errors.push('Users table does not exist. Please run the database migration.')
        } else {
          errors.push(`Connection error: ${connectionError.message}`)
        }
      } else {
        connection = true
      }

      // Check if users table exists
      if (connection) {
        const { data: tableCheck, error: tableError } = await supabase
          .from('users')
          .select('id')
          .limit(1)

        if (tableError) {
          errors.push(`Table access error: ${tableError.message}`)
        } else {
          usersTable = true
        }
      }

      // Check required columns
      if (usersTable) {
        const { data: columnCheck, error: columnError } = await supabase
          .from('users')
          .select('id, name, email, username, prn, bio, profile_visible, approval_status')
          .limit(1)

        if (columnError) {
          errors.push(`Missing columns: ${columnError.message}`)
        } else {
          requiredColumns = true
        }
      }

      // Check RLS
      if (requiredColumns) {
        const { data: rlsCheck, error: rlsError } = await supabase
          .from('users')
          .select('id')
          .limit(1)

        if (rlsError && rlsError.code === '42501') {
          errors.push('Row Level Security (RLS) is not properly configured')
        } else {
          rlsEnabled = true
        }
      }

    } catch (error) {
      errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setStatus({
      connection,
      usersTable,
      requiredColumns,
      rlsEnabled,
      errors
    })
    setLoading(false)
  }

  const runMigration = async () => {
    setRunningMigration(true)
    
    try {
      // Database setup should be done via migration scripts
      toast.info('Database Setup', {
        description: 'Please run migration scripts in src/lib/database/migrations/ folder using Supabase SQL Editor'
      })
      
      // Check if database is already configured
      await checkDatabase()
    } catch (error) {
      toast.error('Setup check error', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    
    setRunningMigration(false)
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Database Setup Check
          </CardTitle>
          <CardDescription>
            Check your database configuration and run migrations if needed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={checkDatabase} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Database...
              </>
            ) : (
              'Check Database Status'
            )}
          </Button>

          {status && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.connection)}
                  <span className={getStatusColor(status.connection)}>
                    Database Connection
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.usersTable)}
                  <span className={getStatusColor(status.usersTable)}>
                    Users Table
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.requiredColumns)}
                  <span className={getStatusColor(status.requiredColumns)}>
                    Required Columns
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.rlsEnabled)}
                  <span className={getStatusColor(status.rlsEnabled)}>
                    Row Level Security
                  </span>
                </div>
              </div>

              {status.errors.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Issues found:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {status.errors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!status.connection && (
                <div className="space-y-2">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Database connection failed. Please check your Supabase configuration.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {status.connection && !status.usersTable && (
                <div className="space-y-2">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Users table not found. Please set up the database.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={runMigration} 
                    disabled={runningMigration}
                    className="w-full"
                  >
                    {runningMigration ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking Database...
                      </>
                    ) : (
                      'Check Database Setup'
                    )}
                  </Button>
                </div>
              )}

              {status.connection && status.usersTable && !status.requiredColumns && (
                <div className="space-y-2">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Users table exists but missing required columns. Please run the migration.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={runMigration} 
                    disabled={runningMigration}
                    className="w-full"
                  >
                    {runningMigration ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking Database...
                      </>
                    ) : (
                      'Check Database Setup'
                    )}
                  </Button>
                </div>
              )}

              {status.connection && status.usersTable && status.requiredColumns && status.rlsEnabled && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Database is properly configured! All checks passed.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
