const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA'
)

async function testInsert() {
  console.log('=== Testing Manual Insert ===')
  
  // Try to insert a dummy submission (we need a valid user_id and problem_id though... let's just use UUIDs and see the FK errors)
  const { data, error } = await supabase.from('submissions').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    problem_id: '00000000-0000-0000-0000-000000000000',
    code: 'print("hello")',
    language: 'python',
    status: 'accepted',
    execution_time: 10,
    memory_used: 1024,
    test_cases_passed: 1,
    total_test_cases: 1,
    score: 100
  }).select()

  if (error) {
    console.log('Insert Error:', error.message, error.details, error.hint)
  } else {
    console.log('Insert Success:', data)
  }
}

testInsert().catch(console.error)
