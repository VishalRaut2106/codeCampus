/**
 * Code Template Service
 * 
 * Manages language-specific code templates for problems.
 * Generates templates with function signatures and helpful comments.
 */

import type { ProgrammingLanguage } from '@/types'
import type { ProblemMetadata, CodeTemplate } from './types'

/**
 * Default templates for each language
 */
const DEFAULT_TEMPLATES: Record<ProgrammingLanguage, string> = {
  javascript: `/**
 * JavaScript Solution Template
 * 
 * This template provides a basic structure for JavaScript solutions.
 * Modify the function body to implement your algorithm.
 */
function solution(input) {
    // Parse input if needed
    // Example: const num = parseInt(input.trim());
    // Example: const arr = input.trim().split(' ').map(Number);
    
    // Write your algorithm here
    
    // Return the result
    return "";
}`,

  typescript: `/**
 * TypeScript Solution Template
 * 
 * This template provides a basic structure for TypeScript solutions.
 * Modify the function body to implement your algorithm.
 */
function solution(input: string): string {
    // Parse input if needed
    // Example: const num = parseInt(input.trim());
    // Example: const arr = input.trim().split(' ').map(Number);
    
    // Write your algorithm here
    
    // Return the result
    return "";
}`,

  python: `"""
Python Solution Template

This template provides a basic structure for Python solutions.
Modify the function body to implement your algorithm.
"""

def solution(input_data):
    # Parse input if needed
    # Example: num = int(input_data.strip())
    # Example: arr = list(map(int, input_data.strip().split()))
    
    # Write your algorithm here
    
    # Return the result
    pass`,

  java: `/**
 * Java Solution Template
 * 
 * This template provides a basic structure for Java solutions.
 * Modify the solve method to implement your algorithm.
 */
class Solution {
    public String solve(String input) {
        // Parse input if needed
        // Example: int num = Integer.parseInt(input.trim());
        // Example: String[] parts = input.trim().split(" ");
        
        // Write your algorithm here
        
        // Return the result
        return "";
    }
}`,

  cpp: `/**
 * C++ Solution Template
 * 
 * This template provides a basic structure for C++ solutions.
 * Modify the solve method to implement your algorithm.
 */
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    string solve(string input) {
        // Parse input if needed
        // Example: int num = stoi(input);
        // Example: istringstream iss(input); vector<int> arr;
        
        // Write your algorithm here
        
        // Return the result
        return "";
    }
};`,

  c: `/**
 * C Solution Template
 * 
 * This template provides a basic structure for C solutions.
 * Modify the solve function to implement your algorithm.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char* solve(char* input) {
    // Parse input if needed
    // Example: int num = atoi(input);
    // Example: char* token = strtok(input, " ");
    
    // Write your algorithm here
    
    // Allocate memory for result
    char* result = malloc(256);
    strcpy(result, "");
    
    // Return the result
    return result;
}`,

  csharp: `/**
 * C# Solution Template
 * 
 * This template provides a basic structure for C# solutions.
 * Modify the Solve method to implement your algorithm.
 */
using System;
using System.Linq;

public class Solution {
    public string Solve(string input) {
        // Parse input if needed
        // Example: int num = int.Parse(input.Trim());
        // Example: var arr = input.Trim().Split(' ').Select(int.Parse).ToArray();
        
        // Write your algorithm here
        
        // Return the result
        return "";
    }
}`,

  go: `/**
 * Go Solution Template
 * 
 * This template provides a basic structure for Go solutions.
 * Modify the solution function to implement your algorithm.
 */
package main

import (
    "strconv"
    "strings"
)

func solution(input string) string {
    // Parse input if needed
    // Example: num, _ := strconv.Atoi(strings.TrimSpace(input))
    // Example: parts := strings.Fields(strings.TrimSpace(input))
    
    // Write your algorithm here
    
    // Return the result
    return ""
}`,

  rust: `/**
 * Rust Solution Template
 * 
 * This template provides a basic structure for Rust solutions.
 * Modify the solution function to implement your algorithm.
 */
fn solution(input: &str) -> String {
    // Parse input if needed
    // Example: let num: i32 = input.trim().parse().unwrap();
    // Example: let arr: Vec<i32> = input.trim().split_whitespace()
    //                                   .map(|s| s.parse().unwrap()).collect();
    
    // Write your algorithm here
    
    // Return the result
    String::new()
}`,

  ruby: `# Ruby Solution Template
# 
# This template provides a basic structure for Ruby solutions.
# Modify the solution method to implement your algorithm.

def solution(input)
    # Parse input if needed
    # Example: num = input.strip.to_i
    # Example: arr = input.strip.split.map(&:to_i)
    
    # Write your algorithm here
    
    # Return the result
    ""
end`,

  php: `<?php
/**
 * PHP Solution Template
 * 
 * This template provides a basic structure for PHP solutions.
 * Modify the solution function to implement your algorithm.
 */
function solution($input) {
    // Parse input if needed
    // Example: $num = intval(trim($input));
    // Example: $arr = array_map('intval', explode(' ', trim($input)));
    
    // Write your algorithm here
    
    // Return the result
    return "";
}
?>`,

  swift: `/**
 * Swift Solution Template
 * 
 * This template provides a basic structure for Swift solutions.
 * Modify the solution function to implement your algorithm.
 */
import Foundation

func solution(_ input: String) -> String {
    // Parse input if needed
    // Example: let num = Int(input.trimmingCharacters(in: .whitespacesAndNewlines))
    // Example: let arr = input.trimmingCharacters(in: .whitespacesAndNewlines)
    //                        .components(separatedBy: " ").compactMap(Int.init)
    
    // Write your algorithm here
    
    // Return the result
    return ""
}`,

  kotlin: `/**
 * Kotlin Solution Template
 * 
 * This template provides a basic structure for Kotlin solutions.
 * Modify the solution function to implement your algorithm.
 */
fun solution(input: String): String {
    // Parse input if needed
    // Example: val num = input.trim().toInt()
    // Example: val arr = input.trim().split(" ").map { it.toInt() }
    
    // Write your algorithm here
    
    // Return the result
    return ""
}`,
}

