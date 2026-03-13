import { useLawStore } from '../store/useLawStore'
import type { LawTreeNode, LawNodeType } from '../types/law'

const TOC_TYPES: LawNodeType[] = [
  'part', 'chapter', 'section', 'subsection', 'division', 'suppl_provision',
]

function collectTocEntries(nodes: LawTreeNode[]): LawTreeNode[] {
  const entries: LawTreeNode[] = []
  function walk(node: LawTreeNode) {
    if (TOC_TYPES.includes(node.type)) {
      entries.push(node)
    }
    for (const child of node.children) {
      walk(child)
    }
  }
  for (const n of nodes) walk(n)
  return entries
}

export function TocPanel() {
  const { lawTree, tocVisible, setTocVisible, scrollToNode } = useLawStore()

  if (!tocVisible || lawTree.length === 0) return null

  const entries = collectTocEntries(lawTree)

  if (entries.length === 0) return null

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50/50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-medium text-gray-600">目次</span>
        <button
          onClick={() => setTocVisible(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => scrollToNode(entry.id)}
            className="w-full text-left px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-800 truncate"
            style={{ paddingLeft: (entry.depth - 1) * 12 + 12 }}
          >
            {entry.title}
          </button>
        ))}
      </div>
    </div>
  )
}
