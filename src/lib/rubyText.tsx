import { Fragment, useState, type ReactNode } from 'react'
import type { RichSegment } from '../types/law'
import type { BracketMode } from '../store/useLawStore'
import { convertToArabic } from './kansuji'
import { highlightText } from './highlight'

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
    let plain = segments.map(s => typeof s === 'string' ? s : s.rb).join('')
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
        return (
          <ruby key={i}>
            {arabicNum ? convertToArabic(seg.rb) : seg.rb}
            <rp>(</rp><rt>{seg.rt}</rt><rp>)</rp>
          </ruby>
        )
      })}
    </>
  )
}
