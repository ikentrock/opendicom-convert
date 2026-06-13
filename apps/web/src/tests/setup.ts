import '@testing-library/jest-dom'

// Canvas.toBlob is not implemented in jsdom — stub for unit tests
HTMLCanvasElement.prototype.toBlob = function (
  callback: BlobCallback,
  type?: string,
  _quality?: unknown
) {
  const blob = new Blob([''], { type: type ?? 'image/png' })
  callback(blob)
}

// Canvas.getContext returns null in jsdom — stub so unit tests that create canvases don't crash
const originalGetContext = HTMLCanvasElement.prototype.getContext
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(HTMLCanvasElement.prototype as any).getContext = function (contextId: string, options?: unknown) {
  if (contextId === 'webgl' || contextId === 'webgl2') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return originalGetContext.call(this, contextId as any, options as any)
}
