import { useLawStore } from '../store/useLawStore'

declare const __BUILD_TIME__: string

const buildDate = new Date(__BUILD_TIME__)
const buildLabel = `${buildDate.getFullYear()}/${String(buildDate.getMonth() + 1).padStart(2, '0')}/${String(buildDate.getDate()).padStart(2, '0')} ${String(buildDate.getHours()).padStart(2, '0')}:${String(buildDate.getMinutes()).padStart(2, '0')}`

export function StatusBar() {
  const { selectedLawTitle, selectedLawNum, asof } = useLawStore()

  return (
    <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex-shrink-0 flex items-center gap-2">
      <div className="flex-1 truncate">
        {selectedLawTitle ? (
          <span>
            {selectedLawTitle}（{selectedLawNum}）
            {asof && <span className="ml-2 text-blue-500">時点: {asof}</span>}
          </span>
        ) : (
          <span>LexRamus - 法令ビューアー</span>
        )}
      </div>
      <span className="hidden md:inline text-gray-300">
        / 検索 | t ビュー切替 | c 目次 | 1-7 展開
      </span>
      <span className="text-gray-300 flex-shrink-0">{buildLabel}</span>
    </div>
  )
}
