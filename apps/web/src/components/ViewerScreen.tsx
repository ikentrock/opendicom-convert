import { useState, useRef } from 'react'
import type { Types } from '@cornerstonejs/core'
import type { Study, ExportOptions } from '../types'
import { DicomViewer } from './DicomViewer'
import { ExportPanel } from './ExportPanel'
import { ProgressIndicator } from './ProgressIndicator'
import { runBatchExport } from '../modules/export/batchExporter'

interface Props {
  studies: Study[]
  exportOptions: ExportOptions
  onOptionsChange: (opts: Partial<ExportOptions>) => void
  onProgress: (current: number, total: number) => void
  onExportDone: () => void
  exportProgress: { current: number; total: number } | null
  onClear: () => void
}

export function ViewerScreen({
  studies,
  exportOptions,
  onOptionsChange,
  onProgress,
  onExportDone,
  exportProgress,
  onClear,
}: Props) {
  const [selectedStudyIdx, setSelectedStudyIdx] = useState(0)
  const [selectedSeriesIdx, setSelectedSeriesIdx] = useState(0)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const viewportRef = useRef<Types.IStackViewport | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const study = studies[selectedStudyIdx]
  const series = study?.series[selectedSeriesIdx]
  const imageIds = series?.images.map(f => f.imageId) ?? []

  async function handleExport() {
    if (!viewportRef.current || !series) return
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await runBatchExport({
        scope: exportOptions.scope,
        currentImageId: imageIds[selectedImageIdx],
        studies,
        viewport: viewportRef.current,
        options: exportOptions,
        onProgress,
        signal: controller.signal,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — not an error
      } else {
        console.error('Export failed:', err)
      }
    } finally {
      abortRef.current = null
      onExportDone()
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
  }

  const sidebarItemStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.4rem 0.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    background: active ? '#1e3a5f' : 'transparent',
    fontSize: '0.8rem',
    color: '#cbd5e1',
    userSelect: 'none',
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f1117' }}>
      {/* Left panel: study/series tree */}
      <div style={{
        width: '220px',
        minWidth: '220px',
        borderRight: '1px solid #1e293b',
        overflowY: 'auto',
        padding: '0.75rem',
      }}>
        <button
          onClick={onClear}
          style={{
            width: '100%',
            padding: '0.4rem',
            background: '#334155',
            color: '#e2e8f0',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            marginBottom: '0.75rem',
          }}
        >
          ← Start over
        </button>
        {studies.map((s, si) => (
          <div key={s.studyInstanceUID} style={{ marginBottom: '0.5rem' }}>
            <div
              onClick={() => { setSelectedStudyIdx(si); setSelectedSeriesIdx(0); setSelectedImageIdx(0) }}
              style={sidebarItemStyle(selectedStudyIdx === si)}
            >
              📋 {s.description ?? `Study ${si + 1}`}
            </div>
            {selectedStudyIdx === si && s.series.map((r, ri) => (
              <div
                key={r.seriesInstanceUID}
                onClick={() => { setSelectedSeriesIdx(ri); setSelectedImageIdx(0) }}
                style={{
                  ...sidebarItemStyle(selectedSeriesIdx === ri),
                  paddingLeft: '1rem',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                }}
              >
                🔹 {r.description ?? `Series ${ri + 1}`} ({r.images.length})
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Center: viewer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0.5rem' }}>
        <DicomViewer
          imageIds={imageIds}
          currentIndex={selectedImageIdx}
          onIndexChange={setSelectedImageIdx}
          onViewportReady={(vp) => { viewportRef.current = vp }}
        />
      </div>

      {/* Right panel: export */}
      <div style={{
        width: '220px',
        minWidth: '220px',
        borderLeft: '1px solid #1e293b',
        padding: '0.75rem',
        overflowY: 'auto',
      }}>
        {exportProgress ? (
          <ProgressIndicator
            current={exportProgress.current}
            total={exportProgress.total}
            onCancel={handleCancel}
          />
        ) : (
          <ExportPanel
            options={exportOptions}
            onChange={onOptionsChange}
            onExport={handleExport}
            disabled={imageIds.length === 0}
          />
        )}
      </div>
    </div>
  )
}
