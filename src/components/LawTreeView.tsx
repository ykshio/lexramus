import { useLawStore } from '../store/useLawStore'
import { useTagStore, TAG_COLORS } from '../store/useTagStore'
import { TagPicker } from './TagPicker'
import { convertToArabic } from '../lib/kansuji'
import { highlightText } from '../lib/highlight'
import type { LawTreeNode, LawNodeType } from '../types/law'

const INDENT_PX = 20

const STRUCTURAL_TYPES: LawNodeType[] = [
  'part', 'chapter', 'section', 'subsection', 'division', 'suppl_provision',
]

const TAGGABLE_TYPES: LawNodeType[] = [
  'article', 'paragraph', 'item', 'subitem',
]

function getTagBgClass(lawId: string | null, nodeId: string): string {
  if (!lawId) return ''
  const tags = useTagStore.getState().getNodeTags(lawId, nodeId)
  if (tags.length === 0) return ''
  const color = TAG_COLORS.find((c) => c.id === tags[0])
  return color ? `${color.bg} border-l-2 ${color.border}` : ''
}

function TreeNode({ node }: { node: LawTreeNode }) {
  const { expandedNodes, toggleNode, selectedLawId, useArabicNum, textSearchQuery, textSearchResultIds, textSearchActiveIndex } = useLawStore()
  const activeFilter = useTagStore((s) => s.activeFilter)
  const tags = useTagStore((s) => selectedLawId ? s.tags[selectedLawId]?.[node.id] : undefined)
  const hasChildren = node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  const isStructural = STRUCTURAL_TYPES.includes(node.type)
  const isTaggable = TAGGABLE_TYPES.includes(node.type)

  const dimmed = activeFilter && (!tags || !tags.includes(activeFilter))
  const tagBg = getTagBgClass(selectedLawId, node.id)

  // テキスト検索ハイライト
  const isSearchMatch = textSearchResultIds.includes(node.id)
  const isActiveSearchResult = isSearchMatch && textSearchResultIds[textSearchActiveIndex] === node.id

  let displayTitle = node.title
  if (!displayTitle) {
    if (node.type === 'paragraph' && node.num === '1') {
      displayTitle = ''
    } else if (node.type === 'toc') {
      displayTitle = '目次'
    } else if (node.type === 'preamble') {
      displayTitle = '前文'
    }
  }
  if (useArabicNum && displayTitle) {
    displayTitle = convertToArabic(displayTitle)
  }

  const showInline = node.type === 'paragraph' || node.type === 'item' || node.type === 'subitem'

  const searchHighlight = isActiveSearchResult
    ? 'bg-amber-100 ring-2 ring-amber-400 rounded'
    : isSearchMatch
      ? 'bg-amber-50 ring-1 ring-amber-200 rounded'
      : ''

  return (
    <div id={`law-node-${node.id}`} style={{ paddingLeft: node.depth * INDENT_PX }}>
      <div
        className={`flex items-start gap-1 py-0.5 group rounded ${
          hasChildren ? 'cursor-pointer hover:brightness-95' : ''
        } ${tagBg} ${dimmed ? 'opacity-30' : ''} ${searchHighlight}`}
        onClick={() => hasChildren && toggleNode(node.id)}
      >
        {isTaggable && <TagPicker nodeId={node.id} />}
        {hasChildren ? (
          <span className="text-xs text-gray-400 mt-1 w-4 flex-shrink-0 select-none">
            {isExpanded ? '▼' : '▶'}
          </span>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {showInline ? (
            <div className="flex items-baseline gap-0">
              {displayTitle && (
                <span className="shrink-0 text-sm font-medium text-gray-700">
                  {textSearchQuery ? highlightText(displayTitle, textSearchQuery) : displayTitle}
                </span>
              )}
              {node.content && (
                <span className="text-sm text-gray-600">
                  {displayTitle ? '\u3000' : ''}
                  {textSearchQuery ? highlightText(node.content, textSearchQuery) : node.content}
                </span>
              )}
            </div>
          ) : (
            <>
              {displayTitle && (
                <span
                  className={`text-sm ${
                    isStructural
                      ? 'font-semibold text-gray-800'
                      : 'font-medium text-gray-700'
                  }`}
                >
                  {textSearchQuery ? highlightText(displayTitle, textSearchQuery) : displayTitle}
                </span>
              )}
              {node.content && (
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                  {textSearchQuery ? highlightText(node.content, textSearchQuery) : node.content}
                </p>
              )}
            </>
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
