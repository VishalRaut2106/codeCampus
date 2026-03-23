const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA'
)

async function inspectSchema() {
  console.log('=== Inspecting Schema ===')
  
  // Try querying pg_class via rest
  const { data: tables, error: tableErr } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    
  if (tableErr) {
    console.log('Cant read information_schema (normal).')
  } else {
    console.log('Public tables:', tables.map(t => t.table_name).join(', '))
  }

  // Check submissions columns
  const { data: subData, error: subErr } = await supabase
    .from('submissions')
    .select('*')
    .limit(1)

  if (subErr) {
    console.log('Error reading submissions:', subErr.message)
  } else {
    console.log('Submissions columns exist. No data.')
  }
}

inspectSchema().catch(console.error)
