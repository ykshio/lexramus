import { useState } from 'react'
import { useLawStore } from '../store/useLawStore'
import { useTagStore, TAG_COLORS } from '../store/useTagStore'
import { TagPicker } from './TagPicker'
import { LawPopup } from './LawPopup'
import { RubyText } from '../lib/rubyText'
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
  return color ? color.bg : ''
}

function RefLinkPopup({ node, depth }: { node: LawTreeNode; depth: number }) {
  const [showPopup, setShowPopup] = useState(false)
  const { refTarget } = node
  if (!refTarget) return null

  return (
    <div id={`law-node-${node.id}`} style={{ paddingLeft: depth * INDENT_PX }}>
      <div className="relative inline-block">
        <div
          className="flex items-center gap-1 py-0.5 cursor-pointer text-blue-600 hover:text-blue-800 hover:underline text-sm"
          onClick={() => setShowPopup(!showPopup)}
        >
          <span className="w-4 flex-shrink-0" />
          <span>{node.title}</span>
        </div>
        {showPopup && (
          <LawPopup
            lawId={refTarget.lawId}
            lawTitle={refTarget.lawTitle}
            lawNum={refTarget.lawNum}
            targetNodeId={refTarget.nodeId}
            onClose={() => setShowPopup(false)}
          />
        )}
      </div>
    </div>
  )
}

function TreeNode({ node }: { node: LawTreeNode }) {
  const { expandedNodes, toggleNode, selectedLawId, useArabicNum, bracketMode, textSearchQuery, textSearchResultIds, textSearchActiveIndex } = useLawStore()
  const activeFilter = useTagStore((s) => s.activeFilter)
  const tags = useTagStore((s) => selectedLawId ? s.tags[selectedLawId]?.[node.id] : undefined)

  if (node.type === 'toc') return null

  // ref_link ノード: ポップアッププレビュー
  if (node.type === 'ref_link' && node.refTarget) {
    return <RefLinkPopup node={node} depth={node.depth} />
  }

  const hasChildren = node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  const isStructural = STRUCTURAL_TYPES.includes(node.type)
  const isTaggable = TAGGABLE_TYPES.includes(node.type)

  const dimmed = activeFilter && (!tags || !tags.includes(activeFilter))
  const tagBg = getTagBgClass(selectedLawId, node.id)

  // テキスト検索ハイライト
  const isSearchMatch = textSearchResultIds.includes(node.id)
  const isActiveSearchResult = isSearchMatch && textSearchResultIds[textSearchActiveIndex] === node.id

  // ルビ付きタイトル（特殊フォールバック対応）
  let richTitle = node.richTitle
  const hasTitle = node.title.length > 0 || richTitle.length > 0
  if (!hasTitle) {
    if (node.type === 'preamble') {
      richTitle = ['前文']
    }
  }
  const showTitle = richTitle.length > 0 && !(node.type === 'paragraph' && node.num === '1' && !node.title)

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
            !showTitle && node.type === 'paragraph' ? (
              node.richContent.length > 0 && (
                <div className="text-sm text-gray-600" style={{ paddingLeft: '1em', textIndent: '1em' }}>
                  <RubyText segments={node.richContent} searchQuery={textSearchQuery} arabicNum={useArabicNum} bracketMode={bracketMode} />
                </div>
              )
            ) : (
            <div className="flex items-baseline gap-0">
              {showTitle && (
                <span className="shrink-0 text-sm font-medium text-gray-700">
                  <RubyText segments={richTitle} searchQuery={textSearchQuery} arabicNum={useArabicNum} />
                </span>
              )}
              {node.richContent.length > 0 && (
                <span className="text-sm text-gray-600">
                  {showTitle ? '\u3000' : ''}
                  <RubyText segments={node.richContent} searchQuery={textSearchQuery} arabicNum={useArabicNum} bracketMode={bracketMode} />
                </span>
              )}
            </div>
            )
          ) : (
            <>
              {showTitle && (
                <span
                  className={`text-sm ${
                    isStructural
                      ? 'font-semibold text-gray-800'
                      : 'font-medium text-gray-700'
                  }`}
                >
                  <RubyText segments={richTitle} searchQuery={textSearchQuery} arabicNum={useArabicNum} />
                </span>
              )}
              {node.richContent.length > 0 && (
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
                  <RubyText segments={node.richContent} searchQuery={textSearchQuery} arabicNum={useArabicNum} bracketMode={bracketMode} />
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
  const { lawTree, lawLoading, lawError, selectedLawTitle, selectedLawNum, relatedLawsLoading } = useLawStore()

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
      <div className="mb-3">
        <h1 className="text-base font-bold text-gray-800">
          {selectedLawTitle}{selectedLawNum && <span className="text-xs font-normal text-gray-500 ml-1">（{selectedLawNum}）</span>}
        </h1>
      </div>
      {lawTree.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
      {relatedLawsLoading && (
        <p className="text-xs text-gray-400 mt-4">関連法令を読み込み中...</p>
      )}
    </div>
  )
}
