const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchFromLeetCode(titleSlug) {
    const detailResponse = await fetch(`https://leetcode.com/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query getQuestionDetail($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              codeSnippets { langSlug code }
            }
          }
        `,
        variables: { titleSlug }
      })
    });
    
    if (!detailResponse.ok) return null;
    const detailData = await detailResponse.json();
    const snippets = detailData.data?.question?.codeSnippets;
    if (!snippets) return null;
    
    const py = snippets.find(s => s.langSlug === 'python3' || s.langSlug === 'python');
    return py ? py.code : null;
}

async function extractPythonMetadata(pythonCode) {
    if (!pythonCode) return null;
    const match = pythonCode.match(/def\s+(\w+)\s*\((.*?)\)\s*(?:->\s*(.*?))?:/);
    if (!match) return null;

    const functionName = match[1];
    const paramsStr = match[2];
    const returnType = match[3] ? match[3].trim() : "any";

    let parameters = [];
    let currentParam = "";
    let bracketDepth = 0;

    for (let i = 0; i < paramsStr.length; i++) {
        const char = paramsStr[i];
        if (char === '[' || char === '(') bracketDepth++;
        else if (char === ']' || char === ')') bracketDepth--;
        
        if (char === ',' && bracketDepth === 0) {
            const parts = currentParam.split(':').map(s => s.trim());
            const name = parts[0];
            const type = parts.length > 1 ? parts.slice(1).join(':').trim() : "any";
            if (name !== 'self') parameters.push({ name: name.trim(), type: type });
            currentParam = "";
        } else {
            currentParam += char;
        }
    }

    if (currentParam.trim()) {
        const parts = currentParam.split(':').map(s => s.trim());
        const name = parts[0];
        const type = parts.length > 1 ? parts.slice(1).join(':').trim() : "any";
        if (name !== 'self') parameters.push({ name: name.trim(), type: type });
    }

    return { function_name: functionName, parameters, return_type: returnType };
}

async function backfill() {
    console.log("Fetching problems...");
    const { data: problems, error } = await supabase.from('problems').select('id, title, function_name, parameters');

    for (const p of problems) {
        if (p.function_name === 'solve' && (!p.parameters || p.parameters.length === 0)) {
            const titleSlug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            console.log(`[${p.title}] Fetching slug: ${titleSlug}`);
            
            const pCode = await fetchFromLeetCode(titleSlug);
            if (pCode) {
                if (pCode.includes('__init__') && pCode.includes('class ') && pCode.split('def ').length > 2) {
                    console.log(`[${p.title}] Design problem, skipping auto-update`);
                    continue;
                }
                const metadata = await extractPythonMetadata(pCode);
                if (metadata) {
                    console.log(`[${p.title}] Executing Update: ${metadata.function_name}(${metadata.parameters.map(x=>x.name).join(',')}) -> ${metadata.return_type}`);
                    await supabase.from('problems').update({
                        function_name: metadata.function_name,
                        parameters: metadata.parameters,
                        return_type: metadata.return_type
                    }).eq('id', p.id);
                } else {
                    console.log(`[${p.title}] Failed to extract metadata from snippet`);
                }
            } else {
                console.log(`[${p.title}] Failed to fetch from LeetCode`);
            }
        } else {
            console.log(`[${p.title}] Already valid or custom`);
        }
    }
}
backfill();
