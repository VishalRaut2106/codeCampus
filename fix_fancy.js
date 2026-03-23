
const { createClient } = require('@supabase/supabase-client');

const supabaseUrl = 'https://lgswfhaklonuhctzsvhd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc3dmaGFrbG9udWhjdHpzdmhkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTY4MzMxMCwiZXhwIjoyMDc1MjU5MzEwfQ.X5WK_RPWOe2prvTcJFSI0kiJjrFoxVaQTAt3fX4xXzA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFancy() {
    // 1. Find the problem
    const { data: problems, error: pError } = await supabase
        .from('problems')
        .select('*')
        .ilike('title', '%Fancy%');

    if (pError || !problems.length) {
        console.error('Problem not found');
        return;
    }

    const p = problems[0];
    console.log(`Fixing problem: ${p.title} [${p.id}]`);

    // 2. Correct Test Case
    // Current state (from screenshot): 
    // input = ["Fancy","append",...]
    // expected = [[],[2],...]
    
    // Target state:
    // input = [["Fancy","append",...], [[],[2],...]]
    // expected = [null,null,null,null,null,10,null,null,null,26,34,20]

    const testCases = p.test_cases;
    if (!testCases || !testCases.length) {
        console.error('No test cases to fix');
        return;
    }

    const tc = testCases[0];
    try {
        const commands = JSON.parse(tc.input);
        const args = JSON.parse(tc.expected_output);
        
        const mergedInput = JSON.stringify([commands, args]);
        // The real expected output for Example 1
        const actualOutput = "[null,null,null,null,null,10,null,null,null,26,34,20]";

        console.log('New Input:', mergedInput);
        console.log('New Expected:', actualOutput);

        const newTestCases = [{
            ...tc,
            input: mergedInput,
            expected_output: actualOutput
        }];

        const { error: uError } = await supabase
            .from('problems')
            .update({ test_cases: newTestCases })
            .eq('id', p.id);

        if (uError) throw uError;
        console.log('Successfully fixed Fancy Sequence test case!');
    } catch (e) {
        console.error('Failed to parse or update:', e);
    }
}

fixFancy();
