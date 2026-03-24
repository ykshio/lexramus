import type { LawElement, LawTreeNode, LawNodeType, RichSegment } from '../types/law'

const TAG_TO_NODE_TYPE: Record<string, LawNodeType> = {
  Law: 'law',
  LawBody: 'law_body',
  Part: 'part',
  Chapter: 'chapter',
  Section: 'section',
  Subsection: 'subsection',
  Division: 'division',
  Article: 'article',
  Paragraph: 'paragraph',
  Item: 'item',
  Subitem1: 'subitem',
  Subitem2: 'subitem',
  Subitem3: 'subitem',
  Subitem4: 'subitem',
  Subitem5: 'subitem',
  Subitem6: 'subitem',
  Subitem7: 'subitem',
  Subitem8: 'subitem',
  Subitem9: 'subitem',
  Subitem10: 'subitem',
  SupplProvision: 'suppl_provision',
  TOC: 'toc',
  Preamble: 'preamble',
}

const TITLE_TAGS: Record<string, string> = {
  Part: 'PartTitle',
  Chapter: 'ChapterTitle',
  Section: 'SectionTitle',
  Subsection: 'SubsectionTitle',
  Division: 'DivisionTitle',
  Article: 'ArticleTitle',
  SupplProvision: 'SupplProvisionLabel',
}

export function parseLawFullText(element: LawElement): LawTreeNode[] {
  const lawBody = findChild(element, 'LawBody')
  if (!lawBody) return []

  const nodes = parseChildren(lawBody, '', 0)
  return groupSupplProvisions(nodes)
}

function parseChildren(element: LawElement, parentPath: string, depth: number): LawTreeNode[] {
  const nodes: LawTreeNode[] = []

  for (const child of element.children) {
    if (typeof child === 'string') continue

    const nodeType = TAG_TO_NODE_TYPE[child.tag]
    if (nodeType && nodeType !== 'law' && nodeType !== 'law_body') {
      nodes.push(parseNode(child, nodeType, parentPath, depth))
    } else if (isStructuralTag(child.tag)) {
      nodes.push(...parseChildren(child, parentPath, depth))
    }
  }

  return nodes
}

function parseNode(element: LawElement, type: LawNodeType, parentPath: string, depth: number): LawTreeNode {
  const id = buildId(element, parentPath)
  const richTitle = extractRichTitle(element)
  const richContent = extractRichContent(element)
  const title = richToPlain(richTitle)
  const num = extractNum(element)
  const content = richToPlain(richContent)
  const children = parseChildren(element, id, depth + 1)

  return {
    id,
    type,
    title,
    num,
    content,
    richTitle,
    richContent,
    children,
    depth,
  }
}

function richToPlain(segments: RichSegment[]): string {
  return segments.map(s => {
    if (typeof s === 'string') return s
    if ('rb' in s) return s.rb
    return s.text
  }).join('')
}

function extractNum(element: LawElement): string {
  const attr = element.attr
  if (typeof attr === 'object' && attr !== null) {
    return attr.Num ?? ''
  }
  return ''
}

function extractRichText(element: LawElement): RichSegment[] {
  const segments: RichSegment[] = []
  for (const child of element.children) {
    if (typeof child === 'string') {
      segments.push(child)
    } else if (child.tag === 'Ruby') {
      const base = extractText(child)
      const rtEl = findChild(child, 'Rt')
      const reading = rtEl ? extractText(rtEl) : ''
      segments.push(reading ? { rb: base, rt: reading } : base)
    } else if (child.tag !== 'Rt') {
      segments.push(...extractRichText(child))
    }
  }
  return segments
}

