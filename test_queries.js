// Test script to check Supabase data for heatmap and admin analytics
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://lgswfhaklonuhctzsvhd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2ODMzMTAsImV4cCI6MjA3NTI1OTMxMH0.rZFq00ALX4kqBHN6oMRYD3XhabvCuO3lins7wmJHEjA'
)

async function test() {
  console.log('=== Testing Submissions Table ===')
  
  // 1. Check if submissions table has any data
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

  // 2. Test the admin join query (the one we added)
  console.log('\n=== Testing Admin Join Query ===')
  const { data: joinedSubs, error: joinErr } = await supabase
    .from('submissions')
    .select(`
      id,
      status,
      language,
      submitted_at,
      score,
      user:users!submissions_user_id_fkey(name, username),
      problem:problems!submissions_problem_id_fkey(title, difficulty)
    `)
    .order('submitted_at', { ascending: false })
    .limit(3)

  if (joinErr) {
    console.log('Join query ERROR:', joinErr.message, joinErr.details, joinErr.hint)
    
    // Try alternative join syntax
    console.log('\n=== Trying Alternative Join ===')
    const { data: altSubs, error: altErr } = await supabase
      .from('submissions')
      .select(`
        id,
        status,
        language,
        submitted_at,
        user_id,
        problem_id
      `)
      .order('submitted_at', { ascending: false })
      .limit(3)
    
    if (altErr) {
      console.log('Alt query ERROR:', altErr.message)
    } else {
      console.log('Alt submissions (no join):', JSON.stringify(altSubs, null, 2))
    }
  } else {
    console.log('Joined submissions:', JSON.stringify(joinedSubs, null, 2))
  }

  // 3. Check RPC  
  console.log('\n=== Testing RPC ===')
  const { data: rpcData, error: rpcErr } = await supabase
    .rpc('get_user_dashboard_data', { p_username: 'admin' })

  if (rpcErr) {
    console.log('RPC ERROR:', rpcErr.message, rpcErr.details)
  } else {
    const d = rpcData
    console.log('RPC success:', d?.success)
    console.log('Heatmap data length:', d?.heatmap?.length || 0)
    if (d?.heatmap?.length > 0) {
      console.log('Sample heatmap:', JSON.stringify(d.heatmap.slice(0, 3), null, 2))
    }
  }

  // 4. Check audit_logs table  
  console.log('\n=== Testing Audit Logs ===')
  const { data: logs, error: logErr } = await supabase
    .from('audit_logs')
    .select('*')
    .limit(3)

  if (logErr) {
    console.log('Audit logs ERROR:', logErr.message)
  } else {
    console.log('Audit logs count:', logs?.length)
  }
}

test().catch(console.error)
