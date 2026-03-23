// Direct test of parseUniversalInput and generateAOTVariables
// Inline the functions directly to debug

function parseUniversalInput(input: string, parameters: any[]): string[] {
    let clean = input.replace(/[a-zA-Z_0-9]+\s*=/g, '').trim();
    if (clean.includes('\n')) {
        const parts = clean.split('\n').map((s: string) => s.trim()).filter(Boolean);
        if (parts.length >= parameters.length) return parts.slice(0, parameters.length);
    }
    
    const args: string[] = [];
    let currentArg = '';
    let depth = 0;
    
    for (let i = 0; i < clean.length; i++) {
        const char = clean[i];
        if (char === '[' || char === '{') depth++;
        else if (char === ']' || char === '}') depth--;
        
        if (char === ',' && depth === 0) {
            args.push(currentArg.trim());
            currentArg = '';
        } else {
            currentArg += char;
        }
    }
    if (currentArg.trim()) args.push(currentArg.trim());
    return args;
}

function generateAOTVariables(parameters: any[], rawArgs: string[], lang: string): string {
    let aot = '';
    for (let i = 0; i < parameters.length; i++) {
        const p = parameters[i];
        const val = rawArgs[i] || '""';
        const t = p.type.toLowerCase();
        
        if (lang === 'java') {
            const ind = '            ';
            if (t.includes('list[int]') || t.includes('int[]')) aot += `${ind}int[] ${p.name} = new int[]{${val.replace(/\[|\]/g, '')}};\n`;
            else if (t.includes('float') || t.includes('double')) aot += `${ind}double ${p.name} = ${val};\n`;
            else aot += `${ind}int ${p.name} = ${val};\n`;
        }
    }
    return aot;
}

const metadata = {
    function_name: 'findMedianSortedArrays',
    parameters: [
        { name: 'nums1', type: 'int[]' },
        { name: 'nums2', type: 'int[]' }
    ],
    return_type: 'double'
};

const input = 'nums1 = [1,3], nums2 = [2]';

const rawArgs = parseUniversalInput(input, metadata.parameters);
console.log('rawArgs:', rawArgs);

const generatedVariables = generateAOTVariables(metadata.parameters, rawArgs, 'java');
console.log('generatedVariables:');
console.log(generatedVariables);
console.log('repr:', JSON.stringify(generatedVariables));
