const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA' // From .env.local
)

async function getForeignKeys() {
  console.log('=== Fetching Foreign Keys ===')
  
  const { data: users } = await supabase.from('users').select('id').limit(1)
  
  if (users?.length) {
    const validUserId = users[0].id
    const invalidProblemId = '00000000-0000-0000-0000-000000000000'
    
    // Attempt insert with valid user, invalid problem
    const { error: e3 } = await supabase.from('submissions').insert({
      user_id: validUserId,   // Note: Actual column name
      problem_id: invalidProblemId,
      code: 'test'
    })
    
    console.log('Insert error with valid user & invalid problem:', e3?.message)
  }
}

getForeignKeys().catch(console.error)
