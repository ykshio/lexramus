import { create } from 'zustand'
import type { LawTreeNode, RevisionInfo, LawInfo, ExpandLevel } from '../types/law'
import type { LawType } from '../types/law'
import { searchLaws, getLawData, getLawRevisions } from '../api/client'
import { parseLawFullText } from '../lib/parser'

interface SearchResult {
  law_info: LawInfo
  revision_info: RevisionInfo
}

export type ViewMode = 'tree' | 'outline'

interface LawStore {
  // 検索
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

  // 表示設定
  viewMode: ViewMode
  expandLevel: ExpandLevel | null
  expandedNodes: Set<string>
  tocVisible: boolean
  useArabicNum: boolean

  // レスポンシブ
  searchPanelOpen: boolean

  // 時点指定
  asof: string | null
  revisions: RevisionInfo[]
  revisionsLoading: boolean

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

// 指定タイプのノードが「見える」ように、その親を全て展開する
// 指定タイプのノード自体は展開しない（子は見えない）
function collectExpandedIds(nodes: LawTreeNode[], targetType: ExpandLevel): Set<string> {
  const ids = new Set<string>()
  const targetOrder = TYPE_ORDER[targetType] ?? 99

  function walk(node: LawTreeNode): boolean {
    const nodeOrder = TYPE_ORDER[node.type] ?? 99

    // このノードが対象タイプなら、このノード自体は展開しない（見えるだけ）
    if (node.type === targetType) {
      return true // 親に「子孫に対象がいる」と伝える
    }

    // このノードが対象より深い場合、展開しない
    if (nodeOrder > targetOrder) {
      return false
    }

    // 子を走査して、子孫に対象タイプがあるか確認
    let hasTarget = false
    for (const child of node.children) {
      if (walk(child)) {
        hasTarget = true
      }
    }

    // 子孫に対象がいるなら、このノードを展開する
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

  viewMode: 'tree',
  expandLevel: null,
  expandedNodes: new Set(),
  tocVisible: false,
  useArabicNum: false,

  searchPanelOpen: true,

  asof: null,
  revisions: [],
  revisionsLoading: false,

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
      revisions: [],
    })
    try {
      const res = await getLawData(lawId, asof ?? undefined)
      const tree = parseLawFullText(res.law_full_text)
      const expanded = collectExpandedIds(tree, 'chapter')
      set({
        lawTree: tree,
        lawLoading: false,
        expandedNodes: expanded,
        expandLevel: 'chapter',
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
    const { lawTree } = get()
    const expanded = collectExpandedIds(lawTree, level)
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

  scrollToNode: (nodeId) => {
    const { lawTree, expandedNodes, viewMode } = get()
    if (viewMode === 'tree') {
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
