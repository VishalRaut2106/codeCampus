const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA'
)

async function testJoinQuery() {
  console.log('=== Testing Different Join Syntaxes ===')
  
  // Test 1: Implicit foreign keys (Supabase usually infers this if there's only one FK)
  const { data: q1, error: e1 } = await supabase
    .from('submissions')
    .select(`
      id,
      user:users(name, username),
      problem:problems(title, difficulty)
    `)
    .limit(1)
  
  if (e1) {
    console.log('Query 1 Error:', e1.message)
  } else {
    console.log('Query 1 Success! Syntax: user:users(name, username)')
  }

  // Test 2: Explicit with student_id
  const { data: q2, error: e2 } = await supabase
    .from('submissions')
    .select(`
      id,
      user:users!submissions_student_id_fkey(name, username),
      problem:problems!submissions_problem_id_fkey(title, difficulty)
    `)
    .limit(1)
    
  if (e2) {
    console.log('Query 2 Error:', e2.message)
  } else {
    console.log('Query 2 Success! Syntax: user:users!submissions_student_id_fkey(...)')
  }

  // Test 3: Standard left join without alias
  const { data: q3, error: e3 } = await supabase
    .from('submissions')
    .select(`
      id,
      users (name, username),
      problems (title, difficulty)
    `)
    .limit(1)
    
  if (e3) {
    console.log('Query 3 Error:', e3.message)
  } else {
    console.log('Query 3 Success! Syntax: users(name, username)')
  }
}

testJoinQuery().catch(console.error)
