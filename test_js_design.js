class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}
class TreeNode {
    constructor(val = 0, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
class Fancy {
    constructor() {
        this.seq = [];
    }
    append(val) {
        this.seq.push(val);
    }
    addAll(inc) {
        this.seq = this.seq.map(v => v + inc);
    }
    multAll(m) {
        this.seq = this.seq.map(v => v * m);
    }
    getIndex(idx) {
        if (idx >= this.seq.length) return -1;
        return this.seq[idx] % (1000000007);
    }
}
 
// Test execution
try {
    const input = "[\"Fancy\",\"append\",\"addAll\",\"append\",\"multAll\",\"getIndex\",\"addAll\",\"append\",\"multAll\",\"getIndex\",\"getIndex\",\"getIndex\"]\n[[],[2],[3],[7],[2],[0],[3],[10],[2],[0],[1],[2]]";
    let result;
    
    // 1. Check for Design Class Pattern (Commands and Args)
    let isDesign = false;
    try {
        let parsed = null;
        if (input.startsWith('["') && (input.includes('\n[') || input.includes('] ['))) {
             const parts = input.match(/(\[".*?\])\s*(\[\[.*?\]\])/s);
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
            const matches = input.match(/(\[.*?\])/g);
            if (matches && matches.length >= 2 && !input.match(/[a-zA-Z]/)) {
                // Multiple arrays (e.g. Linked Lists [2,4,3] [5,6,4])
                try {
                    const parsedArgs = matches.map(m => {
                        const arr = JSON.parse(m.replace(/,\s*$/, '').replace(/\s+/g, ',').replace(/,+/g, ','));
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
                    result = callMethod(sol, ['addTwoNumbers', 'solve', 'solution'], parsedArgs);
                } catch(e) {}
            } else {
                // array + target
                const lastBracket = input.lastIndexOf(']');
                const arrayPart = input.slice(0, lastBracket + 1);
                const targetPart = input.slice(lastBracket + 1).trim().split(/\s+/)[0];
                
                try {
                    const nums = JSON.parse(arrayPart.replace(/,\s*$/, '').replace(/\s+/g, ',').replace(/,+/g, ','));
                    if (targetPart) {
                        const target = parseInt(targetPart);
                        if (!isNaN(target)) result = callMethod(sol, ['twoSum', 'solve', 'solution'], [nums, target]);
                    } else {
                        result = callMethod(sol, ['solve', 'solution'], [nums]);
                    }
                } catch (e) {}
            }
        }

        if (typeof listArgs !== 'undefined') {
            result = callMethod(sol, ['addTwoNumbers', 'solve', 'solution'], listArgs);
        } else if (result === undefined) {
            result = callMethod(sol, ['solve', 'solution', 'twoSum'], [input]);
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
