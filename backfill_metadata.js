const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function extractPythonMetadata(pythonCode) {
    if (!pythonCode) return null;
    
    // Simple regex to match: def functionName(self, arg1: type1, arg2: type2) -> returnType:
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
            
            if (name !== 'self') {
                parameters.push({ name: name.trim(), type: type });
            }
            currentParam = "";
        } else {
            currentParam += char;
        }
    }

    if (currentParam.trim()) {
        const parts = currentParam.split(':').map(s => s.trim());
        const name = parts[0];
        const type = parts.length > 1 ? parts.slice(1).join(':').trim() : "any";
        if (name !== 'self') {
            parameters.push({ name: name.trim(), type: type });
        }
    }

    return { function_name: functionName, parameters, return_type: returnType };
}

async function backfillMetadata() {
    console.log("Fetching problems...");
    const { data: problems, error } = await supabase
        .from('problems')
        .select('id, title, code_snippets, function_name, parameters, return_type');

    if (error) {
        console.error("Error fetching problems:", error);
        return;
    }

    for (const p of problems) {
        // If function_name is 'solve' (the default) and parameters is empty, it probably needs backfilling
        if (p.function_name === 'solve' && (!p.parameters || p.parameters.length === 0)) {
            let pythonSnippet = "";
            let isDesign = false;
            
            // Look for python snippet
            if (p.code_snippets && Array.isArray(p.code_snippets)) {
                const py = p.code_snippets.find(s => s.langSlug === 'python3' || s.langSlug === 'python');
                if (py) {
                    pythonSnippet = py.code;
                }
            } else if (p.code_snippets && typeof p.code_snippets === 'object') {
                if (p.code_snippets['python3']) pythonSnippet = p.code_snippets['python3'];
                else if (p.code_snippets['python']) pythonSnippet = p.code_snippets['python'];
            }

            if (pythonSnippet) {
                // Check if it's a design problem
                if (pythonSnippet.includes('__init__') && pythonSnippet.includes('class ') && pythonSnippet.split('def ').length > 2) {
                    console.log(`[${p.title}] Keeping 'solve', this is a Design structure...`);
                    continue;
                }

                const metadata = await extractPythonMetadata(pythonSnippet);
                if (metadata) {
                    console.log(`[${p.title}] Updating to ${metadata.function_name}(${metadata.parameters.map(p=>p.name).join(', ')}) -> ${metadata.return_type}`);
                    
                    const { error: updError } = await supabase
                        .from('problems')
                        .update({
                            function_name: metadata.function_name,
                            parameters: metadata.parameters,
                            return_type: metadata.return_type
                        })
                        .eq('id', p.id);
                        
                    if (updError) console.error("Failed to update:", updError);
                } else {
                    console.log(`[${p.title}] Could not extract metadata from Python code.`);
                }
            } else {
                console.log(`[${p.title}] No Python snippet found.`);
            }
        } else {
             console.log(`[${p.title}] Skipped - Has custom metadata or parameters already.`);
        }
    }
    
    console.log("Done.");
}

backfillMetadata();
