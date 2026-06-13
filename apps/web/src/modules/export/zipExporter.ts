import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export interface ZipEntry {
  path: string
  blob: Blob
}

export async function downloadAsZip(entries: ZipEntry[], zipFilename: string): Promise<void> {
  const zip = new JSZip()
  for (const { path, blob } of entries) {
    zip.file(path, blob)
  }
  const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  saveAs(content, zipFilename)
}
