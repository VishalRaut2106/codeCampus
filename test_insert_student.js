const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA'
)

async function testInsert() {
  console.log('=== Testing Manual Insert with student_id ===')
  
  const payload = {
    student_id: '00000000-0000-0000-0000-000000000000',
    problem_id: '00000000-0000-0000-0000-000000000000',
    code: 'print("hello")',
    language: 'python',
    status: 'accepted'
  }

  const { data, error } = await supabase.from('submissions').insert(payload).select()

  if (error) {
    console.log('Insert Error:', error.message)
  } else {
    console.log('Insert Success:', data)
  }
}

testInsert().catch(console.error)
