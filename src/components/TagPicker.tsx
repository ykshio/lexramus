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
  const tagColor = nodeTags.length > 0
    ? TAG_COLORS.find((c) => c.id === nodeTags[0])
    : null

  return (
    <div ref={ref} className="flex-shrink-0 relative" style={{ width: 0, overflow: 'visible' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={`absolute w-3 h-3 rounded-full transition-opacity ${
          tagColor
            ? tagColor.dot
            : 'bg-gray-300 opacity-0 group-hover:opacity-100'
        }`}
        style={{ right: '3px', top: '2px' }}
        title="色タグ"
      />
      {open && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded shadow-lg p-1.5 flex gap-1"
          style={{ top: '18px', left: '-6px' }}
        >
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
