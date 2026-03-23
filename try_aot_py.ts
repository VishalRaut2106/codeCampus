import { wrapCodeForExecution } from './src/lib/code-templates';

const code = `
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        return []
`;

const metadata = {
    function_name: 'twoSum',
    parameters: [
        { name: 'nums', type: 'list[int]' },
        { name: 'target', type: 'int' }
    ],
    return_type: 'list[int]'
};

const input = 'nums = [2,7,11,15], target = 9';

const pyWrapped = wrapCodeForExecution(code, 'python', input, metadata);
console.log("=== PYTHON AOT ===");
console.log(pyWrapped.substring(pyWrapped.indexOf('try:'), pyWrapped.length));
