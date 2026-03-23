
const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = 'https://lgswfhaklonuhctzsvhd.supabase.co';
const supabaseKey = 'SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER'; // I'll use the one from .env.local

const supabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA');

async function checkFancy() {
    const { data: problems, error: pError } = await supabase
        .from('problems')
        .select('*')
        .ilike('title', '%Fancy%');

    if (pError) {
        console.error('Error fetching problems:', pError);
        return;
    }

    console.log('Problems found:', problems.length);
    for (const p of problems) {
        console.log(`- [${p.id}] ${p.title}`);
        const { data: testCases, error: tError } = await supabase
            .from('test_cases')
            .select('*')
            .eq('problem_id', p.id);
        
        if (tError) {
            console.error(`Error fetching test cases for ${p.id}:`, tError);
            continue;
        }

        console.log(`  Test cases: ${testCases.length}`);
        testCases.forEach((tc, i) => {
            console.log(`  [TC ${i+1}] Input: ${tc.input}`);
            console.log(`          Expected: ${tc.expected_output}`);
        });
    }
}

checkFancy();
