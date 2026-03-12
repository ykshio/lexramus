import { SearchPanel } from './components/SearchPanel'
import { ExpandToolbar } from './components/ExpandToolbar'
import { LawTreeView } from './components/LawTreeView'
import { StatusBar } from './components/StatusBar'

function App() {
  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex flex-1 overflow-hidden">
        {/* 検索パネル */}
        <div className="w-72 flex-shrink-0">
          <SearchPanel />
        </div>

        {/* メインエリア */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ExpandToolbar />
          <div className="flex-1 overflow-y-auto">
            <LawTreeView />
          </div>
        </div>
      </div>

      <StatusBar />
    </div>
  )
}

export default App
