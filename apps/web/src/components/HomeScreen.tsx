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
        Open DICOM files and convert them to PNG or JPG. Everything happens locally in your browser.
      </p>

      <PrivacyBanner />

      <FileDropZone onFiles={onFiles} disabled={loading} />

      {loading && (
        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '1rem' }}>
          Scanning files…
        </p>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#475569', fontSize: '0.8rem' }}>
          ⚠️ Not intended for diagnosis, treatment decisions, or clinical interpretation.
          Always consult a qualified healthcare professional.
        </p>
      </div>
    </div>
  )
}
