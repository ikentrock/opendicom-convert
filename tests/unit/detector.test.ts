import { describe, it, expect } from 'vitest'
import { isDicom } from '../../apps/web/src/modules/dicom/detector'

function makeDicomBuffer(): ArrayBuffer {
  const buf = new ArrayBuffer(200)
  const view = new Uint8Array(buf)
  view[128] = 0x44 // D
  view[129] = 0x49 // I
  view[130] = 0x43 // C
  view[131] = 0x4d // M
  return buf
}

describe('isDicom', () => {
  it('returns true for a buffer with DICM at offset 128', () => {
    expect(isDicom(makeDicomBuffer())).toBe(true)
  })

  it('returns false when buffer is all zeros', () => {
    expect(isDicom(new ArrayBuffer(200))).toBe(false)
  })

  it('returns false when buffer is shorter than 132 bytes', () => {
    expect(isDicom(new ArrayBuffer(100))).toBe(false)
  })

  it('returns false when DICM magic is at wrong offset', () => {
    const buf = new ArrayBuffer(200)
    const view = new Uint8Array(buf)
    view[0] = 0x44; view[1] = 0x49; view[2] = 0x43; view[3] = 0x4d
    expect(isDicom(buf)).toBe(false)
  })
})
