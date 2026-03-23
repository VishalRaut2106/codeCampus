const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA' // From .env.local
)

async function getCsvHeaders() {
  console.log('=== Fetching CSV Headers for Submissions ===')

  const { data, error } = await supabase.from('submissions').select('*').limit(1).csv()
  
  if (error) {
    console.log('Error fetching CSV:', error.message)
  } else {
    console.log('CSV Headers/Rows:', data)
  }
}

getCsvHeaders().catch(console.error)
