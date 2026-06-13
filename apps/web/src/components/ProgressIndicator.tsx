interface Props {
  current: number
  total: number
  onCancel: () => void
}

export function ProgressIndicator({ current, total, onCancel }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
        <span style={{ color: '#94a3b8' }}>Exporting {current}/{total}…</span>
        <span style={{ color: '#e2e8f0' }}>{pct}%</span>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#1d4ed8', transition: 'width 0.2s' }} />
      </div>
      <button
        onClick={onCancel}
        style={{
          marginTop: '0.75rem',
          background: '#7f1d1d',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '0.3rem 0.75rem',
          cursor: 'pointer',
          fontSize: '0.8rem',
        }}
      >
        Cancel
      </button>
    </div>
  )
}
