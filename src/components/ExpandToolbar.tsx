import { useState, useRef, useEffect } from 'react'
import { useLawStore } from '../store/useLawStore'
import { useTagStore, TAG_COLORS } from '../store/useTagStore'
import { EXPAND_LEVELS } from '../types/law'
import type { LawNodeType } from '../types/law'
import { exportAsOpml, exportAsScrapbox, downloadAsFile } from '../lib/export'

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3]

export function ExpandToolbar() {
  const {
    expandLevel, setExpandLevel, lawTree, availableTypes,
    viewMode, setViewMode,
    tocVisible, setTocVisible,
    useArabicNum, toggleArabicNum,
    zoomLevel, setZoomLevel,
    selectedLawTitle,
  } = useLawStore()
  const { activeFilter, setActiveFilter } = useTagStore()
  const [exportOpen, setExportOpen] = useState(false)
  const [copyDone, setCopyDone] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  // 外側クリックで閉じる
  useEffect(() => {
    if (!exportOpen) return
    const handleClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [exportOpen])

  if (lawTree.length === 0) return null

  const isDiagram = viewMode === 'diagram'
  const lawTitle = selectedLawTitle || '法令'

  const handleOpml = () => {
    const xml = exportAsOpml(lawTree, lawTitle)
    downloadAsFile(xml, `${lawTitle}.opml`, 'text/xml')
    setExportOpen(false)
  }

  const handleScrapbox = () => {
    const text = exportAsScrapbox(lawTree, lawTitle, expandLevel)
    navigator.clipboard.writeText(text)
    setCopyDone(true)
    setTimeout(() => setCopyDone(false), 2000)
    setExportOpen(false)
  }

  const zoomIn = () => {
    const next = ZOOM_STEPS.find((z) => z > zoomLevel)
    setZoomLevel(next ?? 3)
  }
  const zoomOut = () => {
    const next = [...ZOOM_STEPS].reverse().find((z) => z < zoomLevel)
    setZoomLevel(next ?? 0.25)
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50 flex-shrink-0">
      {/* メイン行: デスクトップでは全要素1行 / モバイルではコントロール部分のみ */}
      <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto">
        {/* ビュー切替 */}
        <div className="flex border border-gray-300 rounded overflow-hidden mr-1 flex-shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`px-2 py-0.5 text-xs ${
              viewMode === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            アウトライン
          </button>
          <button
            onClick={() => setViewMode('diagram')}
            className={`px-2 py-0.5 text-xs border-l border-gray-300 ${
              viewMode === 'diagram'
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
            プレーン
          </button>
        </div>

        {/* 目次トグル */}
        <button
          onClick={() => setTocVisible(!tocVisible)}
          className={`px-2 py-0.5 text-xs rounded border flex-shrink-0 ${
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
          className={`px-2 py-0.5 text-xs rounded border flex-shrink-0 ${
            useArabicNum
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-600 hover:bg-gray-100'
          }`}
          title="条文番号を算用数字に変換"
        >
          {useArabicNum ? '1,2,3' : '一,二,三'}
        </button>

        {/* エクスポート */}
        <div ref={exportRef} className="relative flex-shrink-0">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className={`px-2 py-0.5 text-xs rounded border flex-shrink-0 ${
              copyDone
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
            title="エクスポート"
          >
            {copyDone ? 'コピー済' : '出力'}
          </button>
          {exportOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-30 whitespace-nowrap">
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

        {/* 展開レベル（プレーン以外） - デスクトップでは同一行 */}
        {viewMode !== 'outline' && (
          <div className="hidden md:flex items-center gap-1 ml-1 flex-shrink-0">
            <div className="w-px h-4 bg-gray-300 mx-1" />
            {EXPAND_LEVELS.map((level, i) => {
              const exists = level.type === 'all' || level.type === 'list' || availableTypes.has(level.type as LawNodeType)
              const showSep = i > 0 && level.type === 'article'
              return (
                <span key={level.type} className="flex items-center gap-1">
                  {showSep && <div className="w-px h-4 bg-gray-300 mx-1" />}
                  <button
                    onClick={() => setExpandLevel(level.type)}
                    className={`px-2 py-0.5 text-xs rounded border flex-shrink-0 ${
                      expandLevel === level.type
                        ? 'bg-blue-600 text-white border-blue-600'
                        : exists
                          ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                          : 'border-gray-200 text-gray-300 cursor-default'
                    }`}
                  >
                    {level.label}
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {/* ズーム（樹形図時のみ） - デスクトップでは同一行 */}
        {isDiagram && (
          <div className="hidden md:flex items-center gap-0.5 ml-1 flex-shrink-0">
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button onClick={zoomOut} className="px-1 py-0.5 text-xs text-gray-500 hover:text-gray-700" title="縮小">
              −
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-1 py-0.5 text-xs text-gray-500 hover:text-gray-700 min-w-[36px] text-center"
              title="リセット"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button onClick={zoomIn} className="px-1 py-0.5 text-xs text-gray-500 hover:text-gray-700" title="拡大">
              +
            </button>
          </div>
        )}

        <div className="flex-1" />

        {/* タグフィルタ */}
        <div className="flex items-center gap-1 flex-shrink-0">
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

      {/* 2行目: モバイルのみ - 展開レベル */}
      {viewMode !== 'outline' && (
        <div className="md:hidden flex items-center gap-1 px-3 py-1 border-t border-gray-100 overflow-x-auto">
          {EXPAND_LEVELS.map((level, i) => {
            const exists = level.type === 'all' || level.type === 'list' || availableTypes.has(level.type as LawNodeType)
            const showSep = i > 0 && level.type === 'article'
            return (
              <span key={level.type} className="flex items-center gap-1 flex-shrink-0">
                {showSep && <div className="w-px h-4 bg-gray-300 mx-1" />}
                <button
                  onClick={() => setExpandLevel(level.type)}
                  className={`px-2 py-0.5 text-xs rounded border flex-shrink-0 ${
                    expandLevel === level.type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : exists
                        ? 'border-gray-300 text-gray-600 hover:bg-gray-100'
                        : 'border-gray-200 text-gray-300 cursor-default'
                  }`}
                >
                  {level.label}
                </button>
              </span>
            )
          })}
        </div>
      )}
      {isDiagram && (
        <div className="md:hidden flex items-center gap-1 px-3 py-1 border-t border-gray-100">
          <span className="text-xs text-gray-500 mr-0.5 flex-shrink-0">ズーム:</span>
          <button onClick={zoomOut} className="px-1.5 py-0.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded">−</button>
          <button
            onClick={() => setZoomLevel(1)}
            className="px-1.5 py-0.5 text-xs text-gray-500 hover:text-gray-700 min-w-[40px] text-center"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button onClick={zoomIn} className="px-1.5 py-0.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded">+</button>
        </div>
      )}
    </div>
  )
}
