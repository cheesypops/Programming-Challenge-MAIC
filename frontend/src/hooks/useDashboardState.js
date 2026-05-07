import { useEffect, useState } from 'react'
import { readStoredState, writeStoredState } from '../utils/storage.js'

export const useDashboardState = () => {
  const stored = readStoredState()
  const [datasetId, setDatasetId] = useState(stored?.datasetId ?? null)
  const [suggestions, setSuggestions] = useState(stored?.suggestions ?? [])
  const [dashboard, setDashboard] = useState(stored?.dashboard ?? [])
  const [hiddenSuggestionKeys, setHiddenSuggestionKeys] = useState(
    () => new Set(stored?.hiddenSuggestionKeys ?? []),
  )

  useEffect(() => {
    writeStoredState({
      datasetId,
      suggestions,
      dashboard,
      hiddenSuggestionKeys: Array.from(hiddenSuggestionKeys),
    })
  }, [datasetId, suggestions, dashboard, hiddenSuggestionKeys])

  return {
    datasetId,
    setDatasetId,
    suggestions,
    setSuggestions,
    dashboard,
    setDashboard,
    hiddenSuggestionKeys,
    setHiddenSuggestionKeys,
  }
}
