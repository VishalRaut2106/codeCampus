import { wrapCodeForExecution } from './src/lib/code-templates';

const javaCode = `
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        return 2.0;
    }
}
`;

const metadata = {
    function_name: 'findMedianSortedArrays',
    parameters: [
        { name: 'nums1', type: 'int[]' },
        { name: 'nums2', type: 'int[]' }
    ],
    return_type: 'double'
};

const input = 'nums1 = [1,3], nums2 = [2]';

const javaWrapped = wrapCodeForExecution(javaCode, 'java', input, metadata);
const cppCode = `
class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        return 2.0;
    }
};
`;
const cppWrapped = wrapCodeForExecution(cppCode, 'cpp', input, metadata);

console.log("=== JAVA AOT (vars + output) ===");
// Extract just the main function
const javaMain = javaWrapped.substring(javaWrapped.indexOf('public static void main'));
// Show just the variable decl part
const javaVarSection = javaMain.substring(javaMain.indexOf('// Inject'), javaMain.indexOf('Object result'));
console.log(javaVarSection);

console.log("\n=== CPP AOT (main content) ===");
const cppMain = cppWrapped.substring(cppWrapped.indexOf('int main'));
const cppCore = cppMain.substring(0, 400);
console.log(cppCore);
