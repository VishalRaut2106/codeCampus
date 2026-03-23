'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Database, RefreshCw } from 'lucide-react'

interface DiagnosticResult {
  success: boolean
  timestamp: string
  diagnostic: {
    connection: { success: boolean; error?: string; details?: any }
    usersTable: { success: boolean; error?: string; details?: any }
    schema: { success: boolean; error?: string; details?: any }
    environment: {
      supabaseUrl: boolean
      supabaseKey: boolean
    }
  }
  recommendations: string[]
}

export default function DatabaseTest() {
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostic = async () => {
    setLoading(true)
    try {
      // Use health-check endpoint instead
      const response = await fetch('/api/health-check')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Failed to run diagnostic:', error)
      setResult({
        success: false,
        timestamp: new Date().toISOString(),
        diagnostic: {
          connection: { success: false, error: 'Failed to connect to API' },
          usersTable: { success: false, error: 'API unavailable' },
          schema: { success: false, error: 'API unavailable' },
          environment: { supabaseUrl: false, supabaseKey: false }
        },
        recommendations: ['Check API endpoint and network connectivity']
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (success: boolean) => {
    if (success) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (success: boolean) => {
    if (success) return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Success</Badge>
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Diagnostic Tool
          </CardTitle>
          <CardDescription>
            Test your Supabase connection and database setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runDiagnostic} 
            disabled={loading}
            className="glass-button"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Diagnostic...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Run Database Test
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Environment Check */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(result.diagnostic.environment.supabaseUrl && result.diagnostic.environment.supabaseKey)}
                Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Supabase URL</span>
                {getStatusBadge(result.diagnostic.environment.supabaseUrl)}
              </div>
              <div className="flex items-center justify-between">
                <span>Supabase Key</span>
                {getStatusBadge(result.diagnostic.environment.supabaseKey)}
              </div>
            </CardContent>
          </Card>

          {/* Connection Test */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(result.diagnostic.connection.success)}
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.diagnostic.connection.success ? (
                <p className="text-green-400">✅ Connection successful</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-400">❌ Connection failed</p>
                  <p className="text-sm text-muted-foreground">
                    {result.diagnostic.connection.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Users Table Check */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(result.diagnostic.usersTable.success)}
                Users Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.diagnostic.usersTable.success ? (
                <p className="text-green-400">✅ Users table exists</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-400">❌ Users table not found</p>
                  <p className="text-sm text-muted-foreground">
                    {result.diagnostic.usersTable.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schema Check */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(result.diagnostic.schema.success)}
                Database Schema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.diagnostic.schema.success ? (
                <div className="space-y-2">
                  <p className="text-green-400">✅ Schema is valid</p>
                  {result.diagnostic.schema.details?.availableFields && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Available fields:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.diagnostic.schema.details.availableFields.map((field: string) => (
                          <Badge key={field} variant="outline" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-400">❌ Schema validation failed</p>
                  <p className="text-sm text-muted-foreground">
                    {result.diagnostic.schema.error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
