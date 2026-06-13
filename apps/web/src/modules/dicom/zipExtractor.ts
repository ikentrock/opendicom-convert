import JSZip from 'jszip'

export async function extractFilesFromZip(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(zipFile)
  const files: File[] = []

  await Promise.all(
    Object.entries(zip.files).map(async ([path, entry]) => {
      if (entry.dir) return
      const blob = await entry.async('blob')
      const filename = path.split('/').pop() ?? path
      files.push(new File([blob], filename, { type: 'application/octet-stream' }))
    })
  )

  return files
}
