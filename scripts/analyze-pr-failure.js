const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function analyzeLog() {
  const logFile = process.argv[2];
  if (!logFile) {
    console.error('Usage: node analyze-pr-failure.js <path-to-log-file>');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY environment variable is not set.');
    // Don't fail the build just because analysis failed, but warn
    process.exit(0);
  }

  // Read the log file
  let logContent;
  try {
    logContent = fs.readFileSync(logFile, 'utf8');
  } catch (error) {
    console.error(`Error reading log file: ${error.message}`);
    process.exit(1);
  }

  // Truncate if too long (Gemini Flash has a large context, but let's be safe and focused)
  // We want the end of the log where the error usually is.
  const MAX_CHARS = 30000;
  let context = logContent;
  if (logContent.length > MAX_CHARS) {
    context = '... (truncated) ...\n' + logContent.slice(-MAX_CHARS);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
You are an expert software engineer and DevOps specialist.
The following is a build log from a Next.js project that failed during a Pull Request build.
Analyze the log, identify the specific error(s), and explain what caused them.
Then, provide a clear, actionable solution to fix the issue.
Format your response in GitHub Markdown. Use headings, code blocks, and bold text for clarity.

Build Log Snippet:
\`\`\`text
${context}
\`\`\`
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Output the markdown to stdout so the workflow can capture it
    console.log(text);
  } catch (error) {
    console.error(`Error communicating with Gemini: ${error.message}`);
    process.exit(1);
  }
}

analyzeLog();
