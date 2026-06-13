import type { Study } from '../types'

interface Props {
  totalFiles: number
  validDicomCount: number
  skippedCount: number
  studies: Study[]
  errors: string[]
  onContinue: () => void
  onClear: () => void
}

export function ImportReview({
  totalFiles,
  validDicomCount,
  skippedCount,
  studies,
  errors,
  onContinue,
  onClear,
}: Props) {
  const totalImages = studies.reduce(
    (n, s) => n + s.series.reduce((m, r) => m + r.images.length, 0),
    0
  )
  const totalSeries = studies.reduce((n, s) => n + s.series.length, 0)

  const rows = [
    ['Archivos seleccionados', totalFiles],
    ['Archivos DICOM válidos', validDicomCount],
    ['Omitidos (no son DICOM)', skippedCount],
    ['Estudios detectados', studies.length],
    ['Series detectadas', totalSeries],
    ['Imágenes totales', totalImages],
  ] as const

  return (
    <div
      style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' }}
      data-testid="import-review"
    >
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Resumen de importación</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '0.5rem 0', color: '#94a3b8' }}>{label}</td>
              <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {errors.length > 0 && (
        <div style={{
          background: '#1e1a00', border: '1px solid #713f12', borderRadius: '6px',
          padding: '0.75rem', marginBottom: '1rem',
        }}>
          <strong style={{ color: '#fbbf24' }}>Avisos ({errors.length})</strong>
          <ul style={{ color: '#fde68a', fontSize: '0.8rem', marginTop: '0.25rem', paddingLeft: '1rem' }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {validDicomCount === 0 ? (
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>
          No se encontraron archivos DICOM válidos. Por favor, selecciona archivos .dcm.
        </p>
      ) : (
        <button onClick={onContinue} style={{ ...primaryBtn, marginRight: '0.75rem' }}>
          Abrir visor →
        </button>
      )}
      <button onClick={onClear} style={secondaryBtn}>Empezar de nuevo</button>
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '0.65rem 1.5rem', background: '#1d4ed8', color: '#fff',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
}
const secondaryBtn: React.CSSProperties = {
  padding: '0.65rem 1.5rem', background: '#334155', color: '#fff',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
}
