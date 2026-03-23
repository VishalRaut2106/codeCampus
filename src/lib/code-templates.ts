// Code templates/boilerplate for different languages

export interface CodeTemplate {
  language: string
  template: string
  description: string
}

export const CODE_TEMPLATES: Record<string, CodeTemplate> = {
  javascript: {
    language: 'javascript',
    description: 'JavaScript solution template',
    template: `class Solution {
    /**
     * @param {string} input
     * @return {any}
     */
    solve(input) {
        // Write your code here
        return "";
    }
}
`
  },
  
  python: {
    language: 'python',
    description: 'Python solution template',
    template: `class Solution:
    def solve(self, input_data: str) -> str:
        # Write your code here
        return ""
`
  },
  
  java: {
    language: 'java',
    description: 'Java solution template',
    template: `class Solution {
    public String solve(String input) {
        // Write your code here
        return "";
    }
}
`
  },
  
  cpp: {
    language: 'cpp',
    description: 'C++ solution template',
    template: `class Solution {
public:
    string solve(string input) {
        // Write your code here
        return "";
    }
};
`
  },
  
  c: {
    language: 'c',
    description: 'C solution template',
    template: `/**
 * Note: The solve function should return a string.
 */
char* solve(char* input) {
    // Write your code here
    return "";
}
`
  }
}

/**
 * Get code template for a specific language and problem
 */
export function getCodeTemplate(language: string, problemId?: string): string {
  const template = CODE_TEMPLATES[language.toLowerCase()]
  return template ? template.template : CODE_TEMPLATES.javascript.template
}

/**
 * Get all available templates
 */
export function getAllTemplates(): CodeTemplate[] {
  return Object.values(CODE_TEMPLATES)
}

function parseUniversalInput(input: string, parameters: any[]): string[] {
    let clean = input.replace(/[a-zA-Z_0-9]+\s*=/g, '').trim();
    if (clean.includes('\n')) {
        const parts = clean.split('\n').map(s => s.trim()).filter(Boolean);
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
        
        if (lang === 'cpp') {
            if (t.includes('list[list[int]]') || t.includes('int[][]')) aot += `    vector<vector<int>> ${p.name} = ${val.replace(/\[/g, '{').replace(/\]/g, '}')};\n`;
            else if (t.includes('list[int]') || t.includes('int[]')) aot += `    vector<int> ${p.name} = ${val.replace(/\[/g, '{').replace(/\]/g, '}')};\n`;
            else if (t.includes('string') || t.includes('str')) aot += `    string ${p.name} = ${val.startsWith('"') ? val : `"${val}"`};\n`;
            else if (t.includes('listnode')) aot += `    ListNode* ${p.name} = createList({${val.replace(/\[|\]/g, '')}});\n`;
            else if (t.includes('float') || t.includes('double')) aot += `    double ${p.name} = ${val};\n`;
            else aot += `    int ${p.name} = ${val};\n`; // fallback int
        } else if (lang === 'java') {
            const ind = '            ';
            if (t.includes('list[list[int]]') || t.includes('int[][]')) aot += `${ind}int[][] ${p.name} = new int[][]{${val.replace(/\[/g, '{').replace(/\]/g, '}')}};\n`;
            else if (t.includes('list[int]') || t.includes('int[]')) aot += `${ind}int[] ${p.name} = new int[]{${val.replace(/\[|\]/g, '')}};\n`;
            else if (t.includes('string') || t.includes('str')) aot += `${ind}String ${p.name} = ${val.startsWith('"') ? val : `"${val}"`};\n`;
            else if (t.includes('listnode')) aot += `${ind}ListNode ${p.name} = createList.apply(new int[]{${val.replace(/\[|\]/g, '')}});\n`;
            else if (t.includes('float') || t.includes('double')) aot += `${ind}double ${p.name} = ${val};\n`;
            else aot += `${ind}int ${p.name} = ${val};\n`;
        } else if (lang === 'python') {
            aot += `                    ${p.name} = ${val}\n`;
            if (t.includes('listnode')) aot += `                    ${p.name} = create_list(${p.name})\n`;
        } else if (lang === 'javascript') {
            aot += `    const ${p.name} = ${val};\n`;
            if (t.includes('listnode')) aot += `    const ${p.name}_node = createList(${p.name});\n`;
        }
    }
    return aot;
}

/**
 * Wrap user code with necessary boilerplate for execution
 */
