import { NextRequest, NextResponse } from 'next/server'
import { createServerClientSafe, createServiceRoleClient } from '@/lib/supabase/server-safe'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // --- SECURITY CHECK START ---
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {}
        }
      }
    )

    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Verify Admin Role
    const supabaseAdmin = createServiceRoleClient()
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, { status: 403 })
    }
    // --- SECURITY CHECK END ---

    const { questionNumber, contestId } = await request.json()

    if (!questionNumber) {
      return NextResponse.json({
        success: false,
        error: 'Question number is required'
      }, { status: 400 })
    }

    console.log('Fetching LeetCode problem:', questionNumber)

    // Check if problem already exists using admin client
    const { data: existingProblem } = await supabaseAdmin
      .from('problems')
      .select('id, title, leetcode_id')
      .eq('leetcode_id', questionNumber)
      .single()

    if (existingProblem) {
      return NextResponse.json({
        success: false,
        error: `Problem #${questionNumber} (${existingProblem.title}) already exists in your database`
      }, { status: 409 })
    }

    // Fetch problem from LeetCode API
    const response = await fetch(`https://leetcode.com/api/problems/all/`)

    if (!response.ok) {
      throw new Error('Failed to fetch from LeetCode')
    }

    const data = await response.json()

    // Find the problem by question number
    const problem = data.stat_status_pairs?.find((p: any) =>
      p.stat.frontend_question_id === parseInt(questionNumber) ||
      p.stat.question_id === parseInt(questionNumber)
    )

    if (!problem) {
      return NextResponse.json({
        success: false,
        error: `Problem #${questionNumber} not found on LeetCode`
      }, { status: 404 })
    }

    // Get detailed problem info
    const titleSlug = problem.stat.question__title_slug
    const detailResponse = await fetch(`https://leetcode.com/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query getQuestionDetail($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionId
              title
              content
              difficulty
              exampleTestcases
              sampleTestCase
              codeSnippets {
                lang
                langSlug
                code
              }
            }
          }
        `,
        variables: { titleSlug }
      })
    })

    let detailedProblem = null
    if (detailResponse.ok) {
      const detailData = await detailResponse.json()
      detailedProblem = detailData.data?.question
    }

    // Extract function metadata from code snippets
    let functionName = 'solution'
    let parameters: any[] = []
    let returnType = 'any'
    const codeSnippets: Record<string, string> = {}

    if (detailedProblem?.codeSnippets) {
      detailedProblem.codeSnippets.forEach((snippet: any) => {
        codeSnippets[snippet.langSlug] = snippet.code
      })

      // Try to extract metadata from Python snippet (usually easiest)
      const pythonSnippet = codeSnippets['python3'] || codeSnippets['python']
      if (pythonSnippet) {
        const match = pythonSnippet.match(/def\s+(\w+)\s*\((.*?)\)\s*(?:->\s*(.*?))?:/)
        if (match) {
          functionName = match[1]
          const paramsStr = match[2]
          returnType = match[3] || 'any'
          
          // Smarter param parsing to handle nested commas in types like List[List[int]]
          parameters = []
          let currentParam = ''
          let bracketDepth = 0
          for (let i = 0; i < paramsStr.length; i++) {
            const char = paramsStr[i]
            if (char === '[' || char === '(') bracketDepth++
            else if (char === ']' || char === ')') bracketDepth--
            
            if (char === ',' && bracketDepth === 0) {
              const [name, type] = currentParam.split(':').map(s => s.trim())
              parameters.push({ name: name.replace('self', '').trim(), type: type || 'any' })
              currentParam = ''
            } else {
              currentParam += char
            }
          }
          if (currentParam.trim()) {
            const [name, type] = currentParam.split(':').map(s => s.trim())
            parameters.push({ name: name.replace('self', '').trim(), type: type || 'any' })
          }
          parameters = parameters.filter(p => p.name)
        }
      }
    }

    // Map difficulty
    const difficultyMap: Record<number, string> = {
      1: 'easy',
      2: 'medium',
      3: 'hard'
    }
    const difficulty = difficultyMap[problem.difficulty.level] || 'medium'

    // Calculate points based on difficulty
    const pointsMap: Record<string, number> = {
      easy: 100,
      medium: 200,
      hard: 300
    }
    const points = pointsMap[difficulty]

    // Parse test cases - Extract from description examples or exampleTestcases
    let testCases: any[] = []
    
    // Detect if "Design" problem (Class with constructor + methods)
    const isDesignProblem = (() => {
      const snippets = Object.values(codeSnippets);
      return snippets.some(s => 
        (s.includes('class ') && s.includes('__init__') && s.split('def ').length > 2) || // Python
        (s.includes('class ') && s.split('public ').length > 3) // Java-ish
      );
    })();

    // Try to extract examples from the HTML content more robustly
    if (detailedProblem?.content) {
      // Look for Input/Output blocks
      const exampleBlocks = detailedProblem.content.match(/<pre>(.*?)<\/pre>/gis) || [];
      exampleBlocks.forEach((block: string, idx: number) => {
        const text = block.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
        
        const inputMatch = text.match(/Input:?\s*([\s\S]+?)(?=Output:?|Explanation:|$)/i);
        const outputMatch = text.match(/Output:?\s*([\s\S]+?)(?=Explanation:|$)/i);
        
        if (inputMatch && outputMatch) {
          let input = inputMatch[1].trim();
          let output = outputMatch[1].trim();
          
          if (isDesignProblem) {
            // For design problems, input is often split into two arrays on newlines
            const lines = input.split('\n').map((l: string) => l.trim()).filter((l: string) => l);
            if (lines.length >= 2) {
              input = JSON.stringify([JSON.parse(lines[0]), JSON.parse(lines[1])]);
            }
          }
          
          testCases.push({
            input,
            expected_output: output,
            description: `Example ${idx + 1}`
          });
        }
      });
    }

    // Fallback: Use exampleTestcases if available
    if (testCases.length === 0 && detailedProblem?.exampleTestcases) {
      const lines = detailedProblem.exampleTestcases.split('\n').filter((line: string) => line.trim());
      
      if (isDesignProblem) {
        // Design problems have input in pairs of lines
        for (let i = 0; i < lines.length; i += 2) {
          if (lines[i] && lines[i+1]) {
            testCases.push({
              input: JSON.stringify([JSON.parse(lines[i]), JSON.parse(lines[i+1])]),
              expected_output: '', // Will need manual edit if not found in description
              description: `Test case ${Math.floor(i / 2) + 1}`
            });
          }
        }
      } else {
        // Standard problems: one line per test case or multi-line based on params
        const numParams = parameters.length;
        const step = numParams > 0 ? numParams : 1;
        for (let i = 0; i < lines.length; i += step) {
          const chunk = lines.slice(i, i + step);
          testCases.push({
            input: chunk.join('\n'),
            expected_output: '', 
            description: `Test case ${Math.floor(i / step) + 1}`
          });
        }
      }
    }

    // If still no test cases, create a placeholder
    if (testCases.length === 0) {
      testCases = [{
        input: 'Add test input',
        expected_output: 'Add expected output',
        description: 'Example 1 - Edit this test case'
      }]
    }

    // Clean HTML description - convert to plain text with proper formatting
    let cleanDescription = detailedProblem?.content || `LeetCode Problem #${questionNumber}`
    if (cleanDescription) {
      // Helper function to decode HTML entities
      const decodeHtmlEntities = (text: string): string => {
        const entities: Record<string, string> = {
          '&nbsp;': ' ',
          '&lt;': '<',
          '&gt;': '>',
          '&amp;': '&',
          '&quot;': '"',
          '&#39;': "'",
          '&apos;': "'",
          '&ldquo;': '"',
          '&rdquo;': '"',
          '&lsquo;': "'",
          '&rsquo;': "'",
          '&ndash;': '-',
          '&mdash;': '—',
        }

        let decoded = text
        // Replace named entities
        Object.entries(entities).forEach(([entity, char]) => {
          decoded = decoded.replace(new RegExp(entity, 'g'), char)
        })
        // Replace numeric entities
        decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
        decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))

        return decoded
      }

      // Convert specific HTML elements to markdown before stripping
      cleanDescription = cleanDescription
        // Code blocks
        .replace(/<pre[^>]*>(.*?)<\/pre>/gis, (_match: string, content: string) => {
          const cleaned = content.replace(/<code[^>]*>(.*?)<\/code>/gis, '$1')
          return '\n```\n' + cleaned + '\n```\n'
        })
        // Inline code
        .replace(/<code[^>]*>(.*?)<\/code>/gis, '`$1`')
        // Strong/Bold
        .replace(/<strong[^>]*>(.*?)<\/strong>/gis, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gis, '**$1**')
        // Emphasis/Italic
        .replace(/<em[^>]*>(.*?)<\/em>/gis, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gis, '*$1*')
        // Underline
        .replace(/<u[^>]*>(.*?)<\/u>/gis, '_$1_')
        // Superscript
        .replace(/<sup[^>]*>(.*?)<\/sup>/gis, '^$1')
        // Subscript
        .replace(/<sub[^>]*>(.*?)<\/sub>/gis, '_$1')
        // Links
        .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gis, '[$2]($1)')
        // Images
        .replace(/<img[^>]*>/gi, '[image]')
        // Paragraphs
        .replace(/<p[^>]*>/gi, '\n\n')
        .replace(/<\/p>/gi, '')
        // Line breaks
        .replace(/<br\s*\/?>/gi, '\n')
        // Horizontal rules
        .replace(/<hr\s*\/?>/gi, '\n---\n')
        // List items
        .replace(/<li[^>]*>/gi, '\n• ')
        .replace(/<\/li>/gi, '')
        // Lists
        .replace(/<ul[^>]*>/gi, '\n')
        .replace(/<\/ul>/gi, '\n')
        .replace(/<ol[^>]*>/gi, '\n')
        .replace(/<\/ol>/gi, '\n')
        // Divs and spans
        .replace(/<div[^>]*>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<span[^>]*>/gi, '')
        .replace(/<\/span>/gi, '')
        // Headings
        .replace(/<h1[^>]*>/gi, '\n# ')
        .replace(/<\/h1>/gi, '\n')
        .replace(/<h2[^>]*>/gi, '\n## ')
        .replace(/<\/h2>/gi, '\n')
        .replace(/<h3[^>]*>/gi, '\n### ')
        .replace(/<\/h3>/gi, '\n')
        .replace(/<h4[^>]*>/gi, '\n#### ')
        .replace(/<\/h4>/gi, '\n')
        // Remove all remaining HTML tags (including attributes)
        .replace(/<\/?[^>]+(>|$)/g, '')

      // Decode HTML entities
      cleanDescription = decodeHtmlEntities(cleanDescription)

      // Clean up whitespace
      cleanDescription = cleanDescription
        .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive newlines
        .replace(/[ \t]+/g, ' ') // Normalize spaces
        .replace(/^\s+|\s+$/gm, '') // Trim each line
        .trim()
    }

    // Create problem in database (use supabaseAdmin instead of supabase)
    const problemData = {
      title: detailedProblem?.title || problem.stat.question__title,
      description: cleanDescription,
      difficulty,
      points,
      time_limit: 1000,
      memory_limit: 128,
      test_cases: testCases,
      leetcode_id: questionNumber,
      leetcode_slug: titleSlug,
      function_name: functionName,
      parameters: parameters,
      return_type: returnType,
      code_snippets: codeSnippets
    }

    const { data: createdProblem, error: createError } = await supabaseAdmin
      .from('problems')
      .insert(problemData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating problem:', createError)
      throw createError
    }

    // If contestId provided, link problem to contest
    if (contestId && createdProblem) {
      const { error: linkError } = await supabaseAdmin
        .from('contest_problems')
        .insert({
          contest_id: contestId,
          problem_id: createdProblem.id,
          order_index: 0
        })

      if (linkError) {
        console.error('Error linking problem to contest:', linkError)
        // Don't throw, problem is created successfully
      }
    }

    return NextResponse.json({
      success: true,
      problem: createdProblem,
      message: `Problem #${questionNumber} added successfully`
    })

  } catch (error) {
    console.error('Error fetching LeetCode problem:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch problem'
    }, { status: 500 })
  }
}
