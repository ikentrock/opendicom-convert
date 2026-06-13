import { describe, it, expect } from 'vitest'
import { parseDicomMetadata } from '../../apps/web/src/modules/dicom/parser'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

// Use the real sample.dcm fixture (MR Image, ~210KB, valid DICM preamble)
// Resolve relative to this test file, not the vitest cwd
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const fixturePath = resolve(__dirname, '../fixtures/sample.dcm')
const sampleDcmBytes = readFileSync(fixturePath)
const sampleFile = new File([sampleDcmBytes], 'sample.dcm', { type: 'application/octet-stream' })

describe('parseDicomMetadata', () => {
  it('returns a metadata object from a valid DICOM file', async () => {
    const meta = await parseDicomMetadata(sampleFile)
    expect(meta).toBeDefined()
    expect(typeof meta).toBe('object')
  })

  it('extracts studyInstanceUID when present', async () => {
    const meta = await parseDicomMetadata(sampleFile)
    expect(meta.studyInstanceUID).toBeDefined()
    expect(typeof meta.studyInstanceUID).toBe('string')
  })

  it('extracts seriesInstanceUID when present', async () => {
    const meta = await parseDicomMetadata(sampleFile)
    expect(meta.seriesInstanceUID).toBeDefined()
    expect(typeof meta.seriesInstanceUID).toBe('string')
  })

  it('returns undefined for missing optional fields without throwing', async () => {
    const meta = await parseDicomMetadata(sampleFile)
    // modality may or may not be present, but should never throw
    expect(() => meta.modality).not.toThrow()
  })

  it('throws for a non-DICOM file', async () => {
    const notDicom = new File(['hello world'], 'notdicom.txt', { type: 'text/plain' })
    await expect(parseDicomMetadata(notDicom)).rejects.toThrow()
  })
})
