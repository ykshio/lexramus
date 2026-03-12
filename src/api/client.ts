import type {
  LawsResponse,
  KeywordResponse,
  LawDataResponse,
  LawRevisionsResponse,
  LawType,
} from '../types/law'

const BASE_URL = 'https://laws.e-gov.go.jp/api/2'

async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value)
    }
  }
  url.searchParams.set('response_format', 'json')

  const res = await fetch(url.toString())
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export interface SearchLawsParams {
  law_title?: string
  law_type?: LawType[]
  asof?: string
  limit?: number
  offset?: number
}

export async function searchLaws(params: SearchLawsParams): Promise<LawsResponse> {
  const query: Record<string, string> = {}
  if (params.law_title) query.law_title = params.law_title
  if (params.law_type?.length) query.law_type = params.law_type.join(',')
  if (params.asof) query.asof = params.asof
  if (params.limit) query.limit = String(params.limit)
  if (params.offset) query.offset = String(params.offset)

  return fetchApi<LawsResponse>(`${BASE_URL}/laws`, query)
}

export interface SearchKeywordParams {
  keyword: string
  law_type?: LawType[]
  asof?: string
  limit?: number
  offset?: number
}

export async function searchKeyword(params: SearchKeywordParams): Promise<KeywordResponse> {
  const query: Record<string, string> = {
    keyword: params.keyword,
  }
  if (params.law_type?.length) query.law_type = params.law_type.join(',')
  if (params.asof) query.asof = params.asof
  if (params.limit) query.limit = String(params.limit)
  if (params.offset) query.offset = String(params.offset)

  return fetchApi<KeywordResponse>(`${BASE_URL}/keyword`, query)
}

export async function getLawData(
  lawId: string,
  asof?: string,
): Promise<LawDataResponse> {
  const query: Record<string, string> = {
    law_full_text_format: 'json',
  }
  if (asof) query.asof = asof

  return fetchApi<LawDataResponse>(`${BASE_URL}/law_data/${encodeURIComponent(lawId)}`, query)
}

export async function getLawRevisions(
  lawId: string,
): Promise<LawRevisionsResponse> {
  return fetchApi<LawRevisionsResponse>(`${BASE_URL}/law_revisions/${encodeURIComponent(lawId)}`)
}
