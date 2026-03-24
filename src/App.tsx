import { useEffect, useState, useRef } from 'react'
import { SearchPanel } from './components/SearchPanel'
import { ExpandToolbar } from './components/ExpandToolbar'
import { LawTreeView } from './components/LawTreeView'
import { LawOutlineView } from './components/LawOutlineView'
import { LawDiagramView } from './components/LawDiagramView'
import { LawSearchBar } from './components/LawSearchBar'
import { TocPanel } from './components/TocPanel'
import { DatePicker } from './components/DatePicker'
import { StatusBar } from './components/StatusBar'
import { useLawStore } from './store/useLawStore'
import { syncUrlToState, updateUrl } from './lib/url'
import { setupKeyboardShortcuts } from './lib/keyboard'
import { exportAsOpml, exportAsScrapbox, downloadAsFile } from './lib/export'

function App() {
  const viewMode = useLawStore((s) => s.viewMode)
  const selectedLawId = useLawStore((s) => s.selectedLawId)
  const asof = useLawStore((s) => s.asof)
  const searchPanelOpen = useLawStore((s) => s.searchPanelOpen)
  const setSearchPanelOpen = useLawStore((s) => s.setSearchPanelOpen)
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [copyDone, setCopyDone] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    syncUrlToState()
  }, [])

  useEffect(() => {
    updateUrl()
  }, [selectedLawId, asof])

  useEffect(() => {
    return setupKeyboardShortcuts()
  }, [])

  // ファイルメニュー外側クリックで閉じる
  useEffect(() => {
    if (!fileMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setFileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [fileMenuOpen])

  const handleOpml = () => {
    const { lawTree, selectedLawTitle } = useLawStore.getState()
    const title = selectedLawTitle || '法令'
    downloadAsFile(exportAsOpml(lawTree, title), `${title}.opml`, 'text/xml')
    setFileMenuOpen(false)
  }

  const handleScrapbox = () => {
    const { lawTree, selectedLawTitle, expandLevel } = useLawStore.getState()
    const title = selectedLawTitle || '法令'
    navigator.clipboard.writeText(exportAsScrapbox(lawTree, title, expandLevel))
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2000)
    setFileMenuOpen(false)
  }

  return (
    <div className="h-dvh flex flex-col bg-white">
      {/* ヘッダー */}
      <div className="flex items-center px-3 py-2 border-b border-gray-200 bg-white gap-2 flex-shrink-0">
        {/* 検索パネルトグル（モバイル・デスクトップ共通） */}
        <button
          onClick={() => setSearchPanelOpen(!searchPanelOpen)}
          className="text-gray-500 hover:text-gray-700 text-lg w-7 h-7 flex items-center justify-center"
          title="検索パネルの表示/非表示"
        >
          {searchPanelOpen ? '✕' : '☰'}
        </button>
        <button
          onClick={() => document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
          title="先頭に戻る"
        >
          <img src={import.meta.env.BASE_URL + 'icon.png'} alt="LexRamus" className="w-6 h-6" />
          <span className="text-sm font-semibold text-gray-800 hidden sm:inline">LexRamus</span>
        </button>
        {selectedLawId && (
          <div ref={fileMenuRef} className="relative">
            <button
              onClick={() => setFileMenuOpen(!fileMenuOpen)}
              className={`px-2 py-0.5 text-xs rounded border ${
                copyDone
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {copyDone ? 'コピー済' : '出力'}
            </button>
            {fileMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 whitespace-nowrap">
                <button
                  onClick={handleOpml}
                  className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                >
                  OPMLダウンロード
                </button>
                <button
                  onClick={handleScrapbox}
                  className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Scrapboxコピー
                </button>
              </div>
            )}
          </div>
        )}
        <div className="flex-1" />
        {selectedLawId && <DatePicker />}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* オーバーレイ背景（モバイルのみ） */}
        {searchPanelOpen && (
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-10"
            onClick={() => setSearchPanelOpen(false)}
          />
        )}

        {/* 検索パネル */}
        <div className={`
          ${searchPanelOpen
            ? 'max-md:translate-x-0 md:w-72'
            : 'max-md:-translate-x-full md:w-0 md:overflow-hidden'}
          max-md:fixed max-md:w-72 max-md:z-20
          md:relative md:z-0
          flex-shrink-0 h-full bg-white
          transition-all duration-200 ease-in-out
          border-r border-gray-200
        `}>
          <SearchPanel />
        </div>

        {/* 目次パネル */}
        <TocPanel />

        {/* メインエリア */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <ExpandToolbar />
          <LawSearchBar />
          {viewMode === 'diagram' ? (
            <LawDiagramView />
          ) : (
            <div id="main-scroll-container" className="flex-1 overflow-y-auto">
              {viewMode === 'list' ? <LawTreeView /> : <LawOutlineView />}
            </div>
          )}
        </div>
      </div>

      <StatusBar />
    </div>
  )
}

export default App
