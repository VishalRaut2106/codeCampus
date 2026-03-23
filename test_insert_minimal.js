const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA'
)

async function inspectColumns() {
  console.log('=== Inspecting Submissions Table Columns ===')
  
  // We can't query information_schema directly via REST API usually, but let's try calling another RPC or just do a standard select and look at the keys if there's data. 
  // Wait, there is no data. 
  // Let's create an RPC to get columns, or just use `psql` if we had it.
  // Actually, we can just do a very simple insert and see the error, then remove the bad column, try again.
  // The error was "Could not find the 'execution_time' column".
  // Let's try inserting without it.
  
  const payload = {
    user_id: '00000000-0000-0000-0000-000000000000',
    problem_id: '00000000-0000-0000-0000-000000000000',
    code: 'print("hello")',
    language: 'python',
    status: 'accepted'
    // removed execution_time, memory_used, test_cases_passed, total_test_cases, score
  }

  const { data, error } = await supabase.from('submissions').insert(payload).select()

  if (error) {
    console.log('Insert Error:', error.message)
  } else {
    console.log('Insert Success:', data)
  }
}

inspectColumns().catch(console.error)
