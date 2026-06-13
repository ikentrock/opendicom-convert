import type { ExportFormat } from '../../types'

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas export failed — canvas may be empty or tainted'))
      },
      `image/${format}`,
      format === 'jpeg' ? quality : undefined
    )
  })
}

export function sequentialFilename(index: number, format: ExportFormat): string {
  const ext = format === 'jpeg' ? 'jpg' : 'png'
  return `image_${String(index + 1).padStart(6, '0')}.${ext}`
}

export function seriesFilename(
  studyIndex: number,
  seriesIndex: number,
  imageIndex: number,
  format: ExportFormat
): string {
  const ext = format === 'jpeg' ? 'jpg' : 'png'
  const s = (n: number) => String(n + 1).padStart(3, '0')
  return `study_${s(studyIndex)}/series_${s(seriesIndex)}/image_${String(imageIndex + 1).padStart(6, '0')}.${ext}`
}
