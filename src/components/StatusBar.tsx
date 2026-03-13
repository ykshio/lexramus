import { useLawStore } from '../store/useLawStore'

export function StatusBar() {
  const { selectedLawTitle, selectedLawNum, asof, searchPanelOpen, setSearchPanelOpen } = useLawStore()

  return (
    <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex-shrink-0 flex items-center gap-2">
      <button
        onClick={() => setSearchPanelOpen(!searchPanelOpen)}
        className="md:hidden text-gray-500 hover:text-gray-700"
      >
        {searchPanelOpen ? '✕' : '☰'}
      </button>
      <div className="flex-1">
        {selectedLawTitle ? (
          <span>
            {selectedLawTitle}（{selectedLawNum}）
            {asof && <span className="ml-2 text-blue-500">時点: {asof}</span>}
          </span>
        ) : (
          <span>LexRamus - 法令ビューアー</span>
        )}
      </div>
      <span className="hidden md:inline text-gray-300">
        / 検索 | t ビュー切替 | c 目次 | 1-7 展開
      </span>
    </div>
  )
}
