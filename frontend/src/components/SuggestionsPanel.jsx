const SuggestionsPanel = ({
  datasetId,
  hiddenSuggestionKeys,
  onAddChart,
  suggestions,
  suggestionKey,
  toChartType,
}) => {
  const visibleSuggestions = suggestions.filter(
    (suggestion) => !hiddenSuggestionKeys.has(suggestionKey(suggestion)),
  )

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <h2>Tarjetas de Análisis</h2>
          <p>Selecciona los gráficos que deseas agregar al tablero.</p>
        </div>
        <div className="chip">{visibleSuggestions.length} sugerencias</div>
      </div>

      <div className="cards">
        {visibleSuggestions.length === 0 && (
          <div className="empty">Aún no hay sugerencias por mostrar.</div>
        )}
        {visibleSuggestions.map((suggestion) => (
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
                onClick={() => onAddChart(suggestion)}
                disabled={!datasetId}
              >
                Agregar al Dashboard
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default SuggestionsPanel
