const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA'
)

async function testRPC() {
  console.log('=== Testing record_submission_with_points RPC ===')
  
  const { data, error } = await supabase.rpc('record_submission_with_points', {
    p_user_id: '00000000-0000-0000-0000-000000000000',
    p_problem_id: '00000000-0000-0000-0000-000000000000',
    p_contest_id: null,
    p_language: 'python',
    p_code: 'print("hello")',
    p_status: 'accepted',
    p_execution_time: 10,
    p_memory_used: 100,
    p_test_cases_passed: 1,
    p_total_test_cases: 1,
    p_points: 10
  })
  
  if (error) {
    console.log('RPC Error:', error.message)
    console.log('Details:', error.details)
    console.log('Hint:', error.hint)
  } else {
    console.log('RPC Success:', data)
  }
}

testRPC().catch(console.error)
