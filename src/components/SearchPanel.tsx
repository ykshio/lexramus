import { useState, type FormEvent } from 'react'
import { useLawStore } from '../store/useLawStore'
import { LAW_TYPE_LABELS } from '../types/law'
import type { LawType } from '../types/law'

const LAW_TYPES: LawType[] = [
  'Act',
  'CabinetOrder',
  'MinisterialOrdinance',
  'Rule',
  'Constitution',
  'ImperialOrder',
  'Misc',
]

export function SearchPanel() {
  const {
    searchQuery,
    setSearchQuery,
    search,
    searchResults,
    searchLoading,
    searchError,
    searchTotal,
    lawTypeFilter,
    setLawTypeFilter,
    selectLaw,
    selectedLawId,
  } = useLawStore()

  const [showFilter, setShowFilter] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    search()
  }

  const toggleType = (type: LawType) => {
    if (lawTypeFilter.includes(type)) {
      setLawTypeFilter(lawTypeFilter.filter((t) => t !== type))
    } else {
      setLawTypeFilter([...lawTypeFilter, type])
    }
  }

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      <form onSubmit={handleSubmit} className="p-3 border-b border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="法令名を検索..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            検索
          </button>
        </div>
        <button
          type="button"
          onClick={() => setShowFilter(!showFilter)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-700"
        >
          法令種別フィルタ {showFilter ? '▲' : '▼'}
        </button>
        {showFilter && (
          <div className="mt-2 flex flex-wrap gap-1">
            {LAW_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`px-2 py-0.5 text-xs rounded border ${
                  lawTypeFilter.includes(type)
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {LAW_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </form>

      <div className="flex-1 overflow-y-auto">
        {searchLoading && (
          <div className="p-4 text-sm text-gray-500 text-center">検索中...</div>
        )}
        {searchError && (
          <div className="p-4 text-sm text-red-500">{searchError}</div>
        )}
        {!searchLoading && searchResults.length > 0 && (
          <div className="text-xs text-gray-400 px-3 pt-2">
            {searchTotal}件中 {searchResults.length}件表示
          </div>
        )}
        {searchResults.map((result) => (
          <button
            key={result.law_info.law_id}
            onClick={() =>
              selectLaw(
                result.law_info.law_id,
                result.revision_info.law_title,
                result.law_info.law_num,
              )
            }
            className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 ${
              selectedLawId === result.law_info.law_id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="text-sm font-medium text-gray-800 truncate">
              {result.revision_info.law_title}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {result.law_info.law_num}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
