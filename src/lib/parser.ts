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

  return parseChildren(lawBody, '', 0)
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
  const title = extractTitle(element)
  const num = extractNum(element)
  const content = extractContent(element)
  const children = parseChildren(element, id, depth + 1)

  return {
    id,
    type,
    title,
    num,
    content,
    children,
    depth,
  }
}

function extractTitle(element: LawElement): string {
  if (element.tag === 'Article') {
    const titleEl = findChild(element, 'ArticleTitle')
    const caption = findChild(element, 'ArticleCaption')
    const parts: string[] = []
    if (titleEl) parts.push(extractText(titleEl))
    if (caption) parts.push(extractText(caption))
    return parts.join('')
  }

  if (element.tag === 'Paragraph') {
    const numEl = findChild(element, 'ParagraphNum')
    if (numEl) {
      const text = extractText(numEl)
      return text || ''
    }
    return ''
  }

  if (element.tag === 'Item') {
    const titleEl = findChild(element, 'ItemTitle')
    if (titleEl) return extractText(titleEl)
    return ''
  }

  if (element.tag.startsWith('Subitem')) {
    const titleEl = findChild(element, `${element.tag}Title`)
    if (titleEl) return extractText(titleEl)
    return ''
  }

  const titleTag = TITLE_TAGS[element.tag]
  if (titleTag) {
    const titleEl = findChild(element, titleTag)
    if (titleEl) return extractText(titleEl)
  }

  const label = findChild(element, 'SupplProvisionLabel')
  if (label) return extractText(label)

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

  for (const child of element.children) {
    if (typeof child === 'string') continue

    if (
      child.tag === 'ParagraphSentence' ||
      child.tag === 'ItemSentence' ||
      child.tag === 'PreambleSentence' ||
      /^Subitem\d+Sentence$/.test(child.tag)
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

let counter = 0

function buildId(element: LawElement, parentPath: string): string {
  const tag = element.tag
  const attr = element.attr
  const segment = (typeof attr === 'object' && attr !== null && attr.Num)
    ? `${tag}_${attr.Num}`
    : `${tag}_${++counter}`
  return parentPath ? `${parentPath}-${segment}` : segment
}
