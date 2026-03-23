/**
 * Utility to clean HTML tags and entities from text
 * Useful for displaying LeetCode problem descriptions
 */

export function cleanHtml(html: string): string {
  if (!html) return ''

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

  let cleaned = html

  // Convert specific HTML elements to markdown before stripping
  cleaned = cleaned
    // Code blocks
    .replace(/<pre[^>]*>(.*?)<\/pre>/gis, (_, content) => {
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
    // Font tags (sometimes used in LeetCode)
    .replace(/<font[^>]*>/gi, '')
    .replace(/<\/font>/gi, '')
    // Remove all remaining HTML tags (including attributes)
    .replace(/<\/?[^>]+(>|$)/g, '')
    
  // Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned)
  
  // Clean up whitespace
  cleaned = cleaned
    .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive newlines
    .replace(/[ \t]+/g, ' ') // Normalize spaces
    .replace(/^\s+|\s+$/gm, '') // Trim each line
    .trim()

  return cleaned
}

/**
 * Clean HTML for preview (shorter version)
 */
export function cleanHtmlPreview(html: string, maxLength: number = 100): string {
  const cleaned = cleanHtml(html)
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.substring(0, maxLength) + '...'
}
