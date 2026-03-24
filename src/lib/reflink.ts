import { kanjiToNumber } from './kansuji'
import type { LawTreeNode } from '../types/law'

// 施行令条文中の「法第○条」パターン
const LAW_ARTICLE_REF = /法第([一二三四五六七八九十百千]+)条(?:の([一二三四五六七八九十百千]+))?/g

interface ParsedRef {
  num: string    // "3" or "15_2"
  original: string
}

function extractArticleRefs(text: string): ParsedRef[] {
  const refs: ParsedRef[] = []
  const seen = new Set<string>()
  LAW_ARTICLE_REF.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = LAW_ARTICLE_REF.exec(text)) !== null) {
    const main = kanjiToNumber(m[1])
    const sub = m[2] ? kanjiToNumber(m[2]) : null
    const num = sub ? `${main}_${sub}` : String(main)
    if (!seen.has(num)) {
      seen.add(num)
      refs.push({ num, original: m[0] })
    }
  }
  return refs
}

// 親法ツリーから article ノードを num → node で収集
function collectArticles(nodes: LawTreeNode[]): Map<string, LawTreeNode> {
  const map = new Map<string, LawTreeNode>()
  function walk(node: LawTreeNode) {
    if (node.type === 'article' && node.num) {
      map.set(node.num, node)
    }
    for (const c of node.children) walk(c)
  }
  for (const n of nodes) walk(n)
  return map
}

// 施行令ツリーから article ノードを走査
function walkArticles(nodes: LawTreeNode[], cb: (node: LawTreeNode) => void) {
  function walk(node: LawTreeNode) {
    if (node.type === 'article') cb(node)
    for (const c of node.children) walk(c)
  }
  for (const n of nodes) walk(n)
}

// ツリーにリンクノードを挿入（immutable）
function insertLinks(
  nodes: LawTreeNode[],
  linksByNum: Map<string, LawTreeNode[]>,
): LawTreeNode[] {
  return nodes.map(node => {
    const newChildren = insertLinks(node.children, linksByNum)
    if (node.type === 'article' && node.num && linksByNum.has(node.num)) {
      return { ...node, children: [...newChildren, ...linksByNum.get(node.num)!] }
    }
    if (newChildren !== node.children) {
      return { ...node, children: newChildren }
    }
    return node
  })
}

export function injectRefLinks(
  parentTree: LawTreeNode[],
  relatedLaws: { title: string; lawId: string; lawNum: string; tree: LawTreeNode[] }[],
): LawTreeNode[] {
  if (relatedLaws.length === 0) return parentTree

  const parentArticles = collectArticles(parentTree)
  const linksByNum = new Map<string, LawTreeNode[]>()

  for (const rl of relatedLaws) {
    const label = rl.title.includes('施行規則') ? '施行規則' : '施行令'
    walkArticles(rl.tree, (articleNode) => {
      const refs = extractArticleRefs(articleNode.content)
      for (const ref of refs) {
        const parentArticle = parentArticles.get(ref.num)
        if (!parentArticle) continue
        const linkNode: LawTreeNode = {
          id: `ref_link_${rl.lawId}_${articleNode.id}`,
          type: 'ref_link',
          title: `→ ${label} ${articleNode.title}`,
          num: '',
          content: '',
          richTitle: [`→ ${label} ${articleNode.title}`],
          richContent: [],
          children: [],
          depth: parentArticle.depth + 1,
          refTarget: {
            lawId: rl.lawId,
            lawNum: rl.lawNum,
            lawTitle: rl.title,
            nodeId: articleNode.id,
          },
        }
        if (!linksByNum.has(ref.num)) linksByNum.set(ref.num, [])
        linksByNum.get(ref.num)!.push(linkNode)
      }
    })
  }

  if (linksByNum.size === 0) return parentTree
  return insertLinks(parentTree, linksByNum)
}
