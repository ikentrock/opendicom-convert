const SENSITIVE_PREFIXES = ['dicom', 'patient', 'study', 'series']

function hasSensitiveKey(storage: Storage): boolean {
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i) ?? ''
    if (SENSITIVE_PREFIXES.some(p => key.toLowerCase().startsWith(p))) return true
  }
  return false
}

export function validateNoStorage(): void {
  if (hasSensitiveKey(localStorage) || hasSensitiveKey(sessionStorage)) {
    throw new Error('[PrivacyGuard] medical data found in browser storage — this should never happen')
  }
}

export function clearSession(onCleared?: () => void): void {
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? ''
    if (SENSITIVE_PREFIXES.some(p => key.toLowerCase().startsWith(p))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))
  sessionStorage.clear()
  onCleared?.()
}

// Only installed in development mode to catch accidental uploads during development
export function installDevNetworkGuard(): void {
  // Guard: skip in Node.js / test environments where window is not available
  if (typeof window === 'undefined') return

  // Guard: skip in production builds (Vite sets import.meta.env.PROD)
  try {
    const env = (import.meta as { env?: { PROD?: boolean } }).env
    if (env?.PROD) return
  } catch {
    // import.meta not available — assume non-production
  }

  const originalFetch = window.fetch
  window.fetch = function (input, init) {
    const body = init?.body
    if (body instanceof ArrayBuffer || body instanceof Blob) {
      console.error('[PrivacyGuard] Binary fetch detected — potential DICOM upload!', input)
    }
    return originalFetch.call(this, input, init)
  }

  const originalXhrSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function (body) {
    if (body instanceof ArrayBuffer || body instanceof Blob) {
      console.error('[PrivacyGuard] Binary XHR send detected!', this)
    }
    return originalXhrSend.call(this, body)
  }
}
