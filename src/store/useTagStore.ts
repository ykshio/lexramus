import { create } from 'zustand'

export interface TagColor {
  id: string
  label: string
  bg: string      // Tailwind bg class
  border: string   // Tailwind border class
  dot: string      // Tailwind bg class for dot
}

export const TAG_COLORS: TagColor[] = [
  { id: 'red', label: '赤', bg: 'bg-red-100', border: 'border-red-300', dot: 'bg-red-400' },
  { id: 'orange', label: '橙', bg: 'bg-orange-100', border: 'border-orange-300', dot: 'bg-orange-400' },
  { id: 'yellow', label: '黄', bg: 'bg-yellow-100', border: 'border-yellow-300', dot: 'bg-yellow-400' },
  { id: 'green', label: '緑', bg: 'bg-green-100', border: 'border-green-300', dot: 'bg-green-400' },
  { id: 'blue', label: '青', bg: 'bg-blue-100', border: 'border-blue-300', dot: 'bg-blue-400' },
  { id: 'purple', label: '紫', bg: 'bg-purple-100', border: 'border-purple-300', dot: 'bg-purple-400' },
]

const STORAGE_KEY = 'lexramus-tags'

// lawId -> nodeId -> colorId[]
type TagData = Record<string, Record<string, string[]>>

interface TagStore {
  tags: TagData
  activeFilter: string | null

  getNodeTags: (lawId: string, nodeId: string) => string[]
  toggleTag: (lawId: string, nodeId: string, colorId: string) => void
  setActiveFilter: (colorId: string | null) => void
  hasTag: (lawId: string, nodeId: string, colorId: string) => boolean
}

function loadTags(): TagData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveTags(tags: TagData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags))
}

export const useTagStore = create<TagStore>((set, get) => ({
  tags: loadTags(),
  activeFilter: null,

  getNodeTags: (lawId, nodeId) => {
    return get().tags[lawId]?.[nodeId] ?? []
  },

  toggleTag: (lawId, nodeId, colorId) => {
    const { tags } = get()
    const next = { ...tags }
    if (!next[lawId]) next[lawId] = {}
    const current = next[lawId][nodeId] ?? []

    if (current.includes(colorId)) {
      // 同じ色なら解除
      delete next[lawId][nodeId]
      if (Object.keys(next[lawId]).length === 0) delete next[lawId]
    } else {
      // 単一選択: 置き換え
      next[lawId][nodeId] = [colorId]
    }

    saveTags(next)
    set({ tags: next })
  },

  setActiveFilter: (colorId) => set({ activeFilter: colorId }),

  hasTag: (lawId, nodeId, colorId) => {
    return get().tags[lawId]?.[nodeId]?.includes(colorId) ?? false
  },
}))
