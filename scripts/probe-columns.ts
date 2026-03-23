
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function probe() {
  console.log('Probing created_at...')
  const { error: err1 } = await supabase.from('submissions').select('created_at').limit(1)
  if (err1) {
    console.log('created_at failed:', err1.message)
  } else {
    console.log('created_at exists!')
    return
  }

  console.log('Probing submitted_at...')
  const { error: err2 } = await supabase.from('submissions').select('submitted_at').limit(1)
  if (err2) {
    console.log('submitted_at failed:', err2.message)
  } else {
    console.log('submitted_at exists!')
    return
  }

  console.log('Probing date...')
  const { error: err3 } = await supabase.from('submissions').select('date').limit(1)
  if (err3) {
    console.log('date failed:', err3.message)
  } else {
    console.log('date exists!')
  }
}

probe()
