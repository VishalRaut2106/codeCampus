import { wrapCodeForExecution } from './src/lib/code-templates';
import * as fs from 'fs';

const code = `
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

const javaWrapped = wrapCodeForExecution(code, 'java', input, metadata);
fs.writeFileSync('verify_fix.java', javaWrapped);
console.log('Generated verify_fix.java');

const cppWrapped = wrapCodeForExecution(code, 'cpp', input, metadata);
fs.writeFileSync('verify_fix.cpp', cppWrapped);
console.log('Generated verify_fix.cpp');
