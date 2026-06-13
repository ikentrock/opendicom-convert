export interface DicomFile {
  file: File
  imageId: string     // Assigned by Cornerstone's fileManager
  metadata: DicomMetadata
}

export interface DicomMetadata {
  // Safe display fields
  modality: string | undefined
  studyDescription: string | undefined
  seriesDescription: string | undefined
  bodyPartExamined: string | undefined
  rows: number | undefined
  columns: number | undefined
  instanceNumber: number | undefined
  transferSyntax: string | undefined
  photometricInterpretation: string | undefined
  // Grouping keys (displayed anonymously — no patient data)
  studyInstanceUID: string | undefined
  seriesInstanceUID: string | undefined
  sopInstanceUID: string | undefined
}

export interface Series {
  seriesInstanceUID: string
  description: string | undefined
  images: DicomFile[]
}

export interface Study {
  studyInstanceUID: string
  description: string | undefined
  modality: string | undefined
  series: Series[]
}

export type ExportFormat = 'png' | 'jpeg'
export type ExportScope = 'current' | 'series' | 'all'

export interface ExportOptions {
  format: ExportFormat
  quality: number          // 0.7–1.0, only used for jpeg
  scope: ExportScope
}

export type AppScreen = 'home' | 'review' | 'viewer'

export interface AppState {
  screen: AppScreen
  rawFiles: File[]             // Files selected by user
  dicomFiles: DicomFile[]      // Validated DICOM files
  studies: Study[]
  selectedStudyUID: string | null
  selectedSeriesUID: string | null
  selectedImageId: string | null
  exportOptions: ExportOptions
  exportProgress: { current: number; total: number } | null
  errors: string[]
}

export type AppAction =
  | { type: 'FILES_DROPPED'; files: File[] }
  | { type: 'DICOM_PARSED'; dicomFiles: DicomFile[]; studies: Study[]; errors: string[] }
  | { type: 'GO_TO_VIEWER' }
  | { type: 'IMAGE_SELECTED'; studyUID: string; seriesUID: string; imageId: string }
  | { type: 'EXPORT_OPTIONS_CHANGED'; options: Partial<ExportOptions> }
  | { type: 'EXPORT_STARTED'; total: number }
  | { type: 'EXPORT_PROGRESS'; current: number }
  | { type: 'EXPORT_COMPLETE' }
  | { type: 'SESSION_CLEARED' }
