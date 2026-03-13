import { useEffect } from 'react'
import { SearchPanel } from './components/SearchPanel'
import { ExpandToolbar } from './components/ExpandToolbar'
import { LawTreeView } from './components/LawTreeView'
import { LawOutlineView } from './components/LawOutlineView'
import { TocPanel } from './components/TocPanel'
import { DatePicker } from './components/DatePicker'
import { StatusBar } from './components/StatusBar'
import { useLawStore } from './store/useLawStore'
import { syncUrlToState, updateUrl } from './lib/url'
import { setupKeyboardShortcuts } from './lib/keyboard'

function App() {
  const viewMode = useLawStore((s) => s.viewMode)
  const selectedLawId = useLawStore((s) => s.selectedLawId)
  const asof = useLawStore((s) => s.asof)
  const searchPanelOpen = useLawStore((s) => s.searchPanelOpen)
  const setSearchPanelOpen = useLawStore((s) => s.setSearchPanelOpen)

  useEffect(() => {
    syncUrlToState()
  }, [])

  useEffect(() => {
    updateUrl()
  }, [selectedLawId, asof])

  useEffect(() => {
    return setupKeyboardShortcuts()
  }, [])

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* ヘッダー */}
      <div className="flex items-center px-3 py-2 border-b border-gray-200 bg-white gap-2 flex-shrink-0">
        {/* モバイル: 検索パネルトグル */}
        <button
          onClick={() => setSearchPanelOpen(!searchPanelOpen)}
          className="md:hidden text-gray-500 hover:text-gray-700 text-lg w-7 h-7 flex items-center justify-center"
        >
          {searchPanelOpen ? '✕' : '☰'}
        </button>
        <img src={import.meta.env.BASE_URL + 'icon.png'} alt="LexRamus" className="w-6 h-6" />
        <span className="text-sm font-semibold text-gray-800 hidden sm:inline">LexRamus</span>
        <div className="flex-1" />
        {selectedLawId && <DatePicker />}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* モバイル: オーバーレイ背景 */}
        {searchPanelOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-10"
            onClick={() => setSearchPanelOpen(false)}
          />
        )}

        {/* 検索パネル */}
        <div className={`
          ${searchPanelOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:relative z-20 md:z-0
          w-72 flex-shrink-0 h-full bg-white
          transition-transform duration-200 ease-in-out
          border-r border-gray-200
        `}>
          <SearchPanel />
        </div>

        {/* 目次パネル */}
        <TocPanel />

        {/* メインエリア */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <ExpandToolbar />
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'tree' ? <LawTreeView /> : <LawOutlineView />}
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  )
}

export default App
