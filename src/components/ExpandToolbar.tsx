import { useLawStore } from '../store/useLawStore'
import { useTagStore, TAG_COLORS } from '../store/useTagStore'
import { EXPAND_LEVELS } from '../types/law'

export function ExpandToolbar() {
  const {
    expandLevel, setExpandLevel, lawTree,
    viewMode, setViewMode,
    tocVisible, setTocVisible,
  } = useLawStore()
  const { activeFilter, setActiveFilter } = useTagStore()

  if (lawTree.length === 0) return null

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
      {/* 展開レベル（ツリービュー時のみ） */}
      {viewMode === 'tree' && (
        <>
          <span className="text-xs text-gray-500 mr-1">展開:</span>
          {EXPAND_LEVELS.map((level) => (
            <button
              key={level.type}
              onClick={() => setExpandLevel(level.type)}
              className={`px-2 py-0.5 text-xs rounded border ${
                expandLevel === level.type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {level.label}
            </button>
          ))}
          <div className="w-px h-4 bg-gray-300 mx-2" />
        </>
      )}

      {/* 目次トグル */}
      <button
        onClick={() => setTocVisible(!tocVisible)}
        className={`px-2 py-0.5 text-xs rounded border ${
          tocVisible
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-gray-300 text-gray-600 hover:bg-gray-100'
        }`}
      >
        目次
      </button>

      {/* タグフィルタ */}
      <div className="w-px h-4 bg-gray-300 mx-2" />
      <span className="text-xs text-gray-500 mr-1">タグ:</span>
      {TAG_COLORS.map((color) => (
        <button
          key={color.id}
          onClick={() => setActiveFilter(activeFilter === color.id ? null : color.id)}
          className={`w-4 h-4 rounded-full ${color.dot} ${
            activeFilter === color.id ? 'ring-2 ring-offset-1 ring-gray-400' : ''
          } hover:scale-110 transition-transform`}
          title={`${color.label}でフィルタ`}
        />
      ))}
      {activeFilter && (
        <button
          onClick={() => setActiveFilter(null)}
          className="text-xs text-gray-400 hover:text-gray-600 ml-1"
        >
          解除
        </button>
      )}

      <div className="flex-1" />

      {/* ビュー切替 */}
      <div className="flex border border-gray-300 rounded overflow-hidden">
        <button
          onClick={() => setViewMode('tree')}
          className={`px-2 py-0.5 text-xs ${
            viewMode === 'tree'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="ツリービュー"
        >
          ツリー
        </button>
        <button
          onClick={() => setViewMode('outline')}
          className={`px-2 py-0.5 text-xs border-l border-gray-300 ${
            viewMode === 'outline'
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="アウトラインビュー"
        >
          アウトライン
        </button>
      </div>
    </div>
  )
}
