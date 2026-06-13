import { describe, it, expect } from 'vitest'
import { groupIntoStudies } from '../../apps/web/src/modules/dicom/grouper'
import type { DicomFile } from '../../apps/web/src/types'

function makeFile(overrides: Partial<DicomFile['metadata']> = {}): DicomFile {
  return {
    file: new File([''], 'test.dcm'),
    imageId: `dicomfile:${Math.random()}`,
    metadata: {
      studyInstanceUID: 'study-1',
      seriesInstanceUID: 'series-1',
      sopInstanceUID: 'sop-1',
      instanceNumber: 1,
      modality: 'MR',
      studyDescription: 'Brain MRI',
      seriesDescription: 'T1',
      bodyPartExamined: undefined,
      rows: 512,
      columns: 512,
      transferSyntax: undefined,
      photometricInterpretation: undefined,
      ...overrides,
    },
  }
}

describe('groupIntoStudies', () => {
  it('returns an empty array for empty input', () => {
    expect(groupIntoStudies([])).toEqual([])
  })

  it('groups a single file into one study with one series', () => {
    const result = groupIntoStudies([makeFile()])
    expect(result).toHaveLength(1)
    expect(result[0].series).toHaveLength(1)
    expect(result[0].series[0].images).toHaveLength(1)
  })

  it('groups two files with the same UIDs into one study and one series', () => {
    const result = groupIntoStudies([
      makeFile({ sopInstanceUID: 'sop-1', instanceNumber: 1 }),
      makeFile({ sopInstanceUID: 'sop-2', instanceNumber: 2 }),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].series[0].images).toHaveLength(2)
  })

  it('separates files into distinct studies when studyInstanceUID differs', () => {
    const result = groupIntoStudies([
      makeFile({ studyInstanceUID: 'study-A' }),
      makeFile({ studyInstanceUID: 'study-B' }),
    ])
    expect(result).toHaveLength(2)
  })

  it('separates files into distinct series when seriesInstanceUID differs', () => {
    const result = groupIntoStudies([
      makeFile({ seriesInstanceUID: 'series-1' }),
      makeFile({ seriesInstanceUID: 'series-2' }),
    ])
    expect(result[0].series).toHaveLength(2)
  })

  it('sorts images by instanceNumber ascending', () => {
    const result = groupIntoStudies([
      makeFile({ instanceNumber: 3, sopInstanceUID: 'c' }),
      makeFile({ instanceNumber: 1, sopInstanceUID: 'a' }),
      makeFile({ instanceNumber: 2, sopInstanceUID: 'b' }),
    ])
    const images = result[0].series[0].images
    expect(images[0].metadata.instanceNumber).toBe(1)
    expect(images[1].metadata.instanceNumber).toBe(2)
    expect(images[2].metadata.instanceNumber).toBe(3)
  })

  it('assigns UNKNOWN as fallback studyInstanceUID', () => {
    const result = groupIntoStudies([makeFile({ studyInstanceUID: undefined })])
    expect(result[0].studyInstanceUID).toBe('UNKNOWN')
  })
})
