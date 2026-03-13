import { Fragment } from 'react'
import type { RichSegment } from '../types/law'
import { convertToArabic } from './kansuji'
import { highlightText } from './highlight'

interface RubyTextProps {
  segments: RichSegment[]
  searchQuery?: string
  arabicNum?: boolean
}

export function RubyText({ segments, searchQuery, arabicNum }: RubyTextProps) {
  if (segments.length === 0) return null

  // 検索時はプレーンテキスト+ハイライトにフォールバック
  if (searchQuery) {
    let plain = segments.map(s => typeof s === 'string' ? s : s.rb).join('')
    if (arabicNum) plain = convertToArabic(plain)
    return <>{highlightText(plain, searchQuery)}</>
  }

  return (
    <>
      {segments.map((seg, i) => {
        if (typeof seg === 'string') {
          return <Fragment key={i}>{arabicNum ? convertToArabic(seg) : seg}</Fragment>
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
