import { useLawStore } from '../store/useLawStore'
import type { LawTreeNode, LawNodeType } from '../types/law'

const INDENT_PX = 20

const STRUCTURAL_TYPES: LawNodeType[] = [
  'part', 'chapter', 'section', 'subsection', 'division', 'suppl_provision',
]

function TreeNode({ node }: { node: LawTreeNode }) {
  const { expandedNodes, toggleNode } = useLawStore()
  const hasChildren = node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  const isStructural = STRUCTURAL_TYPES.includes(node.type)

  // タイトルの組み立て
  let displayTitle = node.title
  if (!displayTitle) {
    if (node.type === 'paragraph' && node.num === '1') {
      displayTitle = '' // 第1項はタイトル省略
    } else if (node.type === 'toc') {
      displayTitle = '目次'
    } else if (node.type === 'preamble') {
      displayTitle = '前文'
    }
  }

  // 項のインラインコンテンツ表示
  const showInline = node.type === 'paragraph' || node.type === 'item' || node.type === 'subitem'

  return (
    <div id={`law-node-${node.id}`} style={{ paddingLeft: node.depth * INDENT_PX }}>
      <div
        className={`flex items-start gap-1 py-0.5 ${
          hasChildren ? 'cursor-pointer hover:bg-gray-50 rounded' : ''
        }`}
        onClick={() => hasChildren && toggleNode(node.id)}
      >
        {hasChildren ? (
          <span className="text-xs text-gray-400 mt-1 w-4 flex-shrink-0 select-none">
            {isExpanded ? '▼' : '▶'}
          </span>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {displayTitle && (
            <span
              className={`text-sm ${
                isStructural
                  ? 'font-semibold text-gray-800'
                  : 'font-medium text-gray-700'
              }`}
            >
              {displayTitle}
            </span>
          )}
          {showInline && node.content && (
            <span className="text-sm text-gray-600">
              {displayTitle ? '\u3000' : ''}{node.content}
            </span>
          )}
          {!showInline && node.content && (
            <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
              {node.content}
            </p>
          )}
        </div>
      </div>
      {isExpanded &&
        node.children.map((child) => (
          <TreeNode key={child.id} node={child} />
        ))}
    </div>
  )
}

export function LawTreeView() {
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

  return (
    <div className="p-3">
      {lawTree.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </div>
  )
}
