import type { ExportFormat, ExportOptions, ExportScope } from '../types'

interface Props {
  options: ExportOptions
  onChange: (opts: Partial<ExportOptions>) => void
  onExport: () => void
  disabled: boolean
}

export function ExportPanel({ options, onChange, onExport, disabled }: Props) {
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    color: '#64748b',
    marginBottom: '0.3rem',
  }
  const chipBtn = (active: boolean): React.CSSProperties => ({
    padding: '0.3rem 0.75rem',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 500,
    background: active ? '#1d4ed8' : '#334155',
  })

  return (
    <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '6px' }}>
      <h3 style={{
        fontSize: '0.9rem',
        fontWeight: 600,
        marginBottom: '1rem',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        Exportar
      </h3>

      <span style={labelStyle}>Formato</span>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {(['png', 'jpeg'] as ExportFormat[]).map(f => (
          <button key={f} onClick={() => onChange({ format: f })} style={chipBtn(options.format === f)}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {options.format === 'jpeg' && (
        <>
          <span style={labelStyle}>Calidad JPEG: {Math.round(options.quality * 100)}%</span>
          <input
            type="range"
            min={70}
            max={100}
            value={Math.round(options.quality * 100)}
            onChange={e => onChange({ quality: Number(e.target.value) / 100 })}
            style={{ width: '100%', marginBottom: '0.75rem' }}
          />
        </>
      )}

      <span style={labelStyle}>Alcance</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
        {([
          ['current', 'Imagen actual'],
          ['series', 'Serie completa'],
          ['all', 'Todo el estudio'],
        ] as [ExportScope, string][]).map(([value, label]) => (
          <label
            key={value}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            <input
              type="radio"
              name="export-scope"
              value={value}
              checked={options.scope === value}
              onChange={() => onChange({ scope: value })}
            />
            {label}
          </label>
        ))}
      </div>

      <button
        onClick={onExport}
        disabled={disabled}
        style={{
          padding: '0.65rem',
          background: disabled ? '#1e293b' : '#1d4ed8',
          color: disabled ? '#475569' : '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.9rem',
          fontWeight: 600,
          width: '100%',
        }}
      >
        {options.scope !== 'current' ? 'Exportar como ZIP' : 'Exportar'}
      </button>
    </div>
  )
}
