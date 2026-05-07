export const normalizeParameters = (chartType, parameters) => {
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

export const suggestionKey = (suggestion) =>
  `${suggestion.title}::${suggestion.chart_type}`
