import { useState, useRef, useEffect } from 'react'
import { useLawStore } from '../store/useLawStore'

export function DatePicker() {
  const { asof, setAsof, revisions, revisionsLoading, selectedLawId } = useLawStore()
  const [showRevisions, setShowRevisions] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowRevisions(false)
      }
    }
    if (showRevisions) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showRevisions])

  return (
    <div ref={ref} className="relative flex items-center gap-2">
      <label className="text-xs text-gray-500">時点:</label>
      <input
        type="date"
        value={asof ?? ''}
        onChange={(e) => setAsof(e.target.value || null)}
        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {asof && (
        <button
          onClick={() => setAsof(null)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          現行
        </button>
      )}
      {selectedLawId && (
        <button
          onClick={() => setShowRevisions(!showRevisions)}
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          履歴{showRevisions ? '▲' : '▼'}
        </button>
      )}
      {showRevisions && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded shadow-lg w-80 max-h-64 overflow-y-auto">
          <div className="px-3 py-2 border-b border-gray-100 text-xs font-medium text-gray-600">
            改正履歴
          </div>
          {revisionsLoading ? (
            <div className="p-3 text-xs text-gray-400">読み込み中...</div>
          ) : revisions.length === 0 ? (
            <div className="p-3 text-xs text-gray-400">履歴なし</div>
          ) : (
            revisions.map((rev) => (
              <button
                key={rev.law_revision_id}
                onClick={() => {
                  setAsof(rev.amendment_enforcement_date)
                  setShowRevisions(false)
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 border-b border-gray-50 ${
                  asof === rev.amendment_enforcement_date ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-xs text-gray-700">
                  {rev.amendment_enforcement_date}
                  {rev.current_revision_status === 'CurrentEnforced' && (
                    <span className="ml-1 text-green-600">(現行)</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {rev.amendment_law_title || rev.amendment_law_num}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
