import { useLawStore } from '../store/useLawStore'
import type { LawTreeNode, LawNodeType } from '../types/law'

const STRUCTURAL_TYPES: LawNodeType[] = [
  'part', 'chapter', 'section', 'subsection', 'division', 'suppl_provision',
]

const DEPTH_STYLES: Record<number, string> = {
  1: 'text-base font-bold text-gray-900 mt-6 mb-2 border-b border-gray-200 pb-1',
  2: 'text-base font-semibold text-gray-800 mt-5 mb-1.5',
  3: 'text-sm font-semibold text-gray-700 mt-4 mb-1',
  4: 'text-sm font-medium text-gray-700 mt-3 mb-1',
  5: 'text-sm font-medium text-gray-600 mt-2 mb-0.5',
}

function flattenNodes(nodes: LawTreeNode[]): LawTreeNode[] {
  const result: LawTreeNode[] = []
  function walk(node: LawTreeNode) {
    result.push(node)
    for (const child of node.children) {
      walk(child)
    }
  }
  for (const n of nodes) walk(n)
  return result
}

function OutlineNode({ node }: { node: LawTreeNode }) {
  const isStructural = STRUCTURAL_TYPES.includes(node.type)

  if (node.type === 'toc') return null

  if (isStructural) {
    const style = DEPTH_STYLES[node.depth] ?? 'text-sm font-medium text-gray-600 mt-2'
    return (
      <div id={`law-node-${node.id}`} className={style}>
        {node.title}
      </div>
    )
  }

  if (node.type === 'article') {
    return (
      <div id={`law-node-${node.id}`} className="mt-3 mb-1">
        <span className="text-sm font-semibold text-gray-800">{node.title}</span>
        {node.content && (
          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{node.content}</p>
        )}
      </div>
    )
  }

  if (node.type === 'paragraph') {
    const title = node.title
    return (
      <div id={`law-node-${node.id}`} className="mt-0.5">
        <span className="text-sm text-gray-600 leading-relaxed">
          {title && <span className="font-medium mr-1">{title}</span>}
          {node.content}
        </span>
      </div>
    )
  }

  if (node.type === 'item' || node.type === 'subitem') {
    return (
      <div id={`law-node-${node.id}`} className="ml-4 mt-0.5">
        <span className="text-sm text-gray-600">
          {node.title && <span className="font-medium mr-1">{node.title}</span>}
          {node.content}
        </span>
      </div>
    )
  }

  if (node.type === 'preamble' && node.content) {
    return (
      <div id={`law-node-${node.id}`} className="mt-3 mb-2">
        <p className="text-sm text-gray-600 leading-relaxed">{node.content}</p>
      </div>
    )
  }

  return null
}

export function LawOutlineView() {
  const { lawTree, lawLoading, lawError, selectedLawTitle } = useLawStore()

  if (lawLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        法令を読み込み中...
      </div>
    )
  }

  if (lawError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {lawError}
      </div>
    )
  }

  if (lawTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        {selectedLawTitle
          ? '法令データを解析できませんでした'
          : '左のパネルから法令を検索・選択してください'}
      </div>
    )
  }

  const flat = flattenNodes(lawTree)

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {flat.map((node) => (
        <OutlineNode key={node.id} node={node} />
      ))}
    </div>
  )
}
