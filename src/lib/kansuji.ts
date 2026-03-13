const KANJI_NUMBERS: Record<string, number> = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9,
}

const KANJI_MULTIPLIERS: Record<string, number> = {
  十: 10, 百: 100, 千: 1000,
}

function kanjiToNumber(kanji: string): number {
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
