import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart,
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
import { CHART_COLORS, toChartType } from '../../config/charts.js'

const ChartRenderer = ({ card }) => {
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
        <ComposedChart data={card.data}>
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
        </ComposedChart>
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
        <Bar dataKey={yKey} radius={[10, 10, 0, 0]}>
          {card.data.map((entry, index) => (
            <Cell
              key={`${entry?.[xKey] ?? 'bar'}-${index}`}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default ChartRenderer