function extractRichTitle(element: LawElement): RichSegment[] {
  if (element.tag === 'Article') {
    const titleEl = findChild(element, 'ArticleTitle')
    const caption = findChild(element, 'ArticleCaption')
    const segments: RichSegment[] = []
    if (titleEl) segments.push(...extractRichText(titleEl))
    if (caption) segments.push(...extractRichText(caption))
    return segments
  }

  if (element.tag === 'Paragraph') {
    const numEl = findChild(element, 'ParagraphNum')
    if (numEl) return extractRichText(numEl)
    return []
  }

  if (element.tag === 'Item') {
    const titleEl = findChild(element, 'ItemTitle')
    if (titleEl) return extractRichText(titleEl)
    return []
  }

  if (element.tag.startsWith('Subitem')) {
    const titleEl = findChild(element, `${element.tag}Title`)
    if (titleEl) return extractRichText(titleEl)
    return []
  }

  const titleTag = TITLE_TAGS[element.tag]
  if (titleTag) {
    const titleEl = findChild(element, titleTag)
    if (titleEl) return extractRichText(titleEl)
  }

  const label = findChild(element, 'SupplProvisionLabel')
  if (label) return extractRichText(label)

  const tocLabel = findChild(element, 'TOCLabel')
  if (tocLabel) return extractRichText(tocLabel)

  return []
}

// 法令参照パターン: 法令名（元号N年法律第N号）
const LAW_REF_RE = /([^\s、。（）「」]+?(?:法律|法|政令|省令|規則|条例))（((?:明治|大正|昭和|平成|令和)[^）]+?号)）/g

function detectLawRefs(segments: RichSegment[]): RichSegment[] {
  const result: RichSegment[] = []
  for (const seg of segments) {
    if (typeof seg !== 'string') {
      result.push(seg)
      continue
    }
    let lastIndex = 0
    LAW_REF_RE.lastIndex = 0
    let match
    while ((match = LAW_REF_RE.exec(seg)) !== null) {
      if (match.index > lastIndex) {
        result.push(seg.slice(lastIndex, match.index))
      }
      result.push({ type: 'law_ref', text: match[0], lawTitle: match[1] })
      lastIndex = LAW_REF_RE.lastIndex
    }
    if (lastIndex < seg.length) {
      result.push(seg.slice(lastIndex))
    }
  }
  return result
}

function extractRichContent(element: LawElement): RichSegment[] {
  const segments: RichSegment[] = []
  for (const child of element.children) {
    if (typeof child === 'string') continue
    if (
      child.tag === 'ParagraphSentence' ||
      child.tag === 'ItemSentence' ||
      child.tag === 'PreambleSentence' ||
      /^Subitem\d+Sentence$/.test(child.tag)
    ) {
      segments.push(...extractRichText(child))
    }
  }
  return detectLawRefs(segments)
}

function extractText(element: LawElement): string {
  const parts: string[] = []

  for (const child of element.children) {
    if (typeof child === 'string') {
      parts.push(child)
    } else if (child.tag !== 'Rt') {
      // Rt(ふりがな)要素はスキップ
      parts.push(extractText(child))
    }
  }

  return parts.join('')
}

function findChild(element: LawElement, tag: string): LawElement | undefined {
  for (const child of element.children) {
    if (typeof child !== 'string' && child.tag === tag) {
      return child
    }
  }
  return undefined
}

function isStructuralTag(tag: string): boolean {
  return [
    'MainProvision',
    'AppdxTable',
    'AppdxNote',
    'AppdxStyle',
    'AppdxFormat',
    'AppdxFig',
    'Appdx',
  ].includes(tag)
}

function groupSupplProvisions(nodes: LawTreeNode[]): LawTreeNode[] {
  const supplNodes = nodes.filter(n => n.type === 'suppl_provision')
  if (supplNodes.length <= 1) return nodes

  const group: LawTreeNode = {
    id: 'suppl_group',
    type: 'suppl_group',
    title: '附則',
    num: '',
    content: '',
    richTitle: ['附則'],
    richContent: [],
    children: supplNodes,
    depth: 0,
  }

  const result = nodes.filter(n => n.type !== 'suppl_provision')
  result.push(group)
  return result
}

let counter = 0

function buildId(element: LawElement, parentPath: string): string {
  const tag = element.tag
  const attr = element.attr
  const segment = (typeof attr === 'object' && attr !== null && attr.Num)
    ? `${tag}_${attr.Num}`
    : `${tag}_${++counter}`
  return parentPath ? `${parentPath}-${segment}` : segment
}
