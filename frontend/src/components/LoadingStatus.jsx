const LoadingStatus = () => (
  <div className="status status--loading">
    <div className="status__glow" aria-hidden="true" />
    <div className="status__content">
      <span className="spinner" aria-hidden="true" />
      <div>
        <span className="status__title">Analizando sus datos...</span>
        <span className="status__subtitle">Preparando graficos y hallazgos</span>
      </div>
    </div>
  </div>
)

export default LoadingStatus
