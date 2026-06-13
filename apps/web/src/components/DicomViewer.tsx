import { useRef, useEffect } from 'react'
import type { Types } from '@cornerstonejs/core'
import { enableViewport, disableViewport, displayImage } from '../modules/viewer/viewport'

interface Props {
  imageIds: string[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onViewportReady: (viewport: Types.IStackViewport) => void
}

export function DicomViewer({ imageIds, currentIndex, onIndexChange, onViewportReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<Types.IStackViewport | null>(null)

  // Initialize viewport once on mount
  useEffect(() => {
    if (!containerRef.current) return
    const viewport = enableViewport(containerRef.current)
    viewportRef.current = viewport
    onViewportReady(viewport)
    return () => {
      disableViewport()
      viewportRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Display image when imageIds or currentIndex changes
  useEffect(() => {
    if (!viewportRef.current || imageIds.length === 0) return
    displayImage(viewportRef.current, imageIds, currentIndex).catch((err: unknown) => {
      console.error('Failed to display image:', err)
    })
  }, [imageIds, currentIndex])

  const navBtn: React.CSSProperties = {
    padding: '0.4rem 0.9rem',
    background: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          background: '#000',
          borderRadius: '4px',
          overflow: 'hidden',
          minHeight: '400px',
        }}
      />
      {imageIds.length > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.75rem',
          background: '#0f172a',
        }}>
          <button
            onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            style={navBtn}
          >
            ← Anterior
          </button>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {currentIndex + 1} / {imageIds.length}
          </span>
          <button
            onClick={() => onIndexChange(Math.min(imageIds.length - 1, currentIndex + 1))}
            disabled={currentIndex === imageIds.length - 1}
            style={navBtn}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
