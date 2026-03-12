import { useLawStore } from '../store/useLawStore'
import { EXPAND_LEVELS } from '../types/law'

export function ExpandToolbar() {
  const { expandLevel, setExpandLevel, lawTree } = useLawStore()

  if (lawTree.length === 0) return null

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50">
      <span className="text-xs text-gray-500 mr-2">展開:</span>
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
    </div>
  )
}
