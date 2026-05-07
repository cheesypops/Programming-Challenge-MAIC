export const CHART_COLORS = ['#30cfd0', '#fbbf24', '#f472b6', '#38bdf8', '#4ade80']

export const CHART_TYPE_MAP = {
  barchart: 'bar',
  linechart: 'line',
  piechart: 'pie',
  scatterchart: 'scatter',
  areachart: 'area',
  composedchart: 'composed',
}

export const toChartType = (value) => {
  if (!value) return 'bar'
  const normalized = String(value).toLowerCase().trim()
  return CHART_TYPE_MAP[normalized] ?? normalized
}
