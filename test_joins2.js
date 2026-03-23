const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA' // From .env.local
)

async function testJoinQuery() {
  console.log('=== Testing Only Users Join ===')
  const { data: q1, error: e1 } = await supabase
    .from('submissions')
    .select(`
      id,
      user:users!submissions_student_id_fkey(name, username)
    `)
    .limit(1)
  
  if (e1) {
    console.log('Users Join Error:', e1.message)
  } else {
    console.log('Users Join Success!')
  }

  console.log('=== Testing Only Problems Join ===')
  const { data: q2, error: e2 } = await supabase
    .from('submissions')
    .select(`
      id,
      problem:problems(title, difficulty)
    `)
    .limit(1)
    
  if (e2) {
    console.log('Problems Join Error:', e2.message)
  } else {
    console.log('Problems Join Success!')
  }
}

testJoinQuery().catch(console.error)
