import { useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import DashboardPanel from '../components/DashboardPanel.jsx'
import HeroHeader from '../components/HeroHeader.jsx'
import SuggestionsPanel from '../components/SuggestionsPanel.jsx'
import UploadPanel from '../components/UploadPanel.jsx'
import { toChartType } from '../config/charts.js'
import { useDashboardState } from '../hooks/useDashboardState.js'
import { fetchChartData, suggestCharts } from '../services/chartsApi.js'
import { normalizeParameters, suggestionKey } from '../utils/charts.js'

const DashboardPage = () => {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  const {
    datasetId,
    setDatasetId,
    suggestions,
    setSuggestions,
    dashboard,
    setDashboard,
    hiddenSuggestionKeys,
    setHiddenSuggestionKeys,
  } = useDashboardState()

  const suggestMutation = useMutation({
    mutationFn: suggestCharts,
    onSuccess: (data) => {
      setDatasetId(data?.dataset_id ?? null)
      setSuggestions(data?.suggestions ?? [])
      setDashboard([])
      setUploadError(null)
    },
    onError: (error) => {
      setUploadError(error?.message ?? 'No se pudo procesar el archivo')
    },
  })

  const chartDataMutation = useMutation({
    mutationFn: async ({ suggestionId, chartType, parameters }) => {
      const normalized = normalizeParameters(chartType, parameters)
      const data = await fetchChartData({
        datasetId,
        chartType,
        parameters: normalized,
      })
      return { suggestionId, data: data?.data ?? [] }
    },
    onSuccess: (payload) => {
      setDashboard((prev) =>
        prev.map((card) =>
          card.id === payload.suggestionId
            ? { ...card, data: payload.data, loading: false, error: null }
            : card,
        ),
      )
    },
    onError: (error, variables) => {
      setDashboard((prev) =>
        prev.map((card) =>
          card.id === variables.suggestionId
            ? {
                ...card,
                loading: false,
                error: error?.message ?? 'No se pudo cargar el grafico',
              }
            : card,
        ),
      )
    },
  })

  const fileLabel = useMemo(() => {
    if (!file) return 'Arrastra un archivo o haz clic para seleccionar'
    return `${file.name} (${Math.round(file.size / 1024)} KB)`
  }, [file])

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0]
    if (selected) {
      setFile(selected)
      setUploadError(null)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    const droppedFile = event.dataTransfer.files?.[0]
    if (!droppedFile) return
    const lowerName = droppedFile.name.toLowerCase()
    if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.xlsx')) {
      setUploadError('Solo se permiten archivos .csv o .xlsx')
      return
    }
    setFile(droppedFile)
    setUploadError(null)
  }

  const handleUpload = () => {
    if (!file) return
    setSuggestions([])
    setDatasetId(null)
    setHiddenSuggestionKeys(new Set())
    suggestMutation.mutate(file)
  }

  const handleAddChart = (suggestion) => {
    if (!datasetId) return
    const key = suggestionKey(suggestion)
    if (hiddenSuggestionKeys.has(key)) return
    const chartType = toChartType(suggestion.chart_type)
    const card = {
      id: crypto.randomUUID(),
      suggestionKey: key,
      title: suggestion.title,
      insight: suggestion.insight,
      chartType,
      parameters: suggestion.parameters,
      data: [],
      loading: true,
      error: null,
    }
    setDashboard((prev) => [card, ...prev])
    setHiddenSuggestionKeys((prev) => new Set(prev).add(key))
    chartDataMutation.mutate({
      suggestionId: card.id,
      chartType,
      parameters: suggestion.parameters,
    })
  }

  const handleRemoveChart = (cardId) => {
    setDashboard((prev) => {
      const next = prev.filter((card) => card.id !== cardId)
      const removed = prev.find((card) => card.id === cardId)
      if (removed?.suggestionKey) {
        setHiddenSuggestionKeys((current) => {
          const updated = new Set(current)
          updated.delete(removed.suggestionKey)
          return updated
        })
      }
      return next
    })
  }

  const handleDragOver = (event) => {
    if (suggestMutation.isPending) return
    event.preventDefault()
    setDragActive(true)
  }

  const handleTriggerSelect = () => {
    if (!suggestMutation.isPending) {
      fileInputRef.current?.click()
    }
  }

  return (
    <>
      <HeroHeader />
      <DashboardPanel dashboard={dashboard} onRemoveChart={handleRemoveChart} />
      <UploadPanel
        dragActive={dragActive}
        fileInputRef={fileInputRef}
        fileLabel={fileLabel}
        hasFile={Boolean(file)}
        isPending={suggestMutation.isPending}
        uploadError={uploadError}
        onDragLeave={() => setDragActive(false)}
        onDragOver={handleDragOver}
        onDrop={suggestMutation.isPending ? undefined : handleDrop}
        onFileChange={handleFileChange}
        onUpload={handleUpload}
        onTriggerSelect={handleTriggerSelect}
      />
      <SuggestionsPanel
        datasetId={datasetId}
        hiddenSuggestionKeys={hiddenSuggestionKeys}
        onAddChart={handleAddChart}
        suggestions={suggestions}
        suggestionKey={suggestionKey}
        toChartType={toChartType}
      />
    </>
  )
}

export default DashboardPage
