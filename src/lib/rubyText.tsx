import { Fragment, useState, useRef, useEffect, type ReactNode } from 'react'
import type { RichSegment, LawTreeNode } from '../types/law'
import { useLawStore, type BracketMode } from '../store/useLawStore'
import { convertToArabic } from './kansuji'
import { highlightText } from './highlight'
import { searchLaws, getLawData } from '../api/client'
import { parseLawFullText } from './parser'

interface RubyTextProps {
  segments: RichSegment[]
  searchQuery?: string
  arabicNum?: boolean
  bracketMode?: BracketMode
}

const BRACKET_RE = /（[^）]*）/g

function BracketSpan({ text, mode }: { text: string; mode: BracketMode }) {
  const [expanded, setExpanded] = useState(false)

  if (mode === 'normal') return <>{text}</>
  if (mode === 'hidden') return null
  if (mode === 'bold') return <span className="text-gray-900 font-medium">{text}</span>
  if (mode === 'dim') return <span className="text-gray-400">{text}</span>
  // collapse
  if (expanded) {
    return (
      <span className="text-gray-500 cursor-pointer" onClick={() => setExpanded(false)}>
        {text}
      </span>
    )
  }
  return (
    <span
      className="text-gray-400 cursor-pointer hover:text-gray-500"
      onClick={() => setExpanded(true)}
    >(…)</span>
  )
}

// ツリーからarticleを収集してプレーンテキストに変換
function collectArticleTexts(nodes: LawTreeNode[]): { title: string; text: string }[] {
  const results: { title: string; text: string }[] = []
  function walk(node: LawTreeNode) {
    if (node.type === 'article') {
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

function LawRefLink({ text, lawTitle }: { text: string; lawTitle: string }) {
  const [loading, setLoading] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [popupData, setPopupData] = useState<{
    lawId: string; title: string; lawNum: string
    articles: { title: string; text: string }[]
  } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!popupOpen) return
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setPopupOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [popupOpen])

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (loading) return

    // 既にデータがあればポップアップ表示切替
    if (popupData) {
      setPopupOpen(!popupOpen)
      return
    }

    setLoading(true)
    try {
      const res = await searchLaws({ law_title: lawTitle, limit: 10 })
      const exact = res.laws.find(l => l.revision_info.law_title === lawTitle)
      const target = exact ?? res.laws[0]
      if (target) {
        const data = await getLawData(target.law_info.law_id)
        const tree = parseLawFullText(data.law_full_text)
        const articles = collectArticleTexts(tree).slice(0, 10)
        setPopupData({
          lawId: target.law_info.law_id,
          title: target.revision_info.law_title,
          lawNum: target.law_info.law_num,
          articles,
        })
        setPopupOpen(true)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    if (!popupData) return
    setPopupOpen(false)
    useLawStore.getState().selectLaw(popupData.lawId, popupData.title, popupData.lawNum)
  }

  return (
    <span ref={ref} className="relative inline-block">
      <span
        className={`text-blue-600 underline decoration-blue-300 cursor-pointer hover:text-blue-800 ${loading ? 'opacity-50' : ''}`}
        onClick={handleClick}
        title={`${lawTitle}をプレビュー`}
      >
        {text}
      </span>
      {popupOpen && popupData && (
        <div
          className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-3 text-left"
          style={{ top: '100%', left: 0, marginTop: '4px', width: 'min(400px, 90vw)', maxHeight: '300px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-800 truncate">{popupData.title}</span>
            <button
              onClick={handleOpen}
              className="text-xs text-blue-600 hover:text-blue-800 whitespace-nowrap ml-2 px-2 py-0.5 border border-blue-300 rounded hover:bg-blue-50"
            >
              開く
            </button>
          </div>
          <div className="overflow-y-auto text-xs text-gray-600 leading-relaxed" style={{ maxHeight: '240px' }}>
            {popupData.articles.map((a, i) => (
              <div key={i} className="mb-2">
                <span className="font-semibold text-gray-700">{a.title}</span>
                <p className="mt-0.5 whitespace-pre-wrap">{a.text}</p>
              </div>
            ))}
            {popupData.articles.length === 0 && (
              <p className="text-gray-400">条文データがありません</p>
            )}
          </div>
        </div>
      )}
    </span>
  )
}

export function applyBracketMode(text: string, mode: BracketMode): ReactNode {
  if (mode === 'normal') return text
  const parts = text.split(BRACKET_RE)
  const matches = text.match(BRACKET_RE)
  if (!matches) return text

  const result: ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) result.push(<Fragment key={`t${i}`}>{parts[i]}</Fragment>)
    if (i < matches.length) {
      result.push(<BracketSpan key={`b${i}`} text={matches[i]} mode={mode} />)
    }
  }
  return <>{result}</>
}

export function applyBracketToHighlighted(text: string, query: string, mode: BracketMode): ReactNode {
  if (mode === 'normal') return highlightText(text, query)
  if (mode === 'hidden') {
    const stripped = text.replace(BRACKET_RE, '')
    return highlightText(stripped, query)
  }
  // dim / bold / collapse: 先に括弧で分割、各パーツにハイライト適用
  const parts = text.split(BRACKET_RE)
  const matches = text.match(BRACKET_RE)
  if (!matches) return highlightText(text, query)

  const result: ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) result.push(<Fragment key={`t${i}`}>{highlightText(parts[i], query)}</Fragment>)
    if (i < matches.length) {
      result.push(<BracketSpan key={`b${i}`} text={matches[i]} mode={mode} />)
    }
  }
  return <>{result}</>
}

export function RubyText({ segments, searchQuery, arabicNum, bracketMode = 'normal' }: RubyTextProps) {
  if (segments.length === 0) return null

  // 検索時はプレーンテキスト+ハイライトにフォールバック
  if (searchQuery) {
    let plain = segments.map(s => {
      if (typeof s === 'string') return s
      if ('rb' in s) return s.rb
      return s.text
    }).join('')
    if (arabicNum) plain = convertToArabic(plain)
    return <>{applyBracketToHighlighted(plain, searchQuery, bracketMode)}</>
  }

  return (
    <>
      {segments.map((seg, i) => {
        if (typeof seg === 'string') {
          const text = arabicNum ? convertToArabic(seg) : seg
          return <Fragment key={i}>{applyBracketMode(text, bracketMode)}</Fragment>
        }
        if ('rb' in seg) {
          return (
            <ruby key={i}>
              {arabicNum ? convertToArabic(seg.rb) : seg.rb}
              <rp>(</rp><rt>{seg.rt}</rt><rp>)</rp>
            </ruby>
          )
        }
        return <LawRefLink key={i} text={seg.text} lawTitle={seg.lawTitle} />
      })}
    </>
  )
}
