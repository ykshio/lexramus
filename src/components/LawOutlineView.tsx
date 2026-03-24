import { useLawStore } from '../store/useLawStore'
import { useTagStore, TAG_COLORS } from '../store/useTagStore'
import { TagPicker } from './TagPicker'
import { RubyText } from '../lib/rubyText'
import type { LawTreeNode, LawNodeType } from '../types/law'

const STRUCTURAL_TYPES: LawNodeType[] = [
  'part', 'chapter', 'section', 'subsection', 'division', 'suppl_provision',
]

const TAGGABLE_TYPES: LawNodeType[] = [
  'article', 'paragraph', 'item', 'subitem',
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

function getTagBgClass(lawId: string | null, nodeId: string): string {
  if (!lawId) return ''
  const tags = useTagStore.getState().getNodeTags(lawId, nodeId)
  if (tags.length === 0) return ''
  const color = TAG_COLORS.find((c) => c.id === tags[0])
  return color ? color.bg : ''
}

function OutlineNode({ node }: { node: LawTreeNode }) {
  const selectedLawId = useLawStore((s) => s.selectedLawId)
  const useArabicNum = useLawStore((s) => s.useArabicNum)
  const bracketMode = useLawStore((s) => s.bracketMode)
  const textSearchQuery = useLawStore((s) => s.textSearchQuery)
  const textSearchResultIds = useLawStore((s) => s.textSearchResultIds)
  const textSearchActiveIndex = useLawStore((s) => s.textSearchActiveIndex)
  const activeFilter = useTagStore((s) => s.activeFilter)
  const tags = useTagStore((s) => selectedLawId ? s.tags[selectedLawId]?.[node.id] : undefined)
  const isStructural = STRUCTURAL_TYPES.includes(node.type)
  const isTaggable = TAGGABLE_TYPES.includes(node.type)
  const dimmed = activeFilter && (!tags || !tags.includes(activeFilter))
  const tagBg = getTagBgClass(selectedLawId, node.id)
  const sq = textSearchQuery || undefined
  const isSearchMatch = textSearchResultIds.includes(node.id)
  const isActiveSearchResult = isSearchMatch && textSearchResultIds[textSearchActiveIndex] === node.id
  const searchHighlight = isActiveSearchResult
    ? 'ring-2 ring-amber-400 bg-amber-100'
    : isSearchMatch
      ? 'ring-1 ring-amber-200'
      : ''

  if (node.type === 'toc') return null

  if (isStructural) {
    const style = DEPTH_STYLES[node.depth] ?? 'text-sm font-medium text-gray-600 mt-2'
    return (
      <div id={`law-node-${node.id}`} className={`${style} ${searchHighlight} ${dimmed ? 'opacity-30' : ''}`}>
        <RubyText segments={node.richTitle} searchQuery={sq} arabicNum={useArabicNum} bracketMode={bracketMode} />
      </div>
    )
  }

  if (node.type === 'article') {
    return (
      <div id={`law-node-${node.id}`} className={`mt-3 mb-1 group flex items-start gap-1 ${tagBg} ${searchHighlight} ${dimmed ? 'opacity-30' : ''}`}>
        {isTaggable && <TagPicker nodeId={node.id} />}
        <div className="flex-1">
          <span className="text-sm font-semibold text-gray-800">
            <RubyText segments={node.richTitle} searchQuery={sq} arabicNum={useArabicNum} bracketMode={bracketMode} />
          </span>
          {node.richContent.length > 0 && (
            <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">
              <RubyText segments={node.richContent} searchQuery={sq} bracketMode={bracketMode} />
            </p>
          )}
        </div>
      </div>
    )
  }

  if (node.type === 'paragraph') {
    const hasTitle = node.richTitle.length > 0
    return (
      <div id={`law-node-${node.id}`} className={`mt-0.5 group flex items-start gap-1 ${tagBg} ${searchHighlight} ${dimmed ? 'opacity-30' : ''}`}>
        {isTaggable && <TagPicker nodeId={node.id} />}
        {hasTitle ? (
          <div className="flex items-baseline gap-0 text-sm text-gray-600 leading-relaxed flex-1">
            <span className="shrink-0 font-medium"><RubyText segments={node.richTitle} searchQuery={sq} bracketMode={bracketMode} /></span>
            {node.richContent.length > 0 && <span>{'\u3000'}<RubyText segments={node.richContent} searchQuery={sq} bracketMode={bracketMode} /></span>}
          </div>
        ) : (
          <div className="text-sm text-gray-600 leading-relaxed flex-1" style={{ paddingLeft: '1em', textIndent: '1em' }}>
            {node.richContent.length > 0 && <RubyText segments={node.richContent} searchQuery={sq} bracketMode={bracketMode} />}
          </div>
        )}
      </div>
    )
  }

  if (node.type === 'item') {
    const hasTitle = node.richTitle.length > 0
    return (
      <div id={`law-node-${node.id}`} className={`ml-4 mt-0.5 group flex items-start gap-1 ${tagBg} ${searchHighlight} ${dimmed ? 'opacity-30' : ''}`}>
        {isTaggable && <TagPicker nodeId={node.id} />}
        <div className="flex items-baseline gap-0 text-sm text-gray-600 flex-1">
          {hasTitle && <span className="shrink-0 font-medium"><RubyText segments={node.richTitle} searchQuery={sq} bracketMode={bracketMode} /></span>}
          {node.richContent.length > 0 && <span>{hasTitle ? '\u3000' : ''}<RubyText segments={node.richContent} searchQuery={sq} bracketMode={bracketMode} /></span>}
        </div>
      </div>
    )
  }

  if (node.type === 'subitem') {
    const hasTitle = node.richTitle.length > 0
    return (
      <div id={`law-node-${node.id}`} className={`ml-8 mt-0.5 group flex items-start gap-1 ${tagBg} ${searchHighlight} ${dimmed ? 'opacity-30' : ''}`}>
        {isTaggable && <TagPicker nodeId={node.id} />}
        <div className="flex items-baseline gap-0 text-sm text-gray-600 flex-1">
          {hasTitle && <span className="shrink-0 font-medium"><RubyText segments={node.richTitle} searchQuery={sq} bracketMode={bracketMode} /></span>}
          {node.richContent.length > 0 && <span>{hasTitle ? '\u3000' : ''}<RubyText segments={node.richContent} searchQuery={sq} bracketMode={bracketMode} /></span>}
        </div>
      </div>
    )
  }

  if (node.type === 'preamble' && node.richContent.length > 0) {
    return (
      <div id={`law-node-${node.id}`} className={`mt-3 mb-2 ${searchHighlight} ${dimmed ? 'opacity-30' : ''}`}>
        <p className="text-sm text-gray-600 leading-relaxed">
          <RubyText segments={node.richContent} searchQuery={sq} bracketMode={bracketMode} />
        </p>
      </div>
    )
  }

  return null
}

export function LawOutlineView() {
  const { lawTree, lawLoading, lawError, selectedLawTitle, selectedLawNum } = useLawStore()

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
      <div className="mb-4">
        <h1 className="text-base font-bold text-gray-800">{selectedLawTitle}</h1>
        {selectedLawNum && <p className="text-xs text-gray-500 mt-0.5">{selectedLawNum}</p>}
      </div>
      {flat.map((node) => (
        <OutlineNode key={node.id} node={node} />
      ))}
    </div>
  )
}
