import { useLawStore } from '../store/useLawStore'

export function syncUrlToState() {
  const params = new URLSearchParams(window.location.search)
  const lawId = params.get('law')
  const asof = params.get('asof')

  if (asof) {
    useLawStore.getState().asof = asof
    useLawStore.setState({ asof })
  }

  if (lawId) {
    // URLからの復元: まず法令IDで直接取得
    useLawStore.getState().selectLaw(lawId, '', '')
  }
}

export function updateUrl() {
  const { selectedLawId, asof, selectedLawTitle, selectedLawNum } = useLawStore.getState()
  const params = new URLSearchParams()

  if (selectedLawId) params.set('law', selectedLawId)
  if (asof) params.set('asof', asof)

  const search = params.toString()
  const url = search ? `?${search}` : window.location.pathname
  window.history.replaceState(
    { title: selectedLawTitle, num: selectedLawNum },
    '',
    url,
  )
}
