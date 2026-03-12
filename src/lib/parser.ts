import type { LawElement, LawTreeNode, LawNodeType } from '../types/law'

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

// LawNodeTypeの深さ順序
const NODE_DEPTH: Record<LawNodeType, number> = {
  law: 0,
  law_body: 0,
  toc: 1,
  preamble: 1,
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
  unknown: 10,
}

export function parseLawFullText(element: LawElement): LawTreeNode[] {
  const lawBody = findChild(element, 'LawBody')
  if (!lawBody) return []

  return parseChildren(lawBody, 0)
}

function parseChildren(element: LawElement, depth: number): LawTreeNode[] {
  const nodes: LawTreeNode[] = []

  for (const child of element.children) {
    if (typeof child === 'string') continue

    const nodeType = TAG_TO_NODE_TYPE[child.tag]
    if (nodeType && nodeType !== 'law' && nodeType !== 'law_body') {
      nodes.push(parseNode(child, nodeType, depth))
    } else if (isStructuralTag(child.tag)) {
      // MainProvision等の構造タグは中身を展開
      nodes.push(...parseChildren(child, depth))
    }
  }

  return nodes
}

function parseNode(element: LawElement, type: LawNodeType, depth: number): LawTreeNode {
  const actualDepth = NODE_DEPTH[type] ?? depth
  const title = extractTitle(element)
  const num = extractNum(element)
  const content = extractContent(element)
  const children = parseChildren(element, actualDepth + 1)

  return {
    id: buildId(element),
    type,
    title,
    num,
    content,
    children,
    depth: actualDepth,
  }
}

function extractTitle(element: LawElement): string {
  // 条: ArticleTitle + ArticleCaption
  if (element.tag === 'Article') {
    const titleEl = findChild(element, 'ArticleTitle')
    const caption = findChild(element, 'ArticleCaption')
    const parts: string[] = []
    if (titleEl) parts.push(extractText(titleEl))
    if (caption) parts.push(extractText(caption))
    return parts.join('')
  }

  // 項: ParagraphNum（「２」「３」等、第1項は空の場合がある）
  if (element.tag === 'Paragraph') {
    const numEl = findChild(element, 'ParagraphNum')
    if (numEl) {
      const text = extractText(numEl)
      return text || ''
    }
    return ''
  }

  // 号: ItemTitle
  if (element.tag === 'Item') {
    const titleEl = findChild(element, 'ItemTitle')
    if (titleEl) return extractText(titleEl)
    return ''
  }

  const titleTag = TITLE_TAGS[element.tag]
  if (titleTag) {
    const titleEl = findChild(element, titleTag)
    if (titleEl) return extractText(titleEl)
  }

  // SupplProvisionLabel
  const label = findChild(element, 'SupplProvisionLabel')
  if (label) return extractText(label)

  // TOCLabel
  const tocLabel = findChild(element, 'TOCLabel')
  if (tocLabel) return extractText(tocLabel)

  return ''
}

function extractNum(element: LawElement): string {
  const attr = element.attr
  if (typeof attr === 'object' && attr !== null) {
    return attr.Num ?? ''
  }
  return ''
}

function extractContent(element: LawElement): string {
  const parts: string[] = []

  // ParagraphSentence, ItemSentence, Sentence等からテキストを取得
  for (const child of element.children) {
    if (typeof child === 'string') continue

    if (
      child.tag === 'ParagraphSentence' ||
      child.tag === 'ItemSentence' ||
      child.tag === 'Subitem1Sentence' ||
      child.tag === 'Subitem2Sentence' ||
      child.tag === 'Subitem3Sentence' ||
      child.tag === 'PreambleSentence'
    ) {
      parts.push(extractText(child))
    }
  }

  return parts.join('')
}

function extractText(element: LawElement): string {
  const parts: string[] = []

  for (const child of element.children) {
    if (typeof child === 'string') {
      parts.push(child)
    } else {
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

function buildId(element: LawElement): string {
  const tag = element.tag
  const attr = element.attr
  if (typeof attr === 'object' && attr !== null && attr.Num) {
    return `${tag}_${attr.Num}`
  }
  return tag + '_' + Math.random().toString(36).slice(2, 8)
}
