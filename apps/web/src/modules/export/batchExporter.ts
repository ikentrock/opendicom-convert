import type { DicomFile, ExportOptions, Study } from '../../types'
import { canvasToBlob, sequentialFilename } from './imageExporter'
import { downloadAsZip, type ZipEntry } from './zipExporter'
import type { Types } from '@cornerstonejs/core'
import { displayImage, captureCanvas } from '../viewer/viewport'

export interface BatchExportParams {
  scope: 'current' | 'series' | 'all'
  currentImageId: string
  studies: Study[]
  viewport: Types.IStackViewport
  options: ExportOptions
  onProgress: (current: number, total: number) => void
  signal: AbortSignal
}

function collectImages(params: BatchExportParams): DicomFile[] {
  const { scope, currentImageId, studies } = params
  if (scope === 'current') {
    for (const study of studies) {
      for (const series of study.series) {
        const match = series.images.find(f => f.imageId === currentImageId)
        if (match) return [match]
      }
    }
    return []
  }
  if (scope === 'series') {
    for (const study of studies) {
      for (const series of study.series) {
        if (series.images.some(f => f.imageId === currentImageId)) {
          return series.images
        }
      }
    }
    return []
  }
  // 'all'
  return studies.flatMap(s => s.series.flatMap(r => r.images))
}

export async function runBatchExport(params: BatchExportParams): Promise<void> {
  const { viewport, options, onProgress, signal } = params
  const images = collectImages(params)

  if (images.length === 0) throw new Error('No images to export')

  if (images.length === 1) {
    // Single image: direct download, no ZIP
    const canvas = await captureCanvas(viewport)
    const blob = await canvasToBlob(canvas, options.format, options.quality)
    const filename = sequentialFilename(0, options.format)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    onProgress(1, 1)
    return
  }

  // Multiple images: batch into ZIP
  const entries: ZipEntry[] = []
  for (let i = 0; i < images.length; i++) {
    if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError')

    const imageId = images[i].imageId
    await displayImage(viewport, [imageId])
    const canvas = await captureCanvas(viewport)
    const blob = await canvasToBlob(canvas, options.format, options.quality)
    entries.push({ path: sequentialFilename(i, options.format), blob })
    onProgress(i + 1, images.length)
  }

  await downloadAsZip(entries, `opendicom_export.zip`)
}
