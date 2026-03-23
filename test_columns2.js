const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA' // From .env.local line 12
)

async function getColumns() {
  console.log('=== Fetching Columns Error Message ===')

  // Insert empty object to see what required column fails
  const { data, error } = await supabase.from('submissions').insert({}).select()
  
  if (error) {
    console.log('Insert empty object error:', error.message, error.details, error.hint)
  } else {
    console.log('Inserted empty row??', data)
  }
}

getColumns().catch(console.error)
