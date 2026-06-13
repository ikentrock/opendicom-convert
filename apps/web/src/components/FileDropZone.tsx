import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'

interface Props {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function FileDropZone({ onFiles, disabled = false }: Props) {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const files: File[] = []
    if (e.dataTransfer.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i]
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
    } else {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        files.push(e.dataTransfer.files[i])
      }
    }
    if (files.length > 0) onFiles(files)
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onFiles(files)
    e.target.value = ''
  }

  const btnStyle: React.CSSProperties = {
    padding: '0.6rem 1.25rem',
    background: disabled ? '#1e293b' : '#1d4ed8',
    color: disabled ? '#475569' : '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? '#4ade80' : '#475569'}`,
        borderRadius: '12px',
        padding: '3rem 2rem',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'default',
        transition: 'border-color 0.2s',
        background: dragging ? 'rgba(74,222,128,0.05)' : 'transparent',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
        Arrastra archivos DICOM aquí, o usa los botones de abajo
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          style={btnStyle}
        >
          Seleccionar archivos (.dcm)
        </button>
        <button
          onClick={() => folderInputRef.current?.click()}
          disabled={disabled}
          style={{ ...btnStyle, background: disabled ? '#1e293b' : '#334155' }}
        >
          Seleccionar carpeta
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".dcm,application/dicom"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
        data-testid="file-input"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is non-standard but supported by Chrome/Edge/Firefox
        webkitdirectory=""
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
        data-testid="folder-input"
      />
    </div>
  )
}
