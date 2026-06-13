import dicomParser from 'dicom-parser'
import type { DicomMetadata } from '../../types'

// DICOM tag constants (group+element as lowercase hex, 'x' prefix for dicom-parser)
const TAG = {
  TRANSFER_SYNTAX: 'x00020010',
  MODALITY:        'x00080060',
  STUDY_DESC:      'x00081030',
  SERIES_DESC:     'x0008103e',
  BODY_PART:       'x00180015',
  PHOTOMETRIC:     'x00280004',
  ROWS:            'x00280010',
  COLUMNS:         'x00280011',
  INSTANCE_NUM:    'x00200013',
  STUDY_UID:       'x0020000d',
  SERIES_UID:      'x0020000e',
  SOP_UID:         'x00080018',
} as const

function safeString(dataset: dicomParser.DataSet, tag: string): string | undefined {
  try {
    return dataset.string(tag)
  } catch {
    return undefined
  }
}

function safeUint16(dataset: dicomParser.DataSet, tag: string): number | undefined {
  try {
    return dataset.uint16(tag)
  } catch {
    return undefined
  }
}

function safeIntString(dataset: dicomParser.DataSet, tag: string): number | undefined {
  try {
    const v = dataset.intString(tag)
    return v ?? undefined
  } catch {
    return undefined
  }
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  // file.arrayBuffer() is not available in all environments (e.g. jsdom).
  // FileReader is universally supported across browsers and jsdom.
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export async function parseDicomMetadata(file: File): Promise<DicomMetadata> {
  const buffer = await readFileAsArrayBuffer(file)
  const byteArray = new Uint8Array(buffer)

  // Explicitly check the DICM magic at byte offset 128 (DICOM Part 10 preamble)
  if (
    byteArray.length < 132 ||
    byteArray[128] !== 0x44 ||
    byteArray[129] !== 0x49 ||
    byteArray[130] !== 0x43 ||
    byteArray[131] !== 0x4d
  ) {
    throw new Error('Not a valid DICOM Part 10 file')
  }

  // dicomParser.parseDicom throws on invalid/non-DICOM input
  const dataset = dicomParser.parseDicom(byteArray)

  return {
    transferSyntax:            safeString(dataset, TAG.TRANSFER_SYNTAX),
    modality:                  safeString(dataset, TAG.MODALITY),
    studyDescription:          safeString(dataset, TAG.STUDY_DESC),
    seriesDescription:         safeString(dataset, TAG.SERIES_DESC),
    bodyPartExamined:          safeString(dataset, TAG.BODY_PART),
    photometricInterpretation: safeString(dataset, TAG.PHOTOMETRIC),
    rows:                      safeUint16(dataset, TAG.ROWS),
    columns:                   safeUint16(dataset, TAG.COLUMNS),
    instanceNumber:            safeIntString(dataset, TAG.INSTANCE_NUM),
    studyInstanceUID:          safeString(dataset, TAG.STUDY_UID),
    seriesInstanceUID:         safeString(dataset, TAG.SERIES_UID),
    sopInstanceUID:            safeString(dataset, TAG.SOP_UID),
  }
}
