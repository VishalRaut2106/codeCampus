import { NextResponse } from 'next/server'
import prettier from 'prettier'
import babel from 'prettier/plugins/babel'
import estree from 'prettier/plugins/estree'
import typescript from 'prettier/plugins/typescript'

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json()
    if (typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 })
    }

    let parser: 'babel' | 'typescript' | null = null
    if (language?.toLowerCase() === 'javascript' || language?.toLowerCase() === 'jsx') parser = 'babel'
    if (language?.toLowerCase() === 'typescript' || language?.toLowerCase() === 'tsx') parser = 'typescript'

    if (!parser) {
      // Unsupported language; return original
      return NextResponse.json({ success: true, formatted: code, unchanged: true })
    }

    const formatted = await prettier.format(code, {
      parser,
      plugins: [babel as any, estree as any, typescript as any],
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
    })

    return NextResponse.json({ success: true, formatted })
  } catch (error) {
    console.error('Format error:', error)
    return NextResponse.json({ success: false, error: 'Format failed' }, { status: 500 })
  }
}
