const KANJI_NUMBERS: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9,
}

const KANJI_MULTIPLIERS: Record<string, number> = {
  十: 10, 百: 100, 千: 1000,
}

export function kanjiToNumber(kanji: string): number {
  let num = 0
  let tmp = 0

  for (const char of kanji) {
    if (KANJI_NUMBERS[char]) {
      tmp += KANJI_NUMBERS[char]
    } else if (KANJI_MULTIPLIERS[char]) {
      tmp = (tmp || 1) * KANJI_MULTIPLIERS[char]
      num += tmp
      tmp = 0
    } else {
      num += tmp
      tmp = 0
    }
  }
  num += tmp
  return num
}

const PATTERN = /第([一二三四五六七八九十百千]+)(編|章|節|款|目|条|項)(?:の([一二三四五六七八九十百千]+)|ノ([一二三四五六七八九十百千]+))?/g

export function convertToArabic(text: string): string {
  return text.replace(
    PATTERN,
    (_match, mainPart, unit, subPartNo, subPartKata) => {
      const mainNumber = kanjiToNumber(mainPart)
      if (subPartNo) {
        return `第${mainNumber}${unit}の${kanjiToNumber(subPartNo)}`
      }
      if (subPartKata) {
        return `第${mainNumber}${unit}ノ${kanjiToNumber(subPartKata)}`
      }
      return `第${mainNumber}${unit}`
    },
  )
}

// 算用数字 → 漢数字変換（検索用）

const ARABIC_DIGITS: Record<string, string> = {
  '0': '〇', '1': '一', '2': '二', '3': '三', '4': '四',
  '5': '五', '6': '六', '7': '七', '8': '八', '9': '九',
}

function numberToKanji(n: number): string {
  if (n === 0) return '〇'
  let result = ''
  const thousands = Math.floor(n / 1000)
  if (thousands > 0) {
    result += (thousands > 1 ? ARABIC_DIGITS[String(thousands)] : '') + '千'
    n %= 1000
  }
  const hundreds = Math.floor(n / 100)
  if (hundreds > 0) {
    result += (hundreds > 1 ? ARABIC_DIGITS[String(hundreds)] : '') + '百'
    n %= 100
  }
  const tens = Math.floor(n / 10)
  if (tens > 0) {
    result += (tens > 1 ? ARABIC_DIGITS[String(tens)] : '') + '十'
    n %= 10
  }
  if (n > 0) {
    result += ARABIC_DIGITS[String(n)]
  }
  return result
}

const ARABIC_PATTERN = /第(\d+)(編|章|節|款|目|条|項)(?:の(\d+)|ノ(\d+))?/g

export function convertToKanji(text: string): string {
  return text.replace(
    ARABIC_PATTERN,
    (_match, mainPart, unit, subPartNo, subPartKata) => {
      const mainKanji = numberToKanji(parseInt(mainPart, 10))
      if (subPartNo) {
        return `第${mainKanji}${unit}の${numberToKanji(parseInt(subPartNo, 10))}`
      }
      if (subPartKata) {
        return `第${mainKanji}${unit}ノ${numberToKanji(parseInt(subPartKata, 10))}`
      }
      return `第${mainKanji}${unit}`
    },
  )
}

// 汎用: 数字列をすべて漢数字に変換（「3条」→「三条」、「12」→「十二」）
export function replaceArabicWithKanji(text: string): string {
  return text.replace(/\d+/g, (m) => numberToKanji(parseInt(m, 10)))
}
