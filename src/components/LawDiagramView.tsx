import { useRef, useEffect } from 'react'
import { useLawStore } from '../store/useLawStore'
import { useTagStore, TAG_COLORS } from '../store/useTagStore'
import { convertToArabic } from '../lib/kansuji'
import { highlightText } from '../lib/highlight'
import type { LawTreeNode, LawNodeType } from '../types/law'

const NODE_CENTER = 18
const MIN_NODE_WIDTH = 80
const MAX_NODE_WIDTH = 500
const NODE_CHROME = 24 // padding

const STRUCTURAL_TYPES: LawNodeType[] = [
  'part', 'chapter', 'section', 'subsection', 'division', 'suppl_provision',
]

// Canvas でテキスト幅を計測
let measureCtx: CanvasRenderingContext2D | null = null

function getTextWidth(text: string, bold: boolean): number {
  if (!measureCtx) {
    const canvas = document.createElement('canvas')
    measureCtx = canvas.getContext('2d')
  }
  if (!measureCtx) return text.length * 7
  measureCtx.font = `${bold ? 'bold ' : ''}13px system-ui, -apple-system, sans-serif`
  return measureCtx.measureText(text).width
}

// 兄弟ノード群の最大テキスト幅から共通幅を算出
function calculateSiblingWidth(children: LawTreeNode[]): number {
  let maxTextWidth = 0

  for (const child of children) {
    const displayText = child.title || child.content.slice(0, 40) || '...'
    const isStructural = STRUCTURAL_TYPES.includes(child.type)
    maxTextWidth = Math.max(maxTextWidth, getTextWidth(displayText, isStructural))
  }

  return Math.max(MIN_NODE_WIDTH, Math.min(MAX_NODE_WIDTH, Math.ceil(maxTextWidth + NODE_CHROME)))
}

function getNodeTagBg(lawId: string | null, nodeId: string): string {
  if (!lawId) return ''
  const tags = useTagStore.getState().getNodeTags(lawId, nodeId)
  if (tags.length === 0) return ''
  const color = TAG_COLORS.find((c) => c.id === tags[0])
  return color ? `${color.bg} border ${color.border}` : ''
}

function DiagramNode({ node, width }: { node: LawTreeNode; width: number }) {
  const { expandedNodes, toggleNode, selectedLawId, useArabicNum, textSearchQuery, textSearchResultIds, textSearchActiveIndex } = useLawStore()
  const isStructural = STRUCTURAL_TYPES.includes(node.type)
  const hasChildren = node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  const tagBg = getNodeTagBg(selectedLawId, node.id)
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

  const showContent = !isStructural && node.content && !displayTitle

  const searchHighlight = isActiveSearchResult
    ? 'ring-2 ring-amber-400 bg-amber-100'
    : isSearchMatch
      ? 'ring-1 ring-amber-200 bg-amber-50'
      : ''

  return (
    <div
      id={`law-node-${node.id}`}
      className={`
        px-2 py-1 rounded-lg text-xs cursor-pointer select-none truncate
        transition-colors min-h-[36px] flex items-center gap-1
        ${isStructural ? 'font-semibold text-gray-800 bg-gray-100 border border-gray-200' : 'text-gray-600 bg-white border border-gray-200'}
        ${hasChildren ? 'hover:bg-gray-50' : ''}
        ${tagBg}
        ${searchHighlight}
      `}
      style={{ width: `${width}px` }}
      onClick={() => hasChildren && toggleNode(node.id)}
      title={displayTitle || node.content.slice(0, 100)}
    >
      <span className="truncate flex-1">
        {textSearchQuery && displayTitle
          ? highlightText(displayTitle, textSearchQuery)
          : displayTitle || (showContent ? (textSearchQuery ? highlightText(node.content.slice(0, 40), textSearchQuery) : node.content.slice(0, 40)) : '...')}
      </span>
      {hasChildren && (
        <svg
          className={`w-3 h-3 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </div>
  )
}

function BranchConnector({ index, total }: { index: number; total: number }) {
  const isFirst = index === 0
  const isLast = index === total - 1
  const isOnly = total === 1

  return (
    <div className="relative shrink-0" style={{ width: '20px', minHeight: '36px' }}>
      {/* 縦線 */}
      {!isOnly && (
        <div
          className="absolute left-0 border-l border-gray-300"
          style={
            isFirst
              ? { top: `${NODE_CENTER}px`, bottom: 0 }
              : isLast
                ? { top: 0, height: `${NODE_CENTER}px` }
                : { top: 0, bottom: 0 }
          }
        />
      )}

      {/* 横線 */}
      <div
        className="absolute left-0 border-t border-gray-300"
        style={{ top: `${NODE_CENTER}px`, right: '5px' }}
      />

      {/* 矢印 */}
      <svg
        className="absolute"
        style={{ right: 0, top: `${NODE_CENTER - 4}px` }}
        width="5"
        height="8"
        viewBox="0 0 5 8"
      >
        <path d="M0 0L5 4L0 8Z" fill="#94a3b8" />
      </svg>
    </div>
  )
}

function TreeBranch({ node, width }: { node: LawTreeNode; width: number }) {
  const expandedNodes = useLawStore((s) => s.expandedNodes)
  const hasChildren = node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)

  const childWidth = hasChildren ? calculateSiblingWidth(node.children) : 0

  return (
    <div className="flex items-start">
      <div className="shrink-0 relative">
        <DiagramNode node={node} width={width} />
      </div>

      {hasChildren && isExpanded && (
        <div className="flex items-start">
          {/* 親→分岐への水平コネクタ */}
          <div className="relative shrink-0" style={{ width: '16px', minHeight: '36px' }}>
            <div
              className="absolute left-0 right-0 border-t border-gray-300"
              style={{ top: `${NODE_CENTER}px` }}
            />
          </div>

          {/* 分岐カラム */}
          <div className="flex flex-col">
            {node.children.map((child, i, arr) => (
              <div key={child.id} className="flex items-stretch">
                <BranchConnector index={i} total={arr.length} />
                <TreeBranch node={child} width={childWidth} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function LawDiagramView() {
  const { lawTree, lawLoading, lawError, selectedLawTitle, zoomLevel, setZoomLevel } = useLawStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Ctrl+ホイール / ピンチでズーム
  const zoomRef = useRef(zoomLevel)
  zoomRef.current = zoomLevel
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = -e.deltaY * 0.002
        setZoomLevel(Math.max(0.25, Math.min(3, zoomRef.current + delta)))
      }
    }
    let lastScale = 1
    const handleGestureStart = (e: Event) => {
      e.preventDefault()
      lastScale = 1
    }
    const handleGestureChange = (e: Event) => {
      e.preventDefault()
      const ge = e as Event & { scale: number }
      const ratio = ge.scale / lastScale
      lastScale = ge.scale
      setZoomLevel(Math.max(0.25, Math.min(3, zoomRef.current * ratio)))
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('gesturestart', handleGestureStart, { passive: false })
    el.addEventListener('gesturechange', handleGestureChange, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('gesturestart', handleGestureStart)
      el.removeEventListener('gesturechange', handleGestureChange)
    }
  }, [setZoomLevel])

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

  const rootWidth = calculateSiblingWidth(lawTree)

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto p-6">
      <div
        className="min-w-max"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top left',
        }}
      >
        {lawTree.map((node) => (
          <div key={node.id} className="mb-4">
            <TreeBranch node={node} width={rootWidth} />
          </div>
        ))}
      </div>
    </div>
  )
}
