import { wrapCodeForExecution } from './src/lib/code-templates';

const code = `
class Solution {
    public int[] twoSum(int[] nums, int target) {
        return new int[]{0, 1};
    }
}
`;

const metadata = {
    function_name: 'twoSum',
    parameters: [
        { name: 'nums', type: 'int[]' },
        { name: 'target', type: 'int' }
    ],
    return_type: 'int[]'
};

const input = 'nums = [2,7,11,15], target = 9';

const javaWrapped = wrapCodeForExecution(code, 'java', input, metadata);
console.log("=== JAVA AOT ===");
console.log(javaWrapped.substring(javaWrapped.indexOf('public static void main'), javaWrapped.length));

const cppWrapped = wrapCodeForExecution(code, 'cpp', input, metadata);
console.log("\n=== CPP AOT ===");
console.log(cppWrapped.substring(cppWrapped.indexOf('int main'), cppWrapped.length));
