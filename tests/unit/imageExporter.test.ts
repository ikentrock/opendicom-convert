import { describe, it, expect } from 'vitest'
import { canvasToBlob, sequentialFilename, seriesFilename } from '../../apps/web/src/modules/export/imageExporter'

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 100
  canvas.height = 100
  return canvas
}

describe('canvasToBlob', () => {
  it('returns a Blob for PNG format', async () => {
    const blob = await canvasToBlob(makeCanvas(), 'png')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })

  it('returns a Blob for JPEG format', async () => {
    const blob = await canvasToBlob(makeCanvas(), 'jpeg', 0.8)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/jpeg')
  })

  it('throws when canvas.toBlob returns null', async () => {
    const canvas = makeCanvas()
    canvas.toBlob = (cb) => cb(null)
    await expect(canvasToBlob(canvas, 'png')).rejects.toThrow(/Canvas export failed/)
  })

  it('passes quality parameter for JPEG', async () => {
    const calls: number[] = []
    const canvas = makeCanvas()
    canvas.toBlob = (cb, _type, quality) => {
      calls.push(quality as number)
      cb(new Blob([''], { type: 'image/jpeg' }))
    }
    await canvasToBlob(canvas, 'jpeg', 0.72)
    expect(calls[0]).toBe(0.72)
  })
})

describe('sequentialFilename', () => {
  it('generates zero-padded PNG filename', () => {
    expect(sequentialFilename(0, 'png')).toBe('image_000001.png')
    expect(sequentialFilename(99, 'png')).toBe('image_000100.png')
  })

  it('generates JPG extension for jpeg format', () => {
    expect(sequentialFilename(0, 'jpeg')).toBe('image_000001.jpg')
  })
})

describe('seriesFilename', () => {
  it('generates nested study/series/image path', () => {
    expect(seriesFilename(0, 0, 0, 'png')).toBe('study_001/series_001/image_000001.png')
    expect(seriesFilename(1, 2, 9, 'jpeg')).toBe('study_002/series_003/image_000010.jpg')
  })
})
