import { useLawStore } from '../store/useLawStore'

export function StatusBar() {
  const { selectedLawTitle, selectedLawNum } = useLawStore()

  return (
    <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex-shrink-0">
      {selectedLawTitle ? (
        <span>
          {selectedLawTitle}（{selectedLawNum}）
        </span>
      ) : (
        <span>LexRamus - 法令ビューアー</span>
      )}
    </div>
  )
}
