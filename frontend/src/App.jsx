import { useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const CHART_COLORS = ['#30cfd0', '#fbbf24', '#f472b6', '#38bdf8', '#4ade80']

const CHART_TYPE_MAP = {
  barchart: 'bar',
  linechart: 'line',
  piechart: 'pie',
  scatterchart: 'scatter',
  areachart: 'area',
  composedchart: 'composed',
}

const toChartType = (value) => {
  if (!value) return 'bar'
  const normalized = String(value).toLowerCase().trim()
  return CHART_TYPE_MAP[normalized] ?? normalized
}

const normalizeParameters = (chartType, parameters) => {
  const payload = { ...parameters, chart_type: chartType }
  if (chartType === 'pie') {
    if (parameters?.name_key && !payload.x_axis) {
      payload.x_axis = parameters.name_key
    }
    if (parameters?.value_key && !payload.y_axis) {
      payload.y_axis = parameters.value_key
    }
  }
  return payload
}

const buildErrorMessage = async (response) => {
  try {
    const data = await response.json()
    return data?.detail ?? 'Error inesperado'
  } catch (error) {
    return 'Error inesperado'
  }
}

function App() {
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [datasetId, setDatasetId] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [dashboard, setDashboard] = useState([])
  const [hiddenSuggestionKeys, setHiddenSuggestionKeys] = useState(() => new Set())
  const [uploadError, setUploadError] = useState(null)

  const fileInputRef = useRef(null)

  const suggestMutation = useMutation({
    mutationFn: async (selectedFile) => {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const response = await fetch(`${API_BASE_URL}/charts/suggest`, {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error(await buildErrorMessage(response))
      }
      return response.json()
    },
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
      const payload = {
        dataset_id: datasetId,
        parameters: normalizeParameters(chartType, parameters),
      }
      const response = await fetch(`${API_BASE_URL}/charts/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error(await buildErrorMessage(response))
      }
      const data = await response.json()
      return { suggestionId, data: data?.data ?? [], chartType, parameters }
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

  const suggestionKey = (suggestion) =>
    `${suggestion.title}::${suggestion.chart_type}`

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

  const renderChart = (card) => {
    if (card.loading) {
      return <div className="chart-loading">Cargando grafico...</div>
    }
    if (card.error) {
      return <div className="chart-error">{card.error}</div>
    }
    if (!card.data?.length) {
      return <div className="chart-empty">Sin datos disponibles</div>
    }

    const params = card.parameters ?? {}
    const xKey = params.x_axis ?? params.name_key ?? 'x'
    const yKey = params.y_axis ?? params.value_key ?? 'y'
    const chartType = card.chartType

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={card.data} dataKey="value" nameKey="name" innerRadius={50}>
              {card.data.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'scatter') {
      return (
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis dataKey={yKey} />
            <Tooltip />
            <Scatter data={card.data} fill={CHART_COLORS[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={card.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey={yKey} stroke={CHART_COLORS[0]} fill="#1d4ed8" />
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={card.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke={CHART_COLORS[0]} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'composed') {
      const series = params.series ?? [{ type: 'line', y_axis: yKey }]
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={card.data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {series.map((serie, index) => {
              const serieKey = serie.y_axis ?? yKey
              const type = toChartType(serie.type)
              if (type === 'bar') {
                return (
                  <Bar
                    key={`${serieKey}-${index}`}
                    dataKey={serieKey}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                )
              }
              if (type === 'area') {
                return (
                  <Area
                    key={`${serieKey}-${index}`}
                    type="monotone"
                    dataKey={serieKey}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    fillOpacity={0.3}
                  />
                )
              }
              return (
                <Line
                  key={`${serieKey}-${index}`}
                  type="monotone"
                  dataKey={serieKey}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={card.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={yKey} fill={CHART_COLORS[0]} radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__badge">Dashboard Nocturno</div>
        <h1>Explora datos con graficos inteligentes</h1>
        <p>
          Sube un archivo, recibe sugerencias de analisis y construye tu tablero
          en segundos.
        </p>
      </header>

      <section className="panel panel--dashboard">
        <div className="panel__header">
          <div>
            <h2>Dashboard</h2>
            <p>Visualiza las metricas seleccionadas.</p>
          </div>
          <div className="chip chip--accent">{dashboard.length} graficos</div>
        </div>

        <div className="dashboard">
          {dashboard.length === 0 && (
            <div className="empty">
              Cuando agregues graficos, apareceran aqui.
            </div>
          )}
          {dashboard.map((card) => (
            <article key={card.id} className="chart-card">
              <header>
                <h3>{card.title}</h3>
                <div className="chart-card__actions">
                  <span className="chip chip--ghost">{card.chartType}</span>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => handleRemoveChart(card.id)}
                    aria-label="Eliminar grafico"
                  >
                    ✕
                  </button>
                </div>
              </header>
              <p>{card.insight}</p>
              <div className="chart-frame">{renderChart(card)}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Subir datos</h2>
            <p>Formatos compatibles: .csv y .xlsx</p>
          </div>
          <button
            type="button"
            className="action"
            onClick={handleUpload}
            disabled={!file || suggestMutation.isPending}
          >
            {suggestMutation.isPending ? 'Procesando...' : 'Enviar a la API'}
          </button>
        </div>

        <div
          className={`dropzone ${dragActive ? 'dropzone--active' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              fileInputRef.current?.click()
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            hidden
          />
          <div>
            <div className="dropzone__icon">⬆</div>
            <p className="dropzone__label">{fileLabel}</p>
            <span className="dropzone__hint">
              Arrastra y suelta o haz clic para seleccionar
            </span>
          </div>
        </div>

        {suggestMutation.isPending && (
          <div className="status">
            <span className="spinner" aria-hidden="true" />
            <span>Analizando sus datos...</span>
          </div>
        )}

        {uploadError && <div className="status status--error">{uploadError}</div>}
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <h2>Tarjetas de Analisis</h2>
            <p>Selecciona los graficos que deseas agregar al tablero.</p>
          </div>
          <div className="chip">
            {suggestions.length - hiddenSuggestionKeys.size} sugerencias
          </div>
        </div>

        <div className="cards">
          {suggestions.filter((suggestion) => !hiddenSuggestionKeys.has(suggestionKey(suggestion))).length === 0 && (
            <div className="empty">Aun no hay sugerencias por mostrar.</div>
          )}
          {suggestions
            .filter((suggestion) => !hiddenSuggestionKeys.has(suggestionKey(suggestion)))
            .map((suggestion) => (
              <article className="card" key={suggestionKey(suggestion)}>
                <div>
                  <h3>{suggestion.title}</h3>
                  <p>{suggestion.insight}</p>
                </div>
                <div className="card__footer">
                  <span className="chip chip--ghost">
                    {toChartType(suggestion.chart_type)}
                  </span>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => handleAddChart(suggestion)}
                    disabled={!datasetId}
                  >
                    Agregar al Dashboard
                  </button>
                </div>
              </article>
            ))}
        </div>
      </section>
    </div>
  )
}

export default App
