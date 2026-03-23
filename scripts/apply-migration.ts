
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const sqlPath = path.resolve('src/lib/database/migrations/20260217_security_audit_fixed.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

console.log('Running SQL migration...')

// Split into statements if needed, or run as one block if pg-postgres supports it.
// Supabase-js doesn't support raw SQL execution directly via client unless rpc is used 
// or if we use the pg driver. 
// BUT, many Supabase projects have a `exec_sql` RPC or similar. 
// If not, we can try to use the `pg` library if installed.

// Let's check package.json for 'pg'.
// If 'pg' is not installed, we can't easily run raw SQL from node without an RPC.

console.log('NOTE: Since we cannot run raw SQL via supabase-js client directly without a specific RPC,')
console.log('      we will attempt to use a standard pg client if available, or print instructions.')

// Check for pg
try {
  const { Client } = require('pg')
  
  // Need connection string
  // START REMINDER: The user might not have DATABASE_URL in .env.local
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
     console.error('DATABASE_URL is missing from .env.local. Cannot connect directly to DB.')
     process.exit(1)
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  })

  async function run() {
    await client.connect()
    try {
      await client.query(sql)
      console.log('✅ Migration applied successfully!')
    } catch (err) {
      console.error('❌ Migration failed:', err)
    } finally {
      await client.end()
    }
  }
  
  run()
} catch (e) {
  console.error('pg module not found. Cannot execute SQL directly.') 
  console.log('Please copy the content of src/lib/database/migrations/20260217_security_audit_fixed.sql')
  console.log('and run it in your Supabase SQL Editor.')
}
