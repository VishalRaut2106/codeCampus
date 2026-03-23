const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA' // From .env.local
)

async function getColumns() {
  const payload = {
    code: 'print("hello")'
  }
  const { data, error } = await supabase.from('submissions').insert(payload).select()
  
  if (error) {
    console.log('Insert error:', error.message)
  } else {
    console.log('Inserted:', data)
  }
}

getColumns().catch(console.error)
