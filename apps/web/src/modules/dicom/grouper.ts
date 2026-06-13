import type { DicomFile, Series, Study } from '../../types'

export function groupIntoStudies(files: DicomFile[]): Study[] {
  const studyMap = new Map<string, Map<string, DicomFile[]>>()

  for (const f of files) {
    const studyUID = f.metadata.studyInstanceUID ?? 'UNKNOWN'
    const seriesUID = f.metadata.seriesInstanceUID ?? 'UNKNOWN'

    if (!studyMap.has(studyUID)) studyMap.set(studyUID, new Map())
    const seriesMap = studyMap.get(studyUID)!

    if (!seriesMap.has(seriesUID)) seriesMap.set(seriesUID, [])
    seriesMap.get(seriesUID)!.push(f)
  }

  return Array.from(studyMap.entries()).map(([studyUID, seriesMap]): Study => {
    const firstImage = Array.from(seriesMap.values())[0]?.[0]
    const series: Series[] = Array.from(seriesMap.entries()).map(([seriesUID, images]): Series => ({
      seriesInstanceUID: seriesUID,
      description: images[0]?.metadata.seriesDescription,
      images: images.slice().sort(
        (a, b) => (a.metadata.instanceNumber ?? 0) - (b.metadata.instanceNumber ?? 0)
      ),
    }))

    return {
      studyInstanceUID: studyUID,
      description: firstImage?.metadata.studyDescription,
      modality: firstImage?.metadata.modality,
      series,
    }
  })
}
