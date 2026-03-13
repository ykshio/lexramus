import { useRef, useEffect } from 'react'
import { useLawStore } from '../store/useLawStore'

export function LawSearchBar() {
  const {
    isTextSearchOpen,
    textSearchQuery,
    textSearchResultIds,
    textSearchActiveIndex,
    setTextSearchQuery,
    goToNextTextResult,
    goToPrevTextResult,
    closeTextSearch,
  } = useLawStore()

  const inputRef = useRef<HTMLInputElement>(null)
  const composingRef = useRef(false)

  useEffect(() => {
    if (isTextSearchOpen && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isTextSearchOpen])

  if (!isTextSearchOpen) return null

  const resultCount = textSearchResultIds.length
  const hasQuery = textSearchQuery.length > 0

  return (
    <div className="px-3 py-2 bg-white border-b border-gray-200 flex items-center gap-1.5 flex-shrink-0">
      {/* 検索アイコン */}
      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {/* テキスト入力 */}
      <input
        ref={inputRef}
        type="text"
        className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-gray-400"
        placeholder="条文内を検索..."
        value={textSearchQuery}
        onChange={(e) => setTextSearchQuery(e.target.value)}
        onCompositionStart={() => { composingRef.current = true }}
        onCompositionEnd={() => { setTimeout(() => { composingRef.current = false }, 0) }}
        onKeyDown={(e) => {
          if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return
          if (e.key === 'Escape') closeTextSearch()
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); goToNextTextResult(); inputRef.current?.focus() }
          if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); goToPrevTextResult(); inputRef.current?.focus() }
        }}
      />

      {/* 結果カウント */}
      {hasQuery && (
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {resultCount > 0 ? `${textSearchActiveIndex + 1}/${resultCount}` : '0件'}
        </span>
      )}

      {/* 前へ */}
      <button
        className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors shrink-0"
        onClick={() => { goToPrevTextResult(); inputRef.current?.focus() }}
        disabled={resultCount === 0}
        title="前へ (Shift+Enter)"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* 次へ */}
      <button
        className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors shrink-0"
        onClick={() => { goToNextTextResult(); inputRef.current?.focus() }}
        disabled={resultCount === 0}
        title="次へ (Enter)"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 閉じる */}
      <button
        className="flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
        onClick={closeTextSearch}
        title="閉じる (Esc)"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