/**
 * Get template for a language
 */
export function getTemplate(
  problemId: string,
  language: ProgrammingLanguage,
  metadata?: ProblemMetadata
): string {
  // If metadata is provided, generate custom template
  if (metadata) {
    return generateTemplate(metadata, language)
  }

  // Otherwise return default template
  return DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES.javascript
}

/**
 * Generate custom template based on problem metadata
 */
export function generateTemplate(
  problem: ProblemMetadata,
  language: ProgrammingLanguage
): string {
  const { functionName, parameters, returnType, description } = problem

  switch (language) {
    case 'javascript':
      return generateJavaScriptTemplate(functionName, parameters, returnType, description)

    case 'typescript':
      return generateTypeScriptTemplate(functionName, parameters, returnType, description)

    case 'python':
      return generatePythonTemplate(functionName, parameters, returnType, description)

    case 'java':
      return generateJavaTemplate(functionName, parameters, returnType, description)

    case 'cpp':
      return generateCppTemplate(functionName, parameters, returnType, description)

    case 'c':
      return generateCTemplate(functionName, parameters, returnType, description)

    case 'csharp':
      return generateCSharpTemplate(functionName, parameters, returnType, description)

    case 'go':
      return generateGoTemplate(functionName, parameters, returnType, description)

    case 'rust':
      return generateRustTemplate(functionName, parameters, returnType, description)

    case 'ruby':
      return generateRubyTemplate(functionName, parameters, returnType, description)

    case 'php':
      return generatePhpTemplate(functionName, parameters, returnType, description)

    case 'swift':
      return generateSwiftTemplate(functionName, parameters, returnType, description)

    case 'kotlin':
      return generateKotlinTemplate(functionName, parameters, returnType, description)

    default:
      return DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES.javascript
  }
}

/**
 * Reset to default template
 */
export function resetToTemplate(
  problemId: string,
  language: ProgrammingLanguage
): string {
  return DEFAULT_TEMPLATES[language] || DEFAULT_TEMPLATES.javascript
}

