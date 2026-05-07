import { API_BASE_URL } from '../config/api.js'
import { buildErrorMessage } from '../utils/errors.js'

export const suggestCharts = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_BASE_URL}/charts/suggest`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    throw new Error(await buildErrorMessage(response))
  }
  return response.json()
}

export const fetchChartData = async ({ datasetId, chartType, parameters }) => {
  const response = await fetch(`${API_BASE_URL}/charts/data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dataset_id: datasetId,
      parameters: { ...parameters, chart_type: chartType },
    }),
  })
  if (!response.ok) {
    throw new Error(await buildErrorMessage(response))
  }
  return response.json()
}
