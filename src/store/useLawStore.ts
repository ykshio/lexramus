import { create } from 'zustand'
import type { LawTreeNode, RevisionInfo, LawInfo, ExpandLevel } from '../types/law'
import type { LawType } from '../types/law'
import { searchLaws, getLawData } from '../api/client'
import { parseLawFullText } from '../lib/parser'

interface SearchResult {
  law_info: LawInfo
  revision_info: RevisionInfo
}

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
  expandLevel: ExpandLevel | null
  expandedNodes: Set<string>

  // アクション
  setSearchQuery: (query: string) => void
  setLawTypeFilter: (types: LawType[]) => void
  search: () => Promise<void>
  selectLaw: (lawId: string, title: string, lawNum: string) => Promise<void>
  setExpandLevel: (level: ExpandLevel) => void
  toggleNode: (nodeId: string) => void
}

// ノードタイプの深さ順序
const LEVEL_ORDER: ExpandLevel[] = [
  'part', 'chapter', 'section', 'subsection', 'division', 'article', 'paragraph',
]

function collectNodeIds(nodes: LawTreeNode[], upToLevel: ExpandLevel): Set<string> {
  const ids = new Set<string>()
  const levelIndex = LEVEL_ORDER.indexOf(upToLevel)

  function walk(node: LawTreeNode) {
    const nodeIndex = LEVEL_ORDER.indexOf(node.type as ExpandLevel)
    if (nodeIndex !== -1 && nodeIndex <= levelIndex) {
      ids.add(node.id)
    }
    for (const child of node.children) {
      walk(child)
    }
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

  expandLevel: null,
  expandedNodes: new Set(),

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
    set({
      selectedLawId: lawId,
      selectedLawTitle: title,
      selectedLawNum: lawNum,
      lawLoading: true,
      lawError: null,
      lawTree: [],
      expandedNodes: new Set(),
      expandLevel: null,
    })
    try {
      const res = await getLawData(lawId)
      const tree = parseLawFullText(res.law_full_text)
      // デフォルトで章レベルまで展開
      const expanded = collectNodeIds(tree, 'chapter')
      set({
        lawTree: tree,
        lawLoading: false,
        expandedNodes: expanded,
        expandLevel: 'chapter',
      })
    } catch (e) {
      set({
        lawError: e instanceof Error ? e.message : '法令の取得に失敗しました',
        lawLoading: false,
      })
    }
  },

  setExpandLevel: (level) => {
    const { lawTree } = get()
    const expanded = collectNodeIds(lawTree, level)
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
}))
