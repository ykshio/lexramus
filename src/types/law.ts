// e-Gov法令API v2 の型定義

export type LawType =
  | 'Constitution'
  | 'Act'
  | 'CabinetOrder'
  | 'ImperialOrder'
  | 'MinisterialOrdinance'
  | 'Rule'
  | 'Misc'

export type Era = 'Meiji' | 'Taisho' | 'Showa' | 'Heisei' | 'Reiwa'

export type RepealStatus =
  | 'None'
  | 'Repeal'
  | 'Expire'
  | 'Suspend'
  | 'LossOfEffectiveness'

export interface LawInfo {
  law_type: LawType
  law_id: string
  law_num: string
  law_num_era: Era
  law_num_year: number
  law_num_type: LawType
  law_num_num: string
  promulgation_date: string
}

export interface RevisionInfo {
  law_revision_id: string
  law_type: LawType
  law_title: string
  law_title_kana: string
  abbrev: string | null
  category: string | null
  updated: string
  amendment_promulgate_date: string
  amendment_enforcement_date: string
  amendment_enforcement_comment: string | null
  amendment_scheduled_enforcement_date: string | null
  amendment_law_id: string
  amendment_law_title: string
  amendment_law_num: string
  amendment_type: string
  repeal_status: RepealStatus
  repeal_date: string | null
  remain_in_force: boolean
  mission: 'New' | 'Partial'
  current_revision_status: string
}

// /api/2/laws レスポンス
export interface LawsResponse {
  total_count: number
  count: number
  next_offset: number | null
  laws: {
    law_info: LawInfo
    revision_info: RevisionInfo
    current_revision_info?: RevisionInfo
  }[]
}

// /api/2/keyword レスポンス
export interface KeywordResponse {
  total_count: number
  sentence_count: number
  next_offset: number | null
  items: {
    law_info: LawInfo
    revision_info: RevisionInfo
    sentences: {
      position: string
      text: string
    }[]
  }[]
}

// /api/2/law_data レスポンス
export interface LawDataResponse {
  law_info: LawInfo
  revision_info: RevisionInfo
  law_full_text: LawElement
}

// 法令XMLのJSON表現
export interface LawElement {
  tag: string
  attr: Record<string, string>
  children: (LawElement | string)[]
}

// /api/2/law_revisions レスポンス
export interface LawRevisionsResponse {
  law_info: LawInfo
  revisions: RevisionInfo[]
}

// ルビ付きテキストセグメント
export type RichSegment = string | { rb: string; rt: string }

// アプリ内部で使用する法令ツリーノード
export interface LawTreeNode {
  id: string
  type: LawNodeType
  title: string
  num: string
  content: string
  richTitle: RichSegment[]
  richContent: RichSegment[]
  children: LawTreeNode[]
  depth: number
}

export type LawNodeType =
  | 'law'
  | 'law_body'
  | 'part'       // 編
  | 'chapter'    // 章
  | 'section'    // 節
  | 'subsection' // 款
  | 'division'   // 目
  | 'article'    // 条
  | 'paragraph'  // 項
  | 'item'       // 号
  | 'subitem'    // 号の細分
  | 'suppl_provision' // 附則
  | 'toc'        // 目次
  | 'preamble'   // 前文
  | 'unknown'

export const LAW_TYPE_LABELS: Record<LawType, string> = {
  Constitution: '憲法',
  Act: '法律',
  CabinetOrder: '政令',
  ImperialOrder: '勅令',
  MinisterialOrdinance: '府省令',
  Rule: '規則',
  Misc: 'その他',
}

export const ERA_LABELS: Record<Era, string> = {
  Meiji: '明治',
  Taisho: '大正',
  Showa: '昭和',
  Heisei: '平成',
  Reiwa: '令和',
}

// 展開レベルの定義
export const EXPAND_LEVELS = [
  { type: 'part' as const, label: '編' },
  { type: 'chapter' as const, label: '章' },
  { type: 'section' as const, label: '節' },
  { type: 'subsection' as const, label: '款' },
  { type: 'division' as const, label: '目' },
  { type: 'article' as const, label: '条' },
  { type: 'paragraph' as const, label: '項' },
  { type: 'item' as const, label: '号' },
  { type: 'subitem' as const, label: 'イロハ' },
  { type: 'all' as const, label: '全' },
] as const

export type ExpandLevel = (typeof EXPAND_LEVELS)[number]['type']
