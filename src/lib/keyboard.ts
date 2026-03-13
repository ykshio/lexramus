import { useLawStore } from '../store/useLawStore'

export function setupKeyboardShortcuts() {
  function handler(e: KeyboardEvent) {
    // 入力中は無効
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

    const store = useLawStore.getState()

    switch (e.key) {
      case 't':
        // ツリー/アウトライン切替
        store.setViewMode(store.viewMode === 'tree' ? 'outline' : 'tree')
        break
      case 'c':
        // 目次トグル
        store.setTocVisible(!store.tocVisible)
        break
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7': {
        // 展開レベル: 1=編, 2=章, 3=節, 4=款, 5=目, 6=条, 7=項
        const levels = ['part', 'chapter', 'section', 'subsection', 'division', 'article', 'paragraph'] as const
        const idx = parseInt(e.key) - 1
        if (idx < levels.length && store.lawTree.length > 0) {
          store.setExpandLevel(levels[idx])
        }
        break
      }
      case '/':
        // 検索にフォーカス
        e.preventDefault()
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        searchInput?.focus()
        break
    }
  }

  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}
