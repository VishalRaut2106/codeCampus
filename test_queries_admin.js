// Test script with Service Role Key
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA'
)

async function test() {
  console.log('=== Testing Submissions Table (Service Role) ===')
  
  const { data: submissions, error: subErr, count } = await supabase
    .from('submissions')
    .select('id, status, language, submitted_at, user_id, problem_id, score', { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .limit(5)
  
  if (subErr) {
    console.log('Submissions query ERROR:', subErr.message)
  } else {
    console.log('Total submissions:', count)
    console.log('Latest 5:', JSON.stringify(submissions, null, 2))
  }

  console.log('\n=== Testing Admin Join Query (Natural Join) ===')
  const { data: joinedSubs, error: joinErr } = await supabase
    .from('submissions')
    .select(`
      id,
      status,
      language,
      submitted_at,
      score,
      users (name, username),
      problems (title, difficulty)
    `)
    .order('submitted_at', { ascending: false })
    .limit(3)

  if (joinErr) {
    console.log('Join query ERROR:', joinErr.message, joinErr.details, joinErr.hint)
  } else {
    console.log('Joined submissions (Natural Join):', JSON.stringify(joinedSubs, null, 2))
  }
}

test().catch(console.error)
