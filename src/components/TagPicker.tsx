import { useState, useRef, useEffect } from 'react'
import { TAG_COLORS, useTagStore } from '../store/useTagStore'
import { useLawStore } from '../store/useLawStore'

interface TagPickerProps {
  nodeId: string
}

export function TagPicker({ nodeId }: TagPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selectedLawId = useLawStore((s) => s.selectedLawId)
  const { getNodeTags, toggleTag } = useTagStore()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!selectedLawId) return null

  const nodeTags = getNodeTags(selectedLawId, nodeId)
  const firstColor = nodeTags.length > 0
    ? TAG_COLORS.find((c) => c.id === nodeTags[0])
    : null

  return (
    <div ref={ref} className="relative inline-flex items-center flex-shrink-0 mt-1">
      {/* メインのドットボタン: タグがあれば色付き、なければグレー（ホバーで表示） */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={`w-3 h-3 rounded-full flex-shrink-0 transition-opacity ${
          firstColor
            ? `${firstColor.dot}`
            : 'bg-gray-300 opacity-0 group-hover:opacity-100'
        }`}
        title="色タグ"
      />
      {/* 複数タグがある場合は追加のドット */}
      {nodeTags.length > 1 && (
        <span className="flex gap-0.5 ml-0.5">
          {nodeTags.slice(1).map((colorId) => {
            const color = TAG_COLORS.find((c) => c.id === colorId)
            return color ? (
              <span key={colorId} className={`w-2 h-2 rounded-full ${color.dot}`} />
            ) : null
          })}
        </span>
      )}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-gray-200 rounded shadow-lg p-1.5 flex gap-1">
          {TAG_COLORS.map((color) => {
            const active = nodeTags.includes(color.id)
            return (
              <button
                key={color.id}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleTag(selectedLawId, nodeId, color.id)
                }}
                className={`w-5 h-5 rounded-full ${color.dot} ${
                  active ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                } hover:scale-110 transition-transform`}
                title={color.label}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
