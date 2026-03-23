
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectSchema() {
  console.log('Inspecting submissions table schema...')

  // We can't query information_schema directly with supabase-js easily unless we use RPC
  // But we can try to select a single row and look at the returned keys
  
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching submissions:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns found in submissions table:', Object.keys(data[0]))
  } else {
    // If table is empty, we can't see keys this way.
    // Try to insert a dummy row if we can, or just print that it's empty.
    console.log('Submissions table is empty. Attempting to insert dummy to see structure (transaction rolled back effectively by not doing it)')
    console.log('Actually, let\'s try to use RPC to get columns if possible, or just fail.')
  }
}

inspectSchema()
