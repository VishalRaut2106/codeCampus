/**
 * Database Helper Utilities
 * 
 * Common utility functions for database operations to reduce code duplication.
 */

import { createServerClientSafe } from '@/lib/supabase/server-safe'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Query options for pagination and filtering
 */
export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Get a server-side Supabase client
 * 
 * @returns Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
  return createServerClientSafe()
}

/**
 * Execute a query with pagination
 * 
 * @param tableName - Name of the table to query
 * @param options - Query options (limit, offset, orderBy)
 * @param filters - Optional filters to apply
 * @returns Paginated response with data and metadata
 */
export async function queryWithPagination<T>(
  tableName: string,
  options: QueryOptions = {},
  filters?: Record<string, any>
): Promise<PaginatedResponse<T>> {
  const supabase = getSupabaseClient()
  const {
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = options

  // Build query
  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact' })

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
  }

  // Apply ordering and pagination
  query = query
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }

  const total = count || 0
  const hasMore = offset + limit < total

  return {
    data: (data || []) as T[],
    total,
    limit,
    offset,
    hasMore
  }
}

/**
 * Check if a record exists
 * 
 * @param tableName - Name of the table
 * @param filters - Filters to apply
 * @returns True if record exists, false otherwise
 */
export async function recordExists(
  tableName: string,
  filters: Record<string, any>
): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from(tableName)
    .select('id', { count: 'exact', head: true })

  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value)
  })

  const { count, error } = await query

  if (error) {
    throw new Error(`Record existence check failed: ${error.message}`)
  }

  return (count || 0) > 0
}

/**
 * Get a single record by ID
 * 
 * @param tableName - Name of the table
 * @param id - Record ID
 * @param select - Columns to select (default: *)
 * @returns Record or null if not found
 */
export async function getRecordById<T>(
  tableName: string,
  id: string,
  select: string = '*'
): Promise<T | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from(tableName)
    .select(select)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Record not found
      return null
    }
    throw new Error(`Failed to fetch record: ${error.message}`)
  }

  return data as T
}

/**
 * Create a new record
 * 
 * @param tableName - Name of the table
 * @param data - Data to insert
 * @returns Created record
 */
export async function createRecord<T>(
  tableName: string,
  data: Partial<T>
): Promise<T> {
  const supabase = getSupabaseClient()

  const { data: record, error } = await supabase
    .from(tableName)
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create record: ${error.message}`)
  }

  return record as T
}

/**
 * Update a record by ID
 * 
 * @param tableName - Name of the table
 * @param id - Record ID
 * @param data - Data to update
 * @returns Updated record
 */
export async function updateRecord<T>(
  tableName: string,
  id: string,
  data: Partial<T>
): Promise<T> {
  const supabase = getSupabaseClient()

  const { data: record, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update record: ${error.message}`)
  }

  return record as T
}

/**
 * Delete a record by ID
 * 
 * @param tableName - Name of the table
 * @param id - Record ID
 * @returns True if deleted successfully
 */
export async function deleteRecord(
  tableName: string,
  id: string
): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete record: ${error.message}`)
  }

  return true
}

/**
 * Execute a database function (RPC)
 * 
 * @param functionName - Name of the database function
 * @param params - Function parameters
 * @returns Function result
 */
export async function executeFunction<T>(
  functionName: string,
  params?: Record<string, any>
): Promise<T> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc(functionName, params)

  if (error) {
    throw new Error(`Database function failed: ${error.message}`)
  }

  return data as T
}

/**
 * Count records in a table
 * 
 * @param tableName - Name of the table
 * @param filters - Optional filters
 * @returns Record count
 */
export async function countRecords(
  tableName: string,
  filters?: Record<string, any>
): Promise<number> {
  const supabase = getSupabaseClient()

  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
  }

  const { count, error } = await query

  if (error) {
    throw new Error(`Count query failed: ${error.message}`)
  }

  return count || 0
}
