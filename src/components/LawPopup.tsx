import { useState, useRef, useEffect } from 'react'
import { useLawStore } from '../store/useLawStore'
import { getLawData } from '../api/client'
import { parseLawFullText } from '../lib/parser'
import type { LawTreeNode } from '../types/law'

// ツリーからarticleを収集してプレーンテキストに変換
function collectArticleTexts(nodes: LawTreeNode[], targetNodeId?: string): { title: string; text: string }[] {
  const results: { title: string; text: string }[] = []
  function walk(node: LawTreeNode) {
    if (node.type === 'article') {
      // targetNodeIdが指定されていたら、そのノードだけ返す
      if (targetNodeId && node.id !== targetNodeId) {
        for (const c of node.children) walk(c)
        return
      }
      const lines: string[] = []
      function gatherText(n: LawTreeNode) {
        if (n.content) lines.push(n.content)
        for (const c of n.children) gatherText(c)
      }
      gatherText(node)
      results.push({ title: node.title, text: lines.join('\n') })
    }
    for (const c of node.children) walk(c)
  }
  for (const n of nodes) walk(n)
  return results
}

interface LawPopupProps {
  lawId: string
  lawTitle: string
  lawNum: string
  targetNodeId?: string  // 特定articleだけ表示する場合
  onClose: () => void
}

export function LawPopup({ lawId, lawTitle, lawNum, targetNodeId, onClose }: LawPopupProps) {
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState<{ title: string; text: string }[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose])

  useEffect(() => {
    let cancelled = false
    getLawData(lawId).then(data => {
      if (cancelled) return
      const tree = parseLawFullText(data.law_full_text)
      const arts = collectArticleTexts(tree, targetNodeId)
      setArticles(targetNodeId ? arts : arts.slice(0, 10))
      setLoading(false)
    }).catch(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [lawId, targetNodeId])

  const handleOpen = () => {
    onClose()
    if (targetNodeId) {
      useLawStore.setState({ pendingScrollTarget: targetNodeId })
    }
    useLawStore.getState().selectLaw(lawId, lawTitle, lawNum)
  }

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-3 text-left"
      style={{ top: '100%', left: 0, marginTop: '4px', width: 'min(400px, 90vw)', maxHeight: '300px' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-800 truncate">{lawTitle}</span>
        <button
          onClick={handleOpen}
          className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap ml-2 px-2 py-0.5 border border-blue-300 rounded hover:bg-blue-50"
        >
          開く
        </button>
      </div>
      <div className="overflow-y-auto text-xs text-gray-600 leading-relaxed" style={{ maxHeight: '240px' }}>
        {loading ? (
          <p className="text-gray-400">読み込み中...</p>
        ) : articles.length > 0 ? (
          articles.map((a, i) => (
            <div key={i} className="mb-2">
              <span className="font-semibold text-gray-700">{a.title}</span>
              <p className="mt-0.5 whitespace-pre-wrap">{a.text}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-400">条文データがありません</p>
        )}
      </div>
    </div>
  )
}
