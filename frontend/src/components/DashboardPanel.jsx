import ChartRenderer from '../features/charts/ChartRenderer.jsx'

const DashboardPanel = ({ dashboard, onRemoveChart }) => (
  <section className="panel panel--dashboard">
    <div className="panel__header">
      <div>
        <h2>Dashboard</h2>
        <p>Visualiza las métricas seleccionadas.</p>
      </div>
      <div className="chip chip--accent">{dashboard.length} gráficos</div>
    </div>

    <div className="dashboard">
      {dashboard.length === 0 && (
        <div className="empty empty--full">
          Cuando agregues gráficos, apareceran aquí.
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
                onClick={() => onRemoveChart(card.id)}
                aria-label="Eliminar gráfico"
              >
                ✕
              </button>
            </div>
          </header>
          <p>{card.insight}</p>
          <div className="chart-frame">
            <ChartRenderer card={card} />
          </div>
        </article>
      ))}
    </div>
  </section>
)

export default DashboardPanel
