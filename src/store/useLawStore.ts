import { create } from 'zustand'
import type { LawTreeNode, LawNodeType, RevisionInfo, LawInfo, ExpandLevel } from '../types/law'
import type { LawType } from '../types/law'
import { searchLaws, getLawData, getLawRevisions } from '../api/client'
import { parseLawFullText } from '../lib/parser'

interface SearchResult {
  law_info: LawInfo
  revision_info: RevisionInfo
}

export type ViewMode = 'list' | 'diagram' | 'outline'

interface LawStore {
  // 法令検索
  searchQuery: string
  searchResults: SearchResult[]
  searchLoading: boolean
  searchError: string | null
  searchTotal: number
  lawTypeFilter: LawType[]

  // 法令表示
  selectedLawId: string | null
  selectedLawTitle: string | null
  selectedLawNum: string | null
  lawTree: LawTreeNode[]
  lawLoading: boolean
  lawError: string | null
  availableTypes: Set<LawNodeType>

  // 表示設定
  viewMode: ViewMode
  expandLevel: ExpandLevel | null
  expandedNodes: Set<string>
  tocVisible: boolean
  useArabicNum: boolean
  zoomLevel: number

  // レスポンシブ
  searchPanelOpen: boolean

  // 時点指定
  asof: string | null
  revisions: RevisionInfo[]
  revisionsLoading: boolean

  // ツリー内テキスト検索
  isTextSearchOpen: boolean
  textSearchQuery: string
  textSearchResultIds: string[]
  textSearchActiveIndex: number

  // アクション
  setSearchQuery: (query: string) => void
  setLawTypeFilter: (types: LawType[]) => void
  search: () => Promise<void>
  selectLaw: (lawId: string, title: string, lawNum: string) => Promise<void>
  setExpandLevel: (level: ExpandLevel) => void
  toggleNode: (nodeId: string) => void
  setViewMode: (mode: ViewMode) => void
  setTocVisible: (visible: boolean) => void
  scrollToNode: (nodeId: string) => void
  setAsof: (date: string | null) => void
  loadRevisions: () => Promise<void>
  setSearchPanelOpen: (open: boolean) => void
  toggleArabicNum: () => void
  setZoomLevel: (level: number) => void

  // テキスト検索アクション
  openTextSearch: () => void
  closeTextSearch: () => void
  setTextSearchQuery: (query: string) => void
  goToNextTextResult: () => void
  goToPrevTextResult: () => void
}

// 階層の順序（浅い→深い）
const TYPE_ORDER: Record<string, number> = {
  toc: 0,
  preamble: 0,
  part: 1,
  chapter: 2,
  section: 3,
  subsection: 4,
  division: 5,
  article: 6,
  paragraph: 7,
  item: 8,
  subitem: 9,
  suppl_provision: 1,
}

// 展開レベルの順序（フォールバック用）
const LEVEL_FALLBACK_ORDER: ExpandLevel[] = [
  'part', 'chapter', 'section', 'subsection', 'division', 'article', 'paragraph', 'item', 'subitem',
]

// ツリー内の全ノードタイプを収集
function collectAvailableTypes(nodes: LawTreeNode[]): Set<LawNodeType> {
  const types = new Set<LawNodeType>()
  function walk(node: LawTreeNode) {
    types.add(node.type)
    for (const child of node.children) walk(child)
  }
  for (const n of nodes) walk(n)
  return types
}

// 指定タイプのノードが「見える」ように、その親を全て展開する
// 指定タイプのノード自体は展開しない（子は見えない）
function collectExpandedIds(nodes: LawTreeNode[], targetType: ExpandLevel): Set<string> {
  const ids = new Set<string>()

  // 一覧: 条(article)より上の階層を無条件で全展開
  if (targetType === 'list') {
    const articleOrder = TYPE_ORDER['article'] ?? 99
    function walkList(node: LawTreeNode) {
      const nodeOrder = TYPE_ORDER[node.type] ?? 99
      if (nodeOrder < articleOrder && node.children.length > 0) {
        ids.add(node.id)
        for (const child of node.children) walkList(child)
      }
    }
    for (const node of nodes) walkList(node)
    return ids
  }

  // 全展開: 子を持つ全ノードを展開
  if (targetType === 'all') {
    function walkAll(node: LawTreeNode) {
      if (node.children.length > 0) ids.add(node.id)
      for (const child of node.children) walkAll(child)
    }
    for (const node of nodes) walkAll(node)
    return ids
  }

  const targetOrder = TYPE_ORDER[targetType] ?? 99

  function walk(node: LawTreeNode): boolean {
    const nodeOrder = TYPE_ORDER[node.type] ?? 99

    if (node.type === targetType) {
      return true
    }

    if (nodeOrder > targetOrder) {
      return false
    }

    let hasTarget = false
    for (const child of node.children) {
      if (walk(child)) {
        hasTarget = true
      }
    }

    if (hasTarget) {
      ids.add(node.id)
    }

    return hasTarget
  }

  for (const node of nodes) {
    walk(node)
  }
  return ids
}

