import { useLawStore } from '../store/useLawStore'
import { convertToArabic } from '../lib/kansuji'
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
  const { lawTree, tocVisible, setTocVisible, scrollToNode, useArabicNum } = useLawStore()

  if (!tocVisible || lawTree.length === 0) return null

  const entries = collectTocEntries(lawTree)

  if (entries.length === 0) return null

  return (
    <>
      {/* モバイル: オーバーレイ背景 */}
      <div
        className="md:hidden fixed inset-0 bg-black/30 z-20"
        onClick={() => setTocVisible(false)}
      />
      <div className="
        fixed md:relative z-30 md:z-0
        left-0 top-0 md:top-auto
        h-full
        w-64 md:w-56 flex-shrink-0
        border-r border-gray-200 flex flex-col bg-white md:bg-gray-50/50
      ">
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
              onClick={() => {
                scrollToNode(entry.id)
                if (window.innerWidth < 768) setTocVisible(false)
              }}
              className="w-full text-left px-3 py-1.5 md:py-1 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-800 truncate"
              style={{ paddingLeft: (entry.depth - 1) * 12 + 12 }}
            >
              {useArabicNum ? convertToArabic(entry.title) : entry.title}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
