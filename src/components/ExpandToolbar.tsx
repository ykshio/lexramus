import { useLawStore } from '../store/useLawStore'
import { useTagStore, TAG_COLORS } from '../store/useTagStore'
import { EXPAND_LEVELS } from '../types/law'

export function ExpandToolbar() {
  const {
    expandLevel, setExpandLevel, lawTree,
    viewMode, setViewMode,
    tocVisible, setTocVisible,
    useArabicNum, toggleArabicNum,
  } = useLawStore()
  const { activeFilter, setActiveFilter } = useTagStore()

  if (lawTree.length === 0) return null

  return (
    <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
      {/* 1行目: ビュー切替 + 目次 + 数字切替 + タグフィルタ */}
      <div className="flex items-center gap-1 px-3 py-1.5 flex-wrap">
        {/* ビュー切替 */}
        <div className="flex border border-gray-300 rounded overflow-hidden mr-1">
          <button
            onClick={() => setViewMode('tree')}
            className={`px-2 py-0.5 text-xs ${
              viewMode === 'tree'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
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
          >
            アウトライン
          </button>
        </div>

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

        {/* 漢数字/算用数字切替 */}
        <button
          onClick={toggleArabicNum}
          className={`px-2 py-0.5 text-xs rounded border ${
            useArabicNum
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
          title="条文番号を算用数字に変換"
        >
          {useArabicNum ? '1,2,3' : '一,二,三'}
        </button>

        <div className="flex-1" />

        {/* タグフィルタ */}
        <div className="flex items-center gap-1">
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
              className="text-xs text-gray-400 hover:text-gray-600 ml-0.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2行目: 展開レベル（ツリービュー時のみ） */}
      {viewMode === 'tree' && (
        <div className="flex items-center gap-1 px-3 py-1 border-t border-gray-100 overflow-x-auto">
          <span className="text-xs text-gray-500 mr-1 flex-shrink-0">展開:</span>
          {EXPAND_LEVELS.map((level) => (
            <button
              key={level.type}
              onClick={() => setExpandLevel(level.type)}
              className={`px-2 py-0.5 text-xs rounded border flex-shrink-0 ${
                expandLevel === level.type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