/**
 * Get all available templates
 */
export function getAllTemplates(): CodeTemplate[] {
  return Object.entries(DEFAULT_TEMPLATES).map(([language, template]) => ({
    language: language as ProgrammingLanguage,
    template,
    description: `${language} solution template`,
  }))
}

// ============================================================================
// TEMPLATE GENERATORS
// ============================================================================

function generateJavaScriptTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => p.name).join(', ')
  const paramComments = parameters
    .map((p) => ` * @param {${p.type}} ${p.name}`)
    .join('\n')

  return `/**
 * ${description}
 *
${paramComments}
 * @return {${returnType}}
 */
function ${functionName}(${params}) {
    // Write your solution here
    
}`
}

function generateTypeScriptTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `${p.name}: ${p.type}`).join(', ')

  return `/**
 * ${description}
 */
function ${functionName}(${params}): ${returnType} {
    // Write your solution here
    
}`
}

function generatePythonTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => p.name).join(', ')
  const paramComments = parameters
    .map((p) => `    :param ${p.name}: ${p.type}`)
    .join('\n')

  return `def ${functionName}(${params}):
    """
    ${description}
    
${paramComments}
    :return: ${returnType}
    """
    # Write your solution here
    pass`
}

function generateJavaTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `${p.type} ${p.name}`).join(', ')
  const paramComments = parameters
    .map((p) => `     * @param ${p.name} ${p.type}`)
    .join('\n')

  return `class Solution {
    /**
     * ${description}
     *
${paramComments}
     * @return ${returnType}
     */
    public ${returnType} ${functionName}(${params}) {
        // Write your solution here
        
    }
}`
}

function generateCppTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `${p.type} ${p.name}`).join(', ')

  return `class Solution {
public:
    /**
     * ${description}
     */
    ${returnType} ${functionName}(${params}) {
        // Write your solution here
        
    }
};`
}

function generateCTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `${p.type} ${p.name}`).join(', ')

  return `/**
 * ${description}
 */
${returnType} ${functionName}(${params}) {
    // Write your solution here
    
}`
}

function generateCSharpTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `${p.type} ${p.name}`).join(', ')
  const capitalizedFunctionName =
    functionName.charAt(0).toUpperCase() + functionName.slice(1)

  return `public class Solution {
    /// <summary>
    /// ${description}
    /// </summary>
    public ${returnType} ${capitalizedFunctionName}(${params}) {
        // Write your solution here
        
    }
}`
}

function generateGoTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `${p.name} ${p.type}`).join(', ')

  return `package main

// ${description}
func ${functionName}(${params}) ${returnType} {
    // Write your solution here
    
}`
}

function generateRustTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `${p.name}: ${p.type}`).join(', ')

  return `/// ${description}
fn ${functionName}(${params}) -> ${returnType} {
    // Write your solution here
    
}`
}

function generateRubyTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => p.name).join(', ')

  return `# ${description}
#
# @param [${parameters.map((p) => p.type).join(', ')}]
# @return [${returnType}]
def ${functionName}(${params})
    # Write your solution here
    
end`
}

function generatePhpTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `$${p.name}`).join(', ')
  const paramComments = parameters
    .map((p) => ` * @param ${p.type} $${p.name}`)
    .join('\n')

  return `<?php
/**
 * ${description}
 *
${paramComments}
 * @return ${returnType}
 */
function ${functionName}(${params}) {
    // Write your solution here
    
}`
}

function generateSwiftTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `_ ${p.name}: ${p.type}`).join(', ')

  return `/// ${description}
func ${functionName}(${params}) -> ${returnType} {
    // Write your solution here
    
}`
}

function generateKotlinTemplate(
  functionName: string,
  parameters: { name: string; type: string }[],
  returnType: string,
  description: string
): string {
  const params = parameters.map((p) => `${p.name}: ${p.type}`).join(', ')

  return `/**
 * ${description}
 */
fun ${functionName}(${params}): ${returnType} {
    // Write your solution here
    
}`
}