// 指定タイプが存在しない場合、1つ上のレベルにフォールバック
function resolveExpandLevel(targetType: ExpandLevel, availableTypes: Set<LawNodeType>): ExpandLevel {
  if (targetType === 'all' || targetType === 'list') return targetType
  const idx = LEVEL_FALLBACK_ORDER.indexOf(targetType)
  if (idx < 0) return targetType

  // 指定レベルが存在すればそのまま
  if (availableTypes.has(targetType as LawNodeType)) return targetType

  // 上のレベルへフォールバック
  for (let i = idx - 1; i >= 0; i--) {
    if (availableTypes.has(LEVEL_FALLBACK_ORDER[i] as LawNodeType)) {
      return LEVEL_FALLBACK_ORDER[i]
    }
  }

  return 'chapter' // 最終フォールバック
}

// テキスト検索: ツリーを全走査してクエリに一致するノードIDを収集
function performTextSearch(nodes: LawTreeNode[], query: string): string[] {
  if (!query) return []
  const lowerQuery = query.toLowerCase()
  const results: string[] = []

  function walk(node: LawTreeNode) {
    const titleMatch = node.title.toLowerCase().includes(lowerQuery)
    const contentMatch = node.content.toLowerCase().includes(lowerQuery)
    if (titleMatch || contentMatch) {
      results.push(node.id)
    }
    for (const child of node.children) walk(child)
  }

  for (const n of nodes) walk(n)
  return results
}

