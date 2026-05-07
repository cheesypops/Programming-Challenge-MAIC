import LoadingStatus from './LoadingStatus.jsx'

const UploadPanel = ({
  dragActive,
  fileInputRef,
  fileLabel,
  hasFile,
  isPending,
  uploadError,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileChange,
  onUpload,
  onTriggerSelect,
}) => (
  <section className="panel">
    <div className="panel__header">
      <div>
        <h2>Subir datos</h2>
        <p>Formatos compatibles: .csv y .xlsx</p>
      </div>
      <button
        type="button"
        className="action"
        onClick={onUpload}
        disabled={!hasFile || isPending}
      >
        {isPending ? 'Procesando...' : 'Enviar a la API'}
      </button>
    </div>

    <div
      className={`dropzone ${dragActive ? 'dropzone--active' : ''} ${
        isPending ? 'dropzone--disabled' : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onTriggerSelect}
      role="button"
      tabIndex={isPending ? -1 : 0}
      onKeyDown={(event) => {
        if (isPending) return
        if (event.key === 'Enter') {
          onTriggerSelect()
        }
      }}
      aria-disabled={isPending}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx"
        onChange={onFileChange}
        hidden
        disabled={isPending}
      />
      <div>
        <div className="dropzone__icon">⬆</div>
        <p className="dropzone__label">{fileLabel}</p>
        <span className="dropzone__hint">
          Arrastra y suelta o haz clic para seleccionar
        </span>
      </div>
    </div>

    {isPending && <LoadingStatus />}

    {uploadError && <div className="status status--error">{uploadError}</div>}
  </section>
)

export default UploadPanel
