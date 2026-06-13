// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateNoStorage, clearSession } from '../../apps/web/src/modules/privacy/guard'

describe('validateNoStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('passes when storage is empty', () => {
    expect(() => validateNoStorage()).not.toThrow()
  })

  it('throws when localStorage contains a key starting with "dicom"', () => {
    localStorage.setItem('dicom-patient', 'John Doe')
    expect(() => validateNoStorage()).toThrow(/medical data/)
  })

  it('throws when sessionStorage contains a key starting with "dicom"', () => {
    sessionStorage.setItem('dicom-uid', '1.2.3')
    expect(() => validateNoStorage()).toThrow(/medical data/)
  })
})

describe('clearSession', () => {
  it('calls the provided cleanup function', () => {
    const cleanup = vi.fn()
    clearSession(cleanup)
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('clears localStorage entries with dicom prefix', () => {
    localStorage.setItem('dicom-tmp', 'x')
    localStorage.setItem('other-key', 'y')
    clearSession()
    expect(localStorage.getItem('dicom-tmp')).toBeNull()
    expect(localStorage.getItem('other-key')).toBe('y')
  })
})