export const useLawStore = create<LawStore>((set, get) => ({
  searchQuery: '',
  searchResults: [],
  searchLoading: false,
  searchError: null,
  searchTotal: 0,
  lawTypeFilter: [],

  selectedLawId: null,
  selectedLawTitle: null,
  selectedLawNum: null,
  lawTree: [],
  lawLoading: false,
  lawError: null,
  availableTypes: new Set(),

  viewMode: 'list',
  expandLevel: null,
  expandedNodes: new Set(),
  tocVisible: false,
  useArabicNum: false,
  zoomLevel: 1,

  searchPanelOpen: true,

  asof: null,
  revisions: [],
  revisionsLoading: false,

  isTextSearchOpen: false,
  textSearchQuery: '',
  textSearchResultIds: [],
  textSearchActiveIndex: -1,

  setSearchQuery: (query) => set({ searchQuery: query }),

  setLawTypeFilter: (types) => set({ lawTypeFilter: types }),

  search: async () => {
    const { searchQuery, lawTypeFilter } = get()
    if (!searchQuery.trim()) return

    set({ searchLoading: true, searchError: null })
    try {
      const res = await searchLaws({
        law_title: searchQuery,
        law_type: lawTypeFilter.length ? lawTypeFilter : undefined,
        limit: 50,
      })
      set({
        searchResults: res.laws.map((l) => ({
          law_info: l.law_info,
          revision_info: l.revision_info,
        })),
        searchTotal: res.total_count,
        searchLoading: false,
      })
    } catch (e) {
      set({
        searchError: e instanceof Error ? e.message : '検索に失敗しました',
        searchLoading: false,
      })
    }
  },

  selectLaw: async (lawId, title, lawNum) => {
    const { asof } = get()
    set({
      selectedLawId: lawId,
      selectedLawTitle: title,
      selectedLawNum: lawNum,
      lawLoading: true,
      lawError: null,
      lawTree: [],
      expandedNodes: new Set(),
      expandLevel: null,
      availableTypes: new Set(),
      revisions: [],
    })
    try {
      const res = await getLawData(lawId, asof ?? undefined)
      const tree = parseLawFullText(res.law_full_text)
      const available = collectAvailableTypes(tree)
      const expanded = collectExpandedIds(tree, 'chapter')
      set({
        lawTree: tree,
        lawLoading: false,
        expandedNodes: expanded,
        expandLevel: 'chapter',
        availableTypes: available,
      })
      get().loadRevisions()
    } catch (e) {
      set({
        lawError: e instanceof Error ? e.message : '法令の取得に失敗しました',
        lawLoading: false,
      })
    }
  },

  setExpandLevel: (level) => {
    const { lawTree, availableTypes } = get()
    const resolved = resolveExpandLevel(level, availableTypes)
    const expanded = collectExpandedIds(lawTree, resolved)
    set({ expandLevel: level, expandedNodes: expanded })
  },

  toggleNode: (nodeId) => {
    const { expandedNodes } = get()
    const next = new Set(expandedNodes)
    if (next.has(nodeId)) {
      next.delete(nodeId)
    } else {
      next.add(nodeId)
    }
    set({ expandedNodes: next, expandLevel: null })
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  setTocVisible: (visible) => set({ tocVisible: visible }),

  setAsof: (date) => {
    set({ asof: date })
    const { selectedLawId, selectedLawTitle, selectedLawNum } = get()
    if (selectedLawId && selectedLawTitle && selectedLawNum) {
      get().selectLaw(selectedLawId, selectedLawTitle, selectedLawNum)
    }
  },

  loadRevisions: async () => {
    const { selectedLawId } = get()
    if (!selectedLawId) return
    set({ revisionsLoading: true })
    try {
      const res = await getLawRevisions(selectedLawId)
      set({ revisions: res.revisions, revisionsLoading: false })
    } catch {
      set({ revisionsLoading: false })
    }
  },

  setSearchPanelOpen: (open) => set({ searchPanelOpen: open }),

  toggleArabicNum: () => set((s) => ({ useArabicNum: !s.useArabicNum })),

  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.25, Math.min(3, level)) }),

  // テキスト検索
  openTextSearch: () => set({ isTextSearchOpen: true }),

  closeTextSearch: () => set({
    isTextSearchOpen: false,
    textSearchQuery: '',
    textSearchResultIds: [],
    textSearchActiveIndex: -1,
  }),

  setTextSearchQuery: (query) => {
    const { lawTree } = get()
    const results = performTextSearch(lawTree, query)
    set({
      textSearchQuery: query,
      textSearchResultIds: results,
      textSearchActiveIndex: results.length > 0 ? 0 : -1,
    })
    // 最初の結果にスクロール
    if (results.length > 0) {
      get().scrollToNode(results[0])
    }
  },

  goToNextTextResult: () => {
    const { textSearchResultIds, textSearchActiveIndex } = get()
    if (textSearchResultIds.length === 0) return
    const next = (textSearchActiveIndex + 1) % textSearchResultIds.length
    set({ textSearchActiveIndex: next })
    get().scrollToNode(textSearchResultIds[next])
  },

  goToPrevTextResult: () => {
    const { textSearchResultIds, textSearchActiveIndex } = get()
    if (textSearchResultIds.length === 0) return
    const prev = (textSearchActiveIndex - 1 + textSearchResultIds.length) % textSearchResultIds.length
    set({ textSearchActiveIndex: prev })
    get().scrollToNode(textSearchResultIds[prev])
  },

  scrollToNode: (nodeId) => {
    const { lawTree, expandedNodes, viewMode } = get()
    if (viewMode === 'list' || viewMode === 'diagram') {
      const path = findNodePath(lawTree, nodeId)
      if (path) {
        const next = new Set(expandedNodes)
        for (const n of path) {
          next.add(n.id)
        }
        set({ expandedNodes: next, expandLevel: null })
      }
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(`law-node-${nodeId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  },
}))

function findNodePath(nodes: LawTreeNode[], targetId: string): LawTreeNode[] | null {
  for (const node of nodes) {
    if (node.id === targetId) return [node]
    const childPath = findNodePath(node.children, targetId)
    if (childPath) return [node, ...childPath]
  }
  return null
}
