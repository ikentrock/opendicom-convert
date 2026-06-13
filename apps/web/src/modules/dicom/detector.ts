const DICOM_MAGIC = [0x44, 0x49, 0x43, 0x4d] // 'DICM'
const DICOM_PREAMBLE_SIZE = 128
const MIN_DICOM_SIZE = DICOM_PREAMBLE_SIZE + DICOM_MAGIC.length

export function isDicom(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < MIN_DICOM_SIZE) return false
  const view = new Uint8Array(buffer, DICOM_PREAMBLE_SIZE, DICOM_MAGIC.length)
  return DICOM_MAGIC.every((byte, i) => view[i] === byte)
}

export async function isDicomFile(file: File): Promise<boolean> {
  const slice = file.slice(0, MIN_DICOM_SIZE)
  const buffer = await slice.arrayBuffer()
  return isDicom(buffer)
}
