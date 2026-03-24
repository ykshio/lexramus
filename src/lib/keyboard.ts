import { useLawStore } from '../store/useLawStore'

export function setupKeyboardShortcuts() {
  function handler(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    const isMod = e.metaKey || e.ctrlKey

    // Cmd+F / Ctrl+F: テキスト検索
    if (e.key === 'f' && isMod) {
      e.preventDefault()
      const store = useLawStore.getState()
      if (store.lawTree.length === 0) return
      if (store.isTextSearchOpen) {
        store.closeTextSearch()
      } else {
        store.openTextSearch()
      }
      return
    }

    // 入力中は他のショートカット無効
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

    // 修飾キー付きはブラウザデフォルト動作を優先（Cmd+C, Cmd+V 等）
    if (isMod) return

    const store = useLawStore.getState()

    switch (e.key) {
      case 't':
        // ビュー3種循環: list → diagram → outline → list
        if (store.viewMode === 'list') store.setViewMode('diagram')
        else if (store.viewMode === 'diagram') store.setViewMode('outline')
        else store.setViewMode('list')
        break
      case 'c':
        store.setTocVisible(!store.tocVisible)
        break
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7': {
        const levels = ['part', 'chapter', 'section', 'subsection', 'division', 'article', 'paragraph'] as const
        const idx = parseInt(e.key) - 1
        if (idx < levels.length && store.lawTree.length > 0) {
          store.setExpandLevel(levels[idx])
        }
        break
      }
      case '/':
        e.preventDefault()
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        searchInput?.focus()
        break
    }
  }

  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}
