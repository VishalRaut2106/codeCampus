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
// Write full file for inspection
import { writeFileSync } from 'fs';
writeFileSync('java_wrapper_out.java', javaWrapped);
console.log("Written to java_wrapper_out.java");

const cppCode = `
class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        return 2.0;
    }
};
`;
const cppWrapped = wrapCodeForExecution(cppCode, 'cpp', input, metadata);
writeFileSync('cpp_wrapper_out.cpp', cppWrapped);
console.log("Written to cpp_wrapper_out.cpp");
