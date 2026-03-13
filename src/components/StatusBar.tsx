import { useLawStore } from '../store/useLawStore'

export function StatusBar() {
  const { selectedLawTitle, selectedLawNum, asof } = useLawStore()

  return (
    <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex-shrink-0">
      {selectedLawTitle ? (
        <span>
          {selectedLawTitle}（{selectedLawNum}）
          {asof && <span className="ml-2 text-blue-500">時点: {asof}</span>}
        </span>
      ) : (
        <span>LexRamus - 法令ビューアー</span>
      )}
    </div>
  )
}
