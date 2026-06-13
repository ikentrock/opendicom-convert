import { PrivacyBanner } from './PrivacyBanner'
import { FileDropZone } from './FileDropZone'

interface Props {
  onFiles: (files: File[]) => void
  loading: boolean
}

export function HomeScreen({ onFiles, loading }: Props) {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        OpenDICOM Convert
      </h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Abre archivos DICOM y conviértelos a PNG o JPG. Todo ocurre localmente en tu navegador.
      </p>

      <PrivacyBanner />

      <FileDropZone onFiles={onFiles} disabled={loading} />

      {loading && (
        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '1rem' }}>
          Analizando archivos…
        </p>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#475569', fontSize: '0.8rem' }}>
          ⚠️ No está indicado para diagnóstico, decisiones de tratamiento ni interpretación clínica.
          Consulta siempre a un profesional sanitario cualificado.
        </p>
      </div>
    </div>
  )
}
