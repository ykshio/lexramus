import type { LawTreeNode, RichSegment, ExpandLevel } from '../types/law'

// 階層の順序（useLawStore の TYPE_ORDER と同等）
const TYPE_ORDER: Record<string, number> = {
  toc: 0,
  preamble: 0,
  part: 1,
  chapter: 2,
  section: 3,
  subsection: 4,
  division: 5,
  article: 6,
  paragraph: 7,
  item: 8,
  subitem: 9,
  suppl_provision: 1,
}

function richSegmentsToText(segments: RichSegment[]): string {
  return segments.map(s => {
    if (typeof s === 'string') return s
    if ('rb' in s) return s.rb
    return s.text
  }).join('')
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function nodeDisplayText(node: LawTreeNode): string {
  const title = richSegmentsToText(node.richTitle) || node.title
  const content = richSegmentsToText(node.richContent) || node.content
  return title || content || ''
}

// --- OPML ---

function buildOpmlOutlines(nodes: LawTreeNode[], indent: string): string {
  let xml = ''
  for (const node of nodes) {
    if (node.type === 'toc') continue
    const title = richSegmentsToText(node.richTitle) || node.title
    const content = richSegmentsToText(node.richContent) || node.content
    const text = title || content || '...'
    const hasNote = title && content
    const noteAttr = hasNote ? ` _note="${escapeXml(content)}"` : ''

    if (node.children.length > 0) {
      const childXml = buildOpmlOutlines(node.children, indent + '  ')
      if (childXml) {
        xml += `${indent}<outline text="${escapeXml(text)}"${noteAttr}>\n${childXml}${indent}</outline>\n`
      } else {
        xml += `${indent}<outline text="${escapeXml(text)}"${noteAttr} />\n`
      }
    } else {
      xml += `${indent}<outline text="${escapeXml(text)}"${noteAttr} />\n`
    }
  }
  return xml
}

export function exportAsOpml(tree: LawTreeNode[], lawTitle: string): string {
  const body = buildOpmlOutlines(tree, '      ')
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(lawTitle)}</title>
  </head>
  <body>
    <outline text="${escapeXml(lawTitle)}">
${body}    </outline>
  </body>
</opml>
`
}

// --- Scrapbox ---

function getMaxOrder(targetLevel: ExpandLevel | null): number {
  if (!targetLevel || targetLevel === 'all') return Infinity
  if (targetLevel === 'list') return TYPE_ORDER['article'] ?? 99
  return TYPE_ORDER[targetLevel] ?? 99
}

function buildScrapboxLines(nodes: LawTreeNode[], depth: number, maxOrder: number): string[] {
  const lines: string[] = []
  for (const node of nodes) {
    if (node.type === 'toc') continue
    const nodeOrder = TYPE_ORDER[node.type] ?? 99
    if (nodeOrder > maxOrder) continue

    const text = nodeDisplayText(node)
    if (text) {
      const tabs = '\t'.repeat(depth)
      lines.push(`${tabs}${text}`)
    }
    // 子ノードも展開状態に関係なく全て走査
    if (node.children.length > 0) {
      lines.push(...buildScrapboxLines(node.children, depth + 1, maxOrder))
    }
  }
  return lines
}

export function exportAsScrapbox(tree: LawTreeNode[], lawTitle: string, targetLevel: ExpandLevel | null): string {
  const maxOrder = getMaxOrder(targetLevel)
  const lines = buildScrapboxLines(tree, 1, maxOrder)
  return [lawTitle, ...lines].join('\n')
}

// --- Markdown ---

const STRUCTURAL_SET = new Set(['part', 'chapter', 'section', 'subsection', 'division', 'suppl_provision'])

function buildMarkdownLines(nodes: LawTreeNode[], headingLevel: number): string[] {
  const lines: string[] = []
  for (const node of nodes) {
    if (node.type === 'toc') continue

    const title = richSegmentsToText(node.richTitle) || node.title
    const content = richSegmentsToText(node.richContent) || node.content

    if (STRUCTURAL_SET.has(node.type)) {
      const level = Math.min(headingLevel, 6)
      if (title) {
        lines.push('', `${'#'.repeat(level)} ${title}`, '')
      }
      if (node.children.length > 0) {
        lines.push(...buildMarkdownLines(node.children, headingLevel + 1))
      }
    } else if (node.type === 'article') {
      const articleLine = title ? `**${title}**` : ''
      if (articleLine) lines.push('', articleLine)
      if (content) lines.push('', content)
      if (node.children.length > 0) {
        lines.push(...buildMarkdownLines(node.children, headingLevel + 1))
      }
    } else if (node.type === 'paragraph' || node.type === 'item' || node.type === 'subitem') {
      const indent = node.type === 'item' ? '  ' : node.type === 'subitem' ? '    ' : ''
      const text = title && content ? `${title}\u3000${content}` : title || content
      if (text) lines.push(`${indent}${text}`)
      if (node.children.length > 0) {
        lines.push(...buildMarkdownLines(node.children, headingLevel))
      }
    } else if (node.type === 'preamble') {
      if (content) lines.push('', content, '')
    }
  }
  return lines
}

export function exportAsMarkdown(tree: LawTreeNode[], lawTitle: string): string {
  const lines = [`# ${lawTitle}`, ...buildMarkdownLines(tree, 2)]
  return lines.join('\n')
}

// --- ダウンロード / コピー ヘルパー ---

export function downloadAsFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
