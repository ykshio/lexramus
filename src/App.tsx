import { SearchPanel } from './components/SearchPanel'
import { ExpandToolbar } from './components/ExpandToolbar'
import { LawTreeView } from './components/LawTreeView'
import { LawOutlineView } from './components/LawOutlineView'
import { TocPanel } from './components/TocPanel'
import { DatePicker } from './components/DatePicker'
import { StatusBar } from './components/StatusBar'
import { useLawStore } from './store/useLawStore'

function App() {
  const viewMode = useLawStore((s) => s.viewMode)
  const selectedLawId = useLawStore((s) => s.selectedLawId)

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* ヘッダー */}
      {selectedLawId && (
        <div className="flex items-center justify-end px-3 py-2 border-b border-gray-200 bg-white">
          <DatePicker />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* 検索パネル */}
        <div className="w-72 flex-shrink-0">
          <SearchPanel />
        </div>

        {/* 目次パネル */}
        <TocPanel />

        {/* メインエリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
