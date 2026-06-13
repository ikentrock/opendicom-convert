import '@testing-library/jest-dom'

// Node.js 26 adds experimental localStorage/sessionStorage globals that are undefined
// unless --localstorage-file is set. This shadows jsdom's versions in the global scope.
// Provide in-memory implementations so tests that rely on Web Storage APIs work correctly.
function makeStorage(): Storage {
  let store: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(store).length
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null
    },
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null
    },
    setItem(key: string, value: string): void {
      store[key] = String(value)
    },
    removeItem(key: string): void {
      delete store[key]
    },
    clear(): void {
      store = {}
    },
  }
}

if (typeof localStorage === 'undefined' || localStorage === null) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: makeStorage(),
    writable: true,
    configurable: true,
  })
}
if (typeof sessionStorage === 'undefined' || sessionStorage === null) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: makeStorage(),
    writable: true,
    configurable: true,
  })
}

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