export function wrapCodeForExecution(
  code: string, 
  language: string, 
  input: string, 
  metadata: { function_name?: string; parameters?: any; return_type?: string } = {}
): string {
  const lang = language.toLowerCase()
  
  // ============================================================
  // FULL PROGRAM DETECTION
  // If user wrote a complete program with main(), return as-is
  // ============================================================
  const isFullProgram = (() => {
    switch (lang) {
      case 'c':
      case 'cpp':
        // Has int main() or void main() — it's a complete program
        return /\b(int|void)\s+main\s*\(/.test(code)
      case 'java':
        // Has public static void main — it's a complete program
        return /public\s+static\s+void\s+main\s*\(/.test(code)
      case 'python':
        // Has if __name__ == "__main__" or uses input()/stdin directly
        return code.includes('__main__') || code.includes('sys.stdin') || code.includes('input()')
      case 'javascript':
        // Has console.log or process.stdin — it's a standalone script
        return (code.includes('console.log') || code.includes('process.')) && !code.includes('class Solution')
      default:
        return false
    }
  })()

  if (isFullProgram) {
    // User wrote a complete program — send directly to Judge0, no wrapping needed
    return code
  }

  // ============================================================
  // SOLUTION CLASS WRAPPING (LeetCode-style)
  // Only reached if user wrote a Solution class without main()
  // ============================================================
  
  // Prioritize "Solution" class if it exists, otherwise take the first class
  const solClassMatch = code.match(/class\s+(Solution|solution)/i);
  const anyClassMatch = code.match(/class\s+([a-zA-Z_]\w*)/);
  const className = solClassMatch ? solClassMatch[1] : (anyClassMatch ? anyClassMatch[1] : 'Solution');
  
  // Enhanced problem type detection system
  interface ProblemPattern {
    name: string
    detect: (code: string, input: string) => boolean
    parse: (input: string, language: string) => string
    variables: string[]
  }

  const PROBLEM_PATTERNS: ProblemPattern[] = [
    // 1. Single Array + Target (Binary Search, Two Sum, etc.)
    {
      name: 'array_target',
      detect: (code, input) => {
        const hasArrayCode = code.includes('nums') || code.includes('target') || code.includes('twoSum') || code.includes('two_sum')
        const trimmedInput = input.trim()
        // Support: [1,2,3] 9  OR  nums = [1,2,3], target = 9
        return hasArrayCode && (
          (trimmedInput.startsWith('[') && trimmedInput.lastIndexOf(']') > 0) ||
          (trimmedInput.includes('nums') && trimmedInput.includes('target'))
        );
      },
      parse: (input, lang) => {
        try {
          const trimmedInput = input.trim()
          let nums: string[] = []
          let targetPart = ''

          if (trimmedInput.startsWith('[') && trimmedInput.lastIndexOf(']') > 0) {
            const lastBracketIndex = trimmedInput.lastIndexOf(']')
            const arrayPart = trimmedInput.slice(0, lastBracketIndex + 1)
            targetPart = trimmedInput.slice(lastBracketIndex + 1).trim().split(/\s+/)[0]
            const arrayStr = arrayPart.slice(1, -1).replace(/,/g, ' ')
            nums = arrayStr.split(/\s+/).map((n: string) => n.trim()).filter(n => n)
          } else if (trimmedInput.includes('nums') && trimmedInput.includes('target')) {
            // Parse formats like: nums = [1,2,3], target = 9
            const numsMatch = trimmedInput.match(/nums\s*=\s*\[(.*?)\]/)
            const targetMatch = trimmedInput.match(/target\s*=\s*(\d+)/)
            if (numsMatch) nums = numsMatch[1].split(',').map(n => n.trim()).filter(n => n)
            if (targetMatch) targetPart = targetMatch[1]
          }
          
          if (!nums.length || !targetPart) return ''

          if (lang === 'cpp') {
            return `vector<int> nums = {${nums.join(', ')}};\n        int target = ${targetPart};`
          } else if (lang === 'java') {
            return `int[] nums = {${nums.join(', ')}};\n            int target = ${targetPart};`
          } else if (lang === 'python') {
            return `nums = [${nums.join(', ')}]\n        target = ${targetPart}`
          } else if (lang === 'javascript') {
            return `const nums = [${nums.join(', ')}];\n        const target = ${targetPart};`
          }
        } catch (e) { return '' }
        return ''
      },
      variables: ['nums', 'target']
    },

    // 2. Matrix/2D Array Problems
    {
      name: 'matrix',
      detect: (code, input) => 
        (code.includes('matrix[') || code.includes('grid[')) && 
        !!input.match(/^\[\[.*\]\]$/),
      parse: (input, lang) => {
        try {
          if (!input.startsWith('[[') || !input.endsWith(']]')) return ''
          
          const matrixStr = input.slice(2, -2) // Remove outer [[ ]]
          const rows = matrixStr.split('],[').map(row => {
            const nums = row.replace(/[\[\]]/g, '').split(',').map((n: string) => n.trim()).filter(n => n)
            return `{${nums.join(', ')}}`
          })
          
          if (lang === 'cpp') {
            return `vector<vector<int>> matrix = {${rows.join(', ')}};`
          }
        } catch (e) {
          return ''
        }
        return ''
      },
      variables: ['matrix', 'grid']
    },
    // 3. Linked List Problems
    {
      name: 'linked_list',
      detect: (code, input) => {
        return (code.includes('ListNode') || code.includes('addTwoNumbers')) && 
               input.includes('[');
      },
      parse: (input, lang) => {
        try {
          const matches = input.match(/\\[(.*?)\\]/g)
          if (!matches || matches.length === 0) return ''
          
          const arrays = matches.map(m => m.replace(/[\\[\\]]/g, '').split(',').map(n => n.trim()).filter(n => n))
          
          if (lang === 'javascript') {
            return `
    function createList(arr) {
        if (!arr || !arr.length) return null;
        const head = new ListNode(parseInt(arr[0]));
        let curr = head;
        for (let i = 1; i < arr.length; i++) {
            curr.next = new ListNode(parseInt(arr[i]));
            curr = curr.next;
        }
        return head;
    }
    \${arrays.map((arr, i) => \`const l\${i+1} = createList([\${arr.join(',')}]);\`).join('\\n    ')}
    const listArgs = [\${arrays.map((_, i) => \`l\${i+1}\`).join(', ')}];
            `
          } else if (lang === 'python') {
            return `
        def create_list(arr):
            if not arr: return None
            head = ListNode(int(arr[0]))
            curr = head
            for i in range(1, len(arr)):
                curr.next = ListNode(int(arr[i]))
                curr = curr.next
            return head
        \${arrays.map((arr, i) => \`l\${i+1} = create_list([\${arr.join(',')}])\`).join('\\n        ')}
        list_args = [\${arrays.map((_, i) => \`l\${i+1}\`).join(', ')}]
            `
          } else if (lang === 'java') {
            return `
            java.util.function.Function<int[], ListNode> createList = (arr) -> {
                if (arr == null || arr.length == 0) return null;
                ListNode head = new ListNode(arr[0]);
                ListNode curr = head;
                for (int i = 1; i < arr.length; i++) {
                    curr.next = new ListNode(arr[i]);
                    curr = curr.next;
                }
                return head;
            };
            \${arrays.map((arr, i) => \`ListNode l\${i+1} = createList.apply(new int[]{\${arr.join(',')}});\`).join('\\n            ')}
            Object[] listArgs = new Object[]{\${arrays.map((_, i) => \`l\${i+1}\`).join(', ')}};
            `
          } else if (lang === 'cpp') {
            return `
        auto createList = [](const vector<int>& arr) -> ListNode* {
            if (arr.empty()) return nullptr;
            ListNode* head = new ListNode(arr[0]);
            ListNode* curr = head;
            for (size_t i = 1; i < arr.size(); i++) {
                curr->next = new ListNode(arr[i]);
                curr = curr->next;
            }
            return head;
        };
        \${arrays.map((arr, i) => \`ListNode* l\${i+1} = createList({\${arr.join(',')}});\`).join('\\n        ')}
            `
          }
        } catch (e) { return '' }
        return ''
      },
      variables: ['listArgs', 'list_args', 'l1', 'l2']
    },
    // 4. Design Class Problems (e.g. Fancy Sequence)
    {
      name: 'design_class',
      detect: (code, input) => {
        try {
          const trimmed = input.trim();
          if (trimmed.startsWith('["') && (trimmed.includes('\\n[') || trimmed.includes('] ['))) return true;
          if (trimmed.startsWith('[[')) {
             const parsed = JSON.parse(trimmed);
             if (Array.isArray(parsed) && parsed.length === 2 && Array.isArray(parsed[0]) && Array.isArray(parsed[1])) return true;
          }
          return false;
        } catch(e) { return false; }
      },
      parse: (input, lang) => {
        if (lang !== 'cpp') return ''; // Python/JS/Java handle Design generically at runtime
        try {
          let parsed: any = null;
          const trimmed = input.trim();
          if (trimmed.startsWith('["') && (trimmed.includes('\\n[') || trimmed.includes('] ['))) {
             const parts = trimmed.match(/(\\[".*?\\])\\s*(\\[\\[.*?\\]\\])/s);
             if (parts) parsed = [JSON.parse(parts[1]), JSON.parse(parts[2])];
          } else if (trimmed.startsWith('[[')) {
             parsed = JSON.parse(trimmed);
          }
          if (!parsed) return '';

          const commands = parsed[0];
          const args = parsed[1];
          const className = commands[0];
          
          let res = `    ${className}* obj = new ${className}(${(args[0]||[]).join(', ')});\n    cout << "[null";\n`;
          for (let i = 1; i < commands.length; i++) {
              const cmd = commands[i];
              if (!cmd) continue;
              const argList = (args[i]||[]).map((a:any) => typeof a === 'string' ? `"${a}"` : a);
              const argStr = argList.join(', ');
              
              // Use regex to locate the method signature in the user's code to determine return type
              const sigMatch = code.match(new RegExp(`([\\w\\<\\>\\:]+)\\s+${cmd}\\s*\\(`));
              const returnType = sigMatch ? sigMatch[1].trim() : 'void';
              
              if (returnType === 'void') {
                  res += `    obj->${cmd}(${argStr});\n    cout << ",null";\n`;
              } else {
                  res += `    cout << "," << obj->${cmd}(${argStr});\n`;
              }
          }
          res += `    cout << "]" << endl;\n    return 0;`;
          return res;
        } catch(e) {}
        return '';
      },
      variables: []
    }
  ]

  // Try to match against known problem patterns
  let matchedPattern: ProblemPattern | null = null
  let generatedVariables = ''
  
  if (metadata.parameters && metadata.parameters.length > 0 && metadata.function_name) {
      const rawArgs = parseUniversalInput(input, metadata.parameters);
      generatedVariables = generateAOTVariables(metadata.parameters, rawArgs, lang);
      matchedPattern = { name: 'aot_metadata', detect: () => true, parse: () => '', variables: metadata.parameters.map((p: any) => p.name) };
  } else {
      for (const pattern of PROBLEM_PATTERNS) {
        if (pattern.detect(code, input)) {
          matchedPattern = pattern
          generatedVariables = pattern.parse(input, lang)
          break
        }
      }
  } // end else (no metadata)
  
  // Fallback detection for legacy support
  const isArrayProblem = matchedPattern !== null
  
  // Emergency fallback for binary search pattern - only if no pattern matched yet
  if (!isArrayProblem && (code.includes('nums[') || code.includes('target')) && input.includes('[')) {
    try {
      const trimmedInput = input.trim()
      const lastBracketIndex = trimmedInput.lastIndexOf(']')
      if (lastBracketIndex > 0 && lastBracketIndex < trimmedInput.length - 1) {
        const arrayPart = trimmedInput.slice(0, lastBracketIndex + 1)
        const targetPart = trimmedInput.slice(lastBracketIndex + 1).trim().split(/\s+/)[0]
        const arrayStr = arrayPart.slice(1, -1).replace(/,/g, ' ')
        const numbers = arrayStr.split(/\s+/).map((n: string) => n.trim()).filter(n => n)
        
        if (lang === 'cpp') {
            generatedVariables = `vector<int> nums = {${numbers.join(', ')}};\n        int target = ${targetPart};`
        } else if (lang === 'java') {
            generatedVariables = `int[] nums = {${numbers.join(', ')}};\n            int target = ${targetPart};`
        } else if (lang === 'python') {
            generatedVariables = `nums = [${numbers.join(', ')}]\n        target = ${targetPart}`
        } else if (lang === 'javascript') {
            generatedVariables = `const nums = [${numbers.join(', ')}];\n        const target = ${targetPart};`
        }
        matchedPattern = { name: 'emergency_fallback', detect: () => true, parse: () => '', variables: ['nums', 'target'] }
      }
    } catch (e) {
      // Silent fallback failure
    }
  }

  
  switch (lang) {
    case 'javascript':
      return `${code.includes('class ListNode') ? '' : `class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}`}
${code.includes('class TreeNode') ? '' : `class TreeNode {
    constructor(val = 0, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}`}
${code}
 
// Test execution
try {
    const input = ${JSON.stringify(input.trim())};
    let result;
    
    // 1. Check for Design Class Pattern (Commands and Args)
    let isDesign = false;
    try {
        let parsed = null;
        if (input.startsWith('["') && (input.includes('\\n[') || input.includes('] ['))) {
             const parts = input.match(/(\\[".*?\\])\\s*(\\[\\[.*?\\]\\])/s);
             if (parts) parsed = [JSON.parse(parts[1]), JSON.parse(parts[2])];
        } else if (input.startsWith('[[')) {
             parsed = JSON.parse(input);
        }
        
        if (parsed && Array.isArray(parsed) && parsed.length === 2 && Array.isArray(parsed[0]) && Array.isArray(parsed[1])) {
             isDesign = true;
             const commands = parsed[0];
             const args = parsed[1];
             const className = commands[0];
             
             let obj = null;
             if (typeof global[className] === 'function') {
                 obj = new global[className](...args[0]);
             } else if (typeof eval(className) === 'function') {
                 const Cls = eval(className);
                 obj = new Cls(...args[0]);
             }
             
             const outputs = [null];
             for (let i = 1; i < commands.length; i++) {
                 const cmd = commands[i];
                 const arg = args[i] || [];
                 if (obj && typeof obj[cmd] === 'function') {
                     const res = obj[cmd](...arg);
                     outputs.push(res === undefined ? null : res);
                 } else {
                     outputs.push(null);
                 }
             }
             result = outputs;
        }
    } catch(e) {}

    // 2. Standard Function Invocation (e.g. solve, twoSum, addTwoNumbers)
    if (!isDesign) {
        // Instantiate Solution if it exists
        let sol = null;
        try {
            if (typeof Solution === 'function') {
                sol = new Solution();
            }
        } catch (e) {}

        const callMethod = (obj, names, args) => {
            for (const name of names) {
                if (obj && typeof obj[name] === 'function') return obj[name](...args);
                if (typeof global[name] === 'function') return global[name](...args);
            }
            return undefined;
        };

        if (input.startsWith('[') && input.includes(']')) {
            const matches = input.match(/(\\[.*?\\])/g);
            if (matches && matches.length >= 2 && !input.match(/[a-zA-Z]/)) {
                // Multiple arrays (e.g. Linked Lists [2,4,3] [5,6,4])
                try {
                    const parsedArgs = matches.map(m => {
                        const arr = JSON.parse(m.replace(/,\\s*$/, '').replace(/\\s+/g, ',').replace(/,+/g, ','));
                        if (code.includes('ListNode') || code.includes('addTwoNumbers')) {
                            if (!arr.length) return null;
                            let head = new ListNode(arr[0]);
                            let curr = head;
                            for (let i = 1; i < arr.length; i++) {
                                curr.next = new ListNode(arr[i]);
                                curr = curr.next;
                            }
                            return head;
                        }
                        return arr;
                    });
                    result = callMethod(sol, [${metadata.function_name ? `'${metadata.function_name}', ` : ''}'addTwoNumbers', 'solve', 'solution'], parsedArgs);
                } catch(e) {}
            } else {
                // array + target
                const lastBracket = input.lastIndexOf(']');
                const arrayPart = input.slice(0, lastBracket + 1);
                const targetPart = input.slice(lastBracket + 1).trim().split(/\\s+/)[0];
                
                try {
                    const nums = JSON.parse(arrayPart.replace(/,\\s*$/, '').replace(/\\s+/g, ',').replace(/,+/g, ','));
                    if (targetPart) {
                        const target = parseInt(targetPart);
                        if (!isNaN(target)) result = callMethod(sol, ['twoSum', 'solve', 'solution'], [nums, target]);
                    } else {
                        result = callMethod(sol, ['solve', 'solution'], [nums]);
                    }
                } catch (e) {}
            }
        }

        if (typeof generatedVariables !== 'undefined' && generatedVariables) {
${generatedVariables}        }

        if (result === undefined && typeof listArgs !== 'undefined') {
            result = callMethod(sol, [${metadata.function_name ? `'${metadata.function_name}', ` : ''}'addTwoNumbers', 'solve', 'solution'], listArgs);
        } else if (result === undefined) {
             ${matchedPattern?.name === 'aot_metadata' ? 
                 `result = callMethod(sol, ['${metadata.function_name}'], [${metadata.parameters?.map((p: any) => p.type.toLowerCase().includes('listnode') ? `${p.name}_node` : p.name).join(', ')}]);` 
             : `result = callMethod(sol, [${metadata.function_name ? `'${metadata.function_name}', ` : ''}'solve', 'solution', 'twoSum'], [input]);`
             }
        }
    }
    
    // 3. Serialize Output
    if (result !== undefined) {
        if (result && typeof result === 'object' && 'val' in result && 'next' in result !== undefined) {
            const arr = [];
            let curr = result;
            while (curr && arr.length < 1000) { // Safety bound
                arr.push(curr.val);
                curr = curr.next;
            }
            console.log(JSON.stringify(arr));
        } else {
            console.log(typeof result === 'object' ? JSON.stringify(result) : result);
        }
    } else {
        console.error('Error: No solution function found');
    }
} catch (error) {
    console.error('Runtime Error:', error.message);
}
\`);
}
`
    
    case 'python':
      return `from __future__ import annotations
import collections
import heapq
import math
import sys
import json
from typing import *

# Supporting classes
${code.includes('class ListNode') ? '' : `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next`}

${code.includes('class TreeNode') ? '' : `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right`}

${code}

if __name__ == "__main__":
    try:
        input_data = sys.stdin.read().strip()
        
        # 1. Check for Design Class Pattern
        is_design = False
        try:
            parsed = None
            if input_data.startswith('["') and ('\\n[' in input_data or '] [' in input_data):
                parts = input_data.split('\\n', 1) if '\\n' in input_data else []
                if len(parts) == 2:
                    parsed = [json.loads(parts[0]), json.loads(parts[1])]
            elif input_data.startswith('[['):
                parsed = json.loads(input_data)
                
            if parsed and isinstance(parsed, list) and len(parsed) == 2 and isinstance(parsed[0], list) and isinstance(parsed[1], list):
                is_design = True
                commands = parsed[0]
                args = parsed[1]
                class_name = commands[0]
                
                cls = globals().get(class_name)
                obj = cls(*args[0]) if cls else None
                
                outputs = [None]
                for i in range(1, len(commands)):
                    cmd = commands[i]
                    arg = args[i] if i < len(args) else []
                    
                    if obj and hasattr(obj, cmd):
                        func = getattr(obj, cmd)
                        res = func(*arg)
                        outputs.append(res)
                    else:
                        outputs.append(None)
                        
                print(json.dumps(outputs))
        except:
            pass

        # 2. Standard Function Invocation
        if not is_design:
            sol = Solution() if 'Solution' in globals() else None
            
            def call_method(obj, names, *args):
                for name in names:
                    func = getattr(obj, name, None) or globals().get(name)
                    if func and callable(func): return func(*args)
                
                target_params = len(args)
                import inspect
                if obj:
                    for m_name in dir(obj):
                        if m_name.startswith('__'): continue
                        method = getattr(obj, m_name)
                        if not callable(method): continue
                        try:
                            sig = inspect.signature(method)
                            if len(sig.parameters) == target_params: return method(*args)
                        except: continue
                return None

            result = None
            
            # Check for Multiple Arrays (Linked Lists)
            if input_data.startswith('[') and ']' in input_data:
                try:
                    import re
                    matches = re.findall(r'\\[.*?\\]', input_data)
                    if len(matches) >= 2 and not any(c.isalpha() for c in input_data if c not in ['t','r','u','e','f','a','l','s','n']):
                        parsed_args = [json.loads(m.replace('\\n', ' ')) for m in matches]
                        
                        if 'ListNode' in """${code}""" or 'addTwoNumbers' in """${code}""":
                            def create_list(arr):
                                if not arr: return None
                                head = ListNode(arr[0])
                                curr = head
                                for i in range(1, len(arr)):
                                    curr.next = ListNode(arr[i])
                                    curr = curr.next
                                return head
                            list_args = [create_list(arr) for arr in parsed_args]
                            result = call_method(sol, [${metadata.function_name ? `'${metadata.function_name}', ` : ''}'addTwoNumbers', 'solve', 'solution'], *list_args)
                except: pass

            if result is None:
                try:
${generatedVariables}                    if "${matchedPattern?.name}" == "aot_metadata":
                        result = call_method(sol, ['${metadata.function_name}'], ${metadata.parameters?.map((p: any) => p.name).join(', ')})
                    elif 'nums' in locals() and 'target' in locals():
                        result = call_method(sol, ['twoSum', 'two_sum', 'solve'], nums, target)
                except: pass

            if result is None:
                if input_data.startswith('[') and ']' in input_data:
                    try:
                        last_bracket = input_data.rfind(']')
                        array_part = input_data[:last_bracket+1]
                        
                        # Fix slice error for single array inputs
                        target_part = input_data[last_bracket+1:].strip().split()[0] if len(input_data) > last_bracket+1 and input_data[last_bracket+1:].strip() else None
                        
                        nums = json.loads(array_part.replace('\\n', ' '))
                        if target_part:
                            target = int(target_part)
                            result = call_method(sol, ['twoSum', 'two_sum', 'solve'], nums, target)
                        else:
                            result = call_method(sol, ['solve', 'solution'], nums)
                    except: pass
                else:
                    result = call_method(sol, [${metadata.function_name ? `'${metadata.function_name}', ` : ''}'solve', 'solution'], input_data)

            if result is not None:
                if hasattr(result, 'val') and hasattr(result, 'next'):
                    arr = []
                    curr = result
                    while curr and len(arr) < 1000:
                        arr.append(curr.val)
                        curr = curr.next
                    print(json.dumps(arr))
                elif isinstance(result, float):
                    print(f"{result:.5f}")
                elif isinstance(result, (list, dict)):
                    print(json.dumps(result))
                else:
                    print(result)
            else:
                print(f"Error: No results from compatible method")
    except Exception as e:
        print(f"Runtime Error: {e}")
`
    
    case 'java':
      const javaImports = `import java.util.*;
import java.util.stream.*;
import java.util.Locale;
import java.lang.reflect.Method;
`
      const dataStructures = `
// Supporting classes
${code.includes('class ListNode') ? '' : `class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`}

${code.includes('class TreeNode') ? '' : `class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}`}
`
      return `${javaImports}
${code}
${dataStructures}

class Main {
    public static void main(String[] args) {
        try {
            Scanner sc = new Scanner(System.in);
            StringBuilder sb = new StringBuilder();
            while(sc.hasNextLine()) {
                sb.append(sc.nextLine()).append("\\n");
            }
            String input = sb.toString().trim();
            
            // 1. Check for Design Class Pattern
            if (input.startsWith("[\\"") && (input.contains("\\n[") || input.contains("] ["))) {
                String[] sections = input.split("\\\\n|\\\\] \\\\[");
                String cmdPart = sections[0];
                String argPart = sections[1];
                if (sections.length > 2) argPart = input.substring(input.indexOf("\\n") + 1); // fallback
                
                String cleanCmd = cmdPart.replace("[", "").replace("]", "").replace("\\"", "");
                String[] commands = cleanCmd.split(",");
                for (int i=0; i<commands.length; i++) commands[i] = commands[i].trim();
                
                String cleanArgsOuter = argPart.trim();
                if (cleanArgsOuter.startsWith("[")) cleanArgsOuter = cleanArgsOuter.substring(1);
                if (cleanArgsOuter.endsWith("]")) cleanArgsOuter = cleanArgsOuter.substring(0, cleanArgsOuter.length() - 1);
                
                String[] argsStr = cleanArgsOuter.split("\\\\],\\\\s*\\\\[");
                for (int i=0; i<argsStr.length; i++) {
                    argsStr[i] = argsStr[i].replace("[", "").replace("]", "").trim();
                }
                
                String className = commands[0];
                Class<?> clazz = null;
                Object obj = null;
                
                try {
                    clazz = Class.forName(className);
                } catch (Exception e) {
                    // Try to find it in the current package / default context
                    for (Class<?> c : Main.class.getDeclaredClasses()) {
                        if (c.getSimpleName().equals(className)) {
                            clazz = c;
                            break;
                        }
                    }
                }
                
                if (clazz == null) {
                    // It must be a top level class in the same file
                    try {
                        // Fallback: search for top-level classes manually or instantiate
                        obj = new ${className}();
                        clazz = obj.getClass();
                    } catch (Exception e) {}
                } else {
                    try {
                        obj = clazz.getDeclaredConstructor().newInstance();
                    } catch (Exception e) {}
                }
                
                if (obj == null) {
                     // Last resort: if we couldn't instantiate dynamically, check if user has a class that matches
                     obj = new ${className}();
                     clazz = obj.getClass();
                }
                
                List<Object> outputs = new ArrayList<>();
                outputs.add("null");
                
                for (int i = 1; i < commands.length; i++) {
                    String cmd = commands[i];
                    String argS = i < argsStr.length ? argsStr[i] : "";
                    
                    Method target = null;
                    for (Method m : clazz.getDeclaredMethods()) {
                        if (m.getName().equals(cmd)) {
                            target = m;
                            break;
                        }
                    }
                    if (target != null) {
                        target.setAccessible(true);
                        if (argS.isEmpty()) {
                            Object res = target.invoke(obj);
                            outputs.add(res == null ? "null" : res);
                        } else {
                            String[] argPartsOuter = argS.split(",");
                            List<String> argParts = new ArrayList<>();
                            for (String part : argPartsOuter) {
                                if (!part.trim().isEmpty()) argParts.add(part.trim());
                            }
                            
                            Object[] invokeArgs = new Object[argParts.size()];
                            Class<?>[] pTypes = target.getParameterTypes();
                            for (int j=0; j<Math.min(argParts.size(), pTypes.length); j++) {
                                String val = argParts.get(j);
                                if (pTypes[j] == int.class || pTypes[j] == Integer.class) {
                                    invokeArgs[j] = Integer.parseInt(val);
                                } else if (pTypes[j] == String.class) {
                                    invokeArgs[j] = val.replace("\\"", "");
                                } else {
                                    invokeArgs[j] = val;
                                }
                            }
                            Object res = target.invoke(obj, invokeArgs);
                            outputs.add(res == null ? "null" : res);
                        }
                    } else {
                        outputs.add("null");
                    }
                }
                
                System.out.print("[");
                for (int i=0; i<outputs.size(); i++) {
                    System.out.print(outputs.get(i));
                    if (i < outputs.size() - 1) System.out.print(",");
                }
                System.out.println("]");
                return;
            }

            // 2. Standard Function Invocation
            ${className} sol = new ${className}();
            
            // Inject pre-parsed variables from patterns
${matchedPattern ? generatedVariables : '            // no AOT vars'}

            Object result = null;
            boolean found = false;
            
            ${matchedPattern?.name === 'aot_metadata' ? `
            try {
                for (Method m : sol.getClass().getDeclaredMethods()) {
                    if (m.getName().equals("${metadata.function_name}")) {
                         result = m.invoke(sol, ${metadata.parameters?.map((p: any)=>p.name).join(', ')});
                         found = true;
                         break;
                    }
                }
            } catch (Exception e) {}` : ''}
            ${matchedPattern?.name === 'array_target' ? `
            try {
                for (Method m : sol.getClass().getDeclaredMethods()) {
                    if (m.getParameterCount() == 2 && m.getParameterTypes()[0] == int[].class && (m.getParameterTypes()[1] == int.class || m.getParameterTypes()[1] == Integer.class)) {
                         result = m.invoke(sol, nums, target);
                         found = true;
                         break;
                    }
                }
            } catch (Exception e) {}` : ''}
            
            Method targetMethod = null;
            Method[] methods = sol.getClass().getDeclaredMethods();
            
            for (String name : new String[]{${metadata.function_name ? `"${metadata.function_name}", ` : ''}"solve", "twoSum", "solution", "addTwoNumbers"}) {
                for (Method m : methods) {
                    if (m.getName().equalsIgnoreCase(name)) {
                        targetMethod = m;
                        break;
                    }
                }
                if (targetMethod != null) break;
            }
            
            if (targetMethod != null) {
                targetMethod.setAccessible(true);
                int pc = targetMethod.getParameterCount();
                
                // Linked List multi-array check
                if (input.startsWith("[") && input.contains("]")) {
                    List<int[]> parsedArrays = new ArrayList<>();
                    String[] bracketSplits = input.split("\\\\]");
                    for (String s : bracketSplits) {
                        if (!s.contains("[")) continue;
                        String clean = s.substring(s.indexOf("[") + 1).replace(",", " ").trim();
                        if (clean.isEmpty()) {
                            parsedArrays.add(new int[0]);
                        } else {
                            parsedArrays.add(Arrays.stream(clean.split("\\\\s+")).filter(str -> !str.isEmpty()).mapToInt(Integer::parseInt).toArray());
                        }
                    }
                    
                    if (parsedArrays.size() >= 2 && pc >= 2) {
                        Class<?>[] pTypes = targetMethod.getParameterTypes();
                        if (pTypes[0].getName().contains("ListNode")) {
                            Object[] listArgs = new Object[Math.min(parsedArrays.size(), pc)];
                            for (int i=0; i<listArgs.length; i++) {
                                int[] arr = parsedArrays.get(i);
                                if (arr.length == 0) {
                                    listArgs[i] = null;
                                    continue;
                                }
                                ListNode head = new ListNode(arr[0]);
                                ListNode curr = head;
                                for (int j=1; j<arr.length; j++) {
                                    curr.next = new ListNode(arr[j]);
                                    curr = curr.next;
                                }
                                listArgs[i] = head;
                            }
                            result = targetMethod.invoke(sol, listArgs);
                            found = true;
                        }
                    } else if (parsedArrays.size() >= 1) {
                         // Fallback arrays
                         String clean = input.replace("[", "").replace("]", "").replace("\\n", " ").replace("\\r", " ").replace(",", " ").replaceAll("\\\\s+", " ").trim();
                         if (pc == 2 && clean.contains(" ")) {
                             String[] parts = clean.split("\\\\s+");
                             int[] nums = Arrays.stream(parts).limit(parts.length - 1).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();
                             int targetVal = Integer.parseInt(parts[parts.length - 1]);
                             result = targetMethod.invoke(sol, nums, targetVal);
                             found = true;
                         } else if (pc == 1 && targetMethod.getParameterTypes()[0] == int[].class) {
                             int[] nums = Arrays.stream(clean.split("\\\\s+")).filter(s -> !s.isEmpty()).mapToInt(Integer::parseInt).toArray();
                             result = targetMethod.invoke(sol, nums);
                             found = true;
                         }
                    }
                }
                
                if (!found && pc == 1) {
                    Class<?> pt = targetMethod.getParameterTypes()[0];
                    if (pt == String.class) {
                        result = targetMethod.invoke(sol, input);
                        found = true;
                    } else if (pt == int.class || pt == Integer.class) {
                        result = targetMethod.invoke(sol, Integer.parseInt(input.replaceAll("[^0-9-]", "")));
                        found = true;
                    }
                }
            }
            
            if (!found) {
                System.out.println("Error: Could not find compatible method in " + sol.getClass().getSimpleName());
                return;
            }
            
            // 3. Serialize Output
            if (result != null && result.getClass().getName().contains("ListNode")) {
                List<Integer> list = new ArrayList<>();
                Object curr = result;
                while (curr != null && list.size() < 1000) {
                    list.add((int) curr.getClass().getField("val").get(curr));
                    curr = curr.getClass().getField("next").get(curr);
                }
                System.out.println(list.toString().replace(" ", ""));
            } else if (result instanceof int[]) {
                System.out.println(Arrays.toString((int[])result).replace(" ", ""));
            } else if (result instanceof Double || result instanceof Float) {
                System.out.printf(Locale.US, "%.5f\\n", ((Number)result).doubleValue());
            } else if (result != null) {
                System.out.println(result.toString());
            }
            sc.close();
        } catch (Exception e) {
            System.out.println("Runtime Error: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
        }
    }
}
`

    
    case 'cpp':
      if (matchedPattern && matchedPattern.name === 'design_class') {
          return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <stdexcept>
#include <algorithm>
#include <iomanip>
using namespace std;

// Supporting classes
${code.includes('struct TreeNode') || code.includes('class TreeNode') ? '' : `struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};`}

${code.includes('struct ListNode') || code.includes('class ListNode') ? '' : `struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};`}

${code}

int main() {
    try {
${generatedVariables}
    } catch (const exception& e) {
        cout << "Runtime Error: " << e.what() << endl;
        return 1;
    } catch (...) {
        cout << "Runtime Error: Unknown error occurred" << endl;
        return 1;
    }
    return 0;
}
`
      } else if (matchedPattern && generatedVariables) {
        return `#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <stdexcept>
#include <algorithm>
#include <iomanip>
using namespace std;

// Supporting classes
${code.includes('struct TreeNode') || code.includes('class TreeNode') ? '' : `struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};`}

${code.includes('struct ListNode') || code.includes('class ListNode') ? '' : `struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};`}

${code}

int main() {
    try {
        ${generatedVariables}
        ${className} sol;
        
        ${matchedPattern?.name === 'aot_metadata' ? `
        if (true) {
             ${(() => {
                 let s = `auto result = sol.${metadata.function_name}(${metadata.parameters?.map((p: any)=>p.name).join(', ')});\n`;
                 const rt = metadata.return_type?.toLowerCase() || '';
                 if (rt.includes('list[int]') || rt.includes('int[]')) {
                     s += `             cout << "[";\n             for(size_t i=0; i<result.size(); i++) { cout << result[i]; if(i < result.size()-1) cout << ","; }\n             cout << "]" << endl;`;
                 } else if (rt.includes('listnode')) {
                     s += `             ListNode* curr = result; cout << "["; while(curr) { cout << curr->val; curr = curr->next; if(curr) cout << ","; } cout << "]" << endl;`;
                 } else if (rt.includes('float') || rt.includes('double')) {
                     s += `             cout << fixed << setprecision(5) << result << endl;`;
                 } else {
                     s += `             cout << result << endl;`;
                 }
                 return s;
             })()}
        }` : ''}
        ${(matchedPattern?.name === 'array_target' || matchedPattern?.name === 'emergency_fallback') ? `
        if (true) {
            auto result = sol.twoSum(nums, target);
            cout << "[" << result[0] << "," << result[1] << "]" << endl;
        }` : ''}
    } catch (const exception& e) {
        cout << "Runtime Error: " << e.what() << endl;
        return 1;
    } catch (...) {
        cout << "Runtime Error: Unknown error occurred" << endl;
        return 1;
    }
    return 0;
}
`
      } else {
        return `#include <iostream>
#include <string>
#include <sstream>
#include <stdexcept>
#include <vector>
#include <algorithm>
using namespace std;

${code}

int main() {
    try {
        string input;
        getline(cin, input);
        ${className} sol;
        string result = sol.solve(input);
        cout << result << endl;
    } catch (const exception& e) {
        cout << "Runtime Error: " << e.what() << endl;
        return 1;
    } catch (...) {
        cout << "Runtime Error: Unknown error occurred" << endl;
        return 1;
    }
    return 0;
}
`
      }
    
    case 'c':
      return `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

${code}

int main() {
    char input[10000];
    if (fgets(input, sizeof(input), stdin) == NULL) return 0;
    size_t len = strlen(input);
    if (len > 0 && input[len-1] == '\\n') input[len-1] = '\\0';
    char* result = solve(input);
    if (result != NULL) printf("%s\\n", result);
    return 0;
}
`
    
    default:
      return code
  }
}