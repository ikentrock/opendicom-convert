import { useReducer, useCallback, useState } from 'react'
import type { AppState, AppAction, ExportOptions } from './types'
import { HomeScreen } from './components/HomeScreen'
import { ImportReview } from './components/ImportReview'
import { ViewerScreen } from './components/ViewerScreen'
import { isDicomFile } from './modules/dicom/detector'
import { parseDicomMetadata } from './modules/dicom/parser'
import { groupIntoStudies } from './modules/dicom/grouper'
import { getImageIdForFile } from './modules/viewer/cornerstoneInit'
import { clearSession } from './modules/privacy/guard'
import type { DicomFile } from './types'

const INITIAL_EXPORT_OPTIONS: ExportOptions = {
  format: 'png',
  quality: 0.85,
  scope: 'current',
}

const INITIAL_STATE: AppState = {
  screen: 'home',
  rawFiles: [],
  dicomFiles: [],
  studies: [],
  selectedStudyUID: null,
  selectedSeriesUID: null,
  selectedImageId: null,
  exportOptions: INITIAL_EXPORT_OPTIONS,
  exportProgress: null,
  errors: [],
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'FILES_DROPPED':
      return { ...state, rawFiles: action.files }
    case 'DICOM_PARSED':
      return {
        ...state,
        dicomFiles: action.dicomFiles,
        studies: action.studies,
        errors: action.errors,
        screen: 'review',
      }
    case 'GO_TO_VIEWER':
      return { ...state, screen: 'viewer' }
    case 'IMAGE_SELECTED':
      return {
        ...state,
        selectedStudyUID: action.studyUID,
        selectedSeriesUID: action.seriesUID,
        selectedImageId: action.imageId,
      }
    case 'EXPORT_OPTIONS_CHANGED':
      return { ...state, exportOptions: { ...state.exportOptions, ...action.options } }
    case 'EXPORT_STARTED':
      return { ...state, exportProgress: { current: 0, total: action.total } }
    case 'EXPORT_PROGRESS':
      return {
        ...state,
        exportProgress: state.exportProgress
          ? { ...state.exportProgress, current: action.current }
          : { current: action.current, total: 0 },
      }
    case 'EXPORT_COMPLETE':
      return { ...state, exportProgress: null }
    case 'SESSION_CLEARED':
      return { ...INITIAL_STATE }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const [loading, setLoading] = useState(false)

  const handleFiles = useCallback(async (files: File[]) => {
    setLoading(true)
    dispatch({ type: 'FILES_DROPPED', files })

    const dicomFiles: DicomFile[] = []
    const errors: string[] = []

    await Promise.all(
      files.map(async (file) => {
        try {
          const valid = await isDicomFile(file)
          if (!valid) return
          const metadata = await parseDicomMetadata(file)
          const imageId = getImageIdForFile(file)
          dicomFiles.push({ file, imageId, metadata })
        } catch (err) {
          errors.push(`${file.name}: ${(err as Error).message}`)
        }
      })
    )

    const studies = groupIntoStudies(dicomFiles)
    dispatch({ type: 'DICOM_PARSED', dicomFiles, studies, errors })
    setLoading(false)
  }, [])

  const handleClear = useCallback(() => {
    clearSession()
    dispatch({ type: 'SESSION_CLEARED' })
  }, [])

  const handleProgress = useCallback((current: number, total: number) => {
    if (current === 0 || (current === 1 && total > 0)) {
      dispatch({ type: 'EXPORT_STARTED', total })
    }
    dispatch({ type: 'EXPORT_PROGRESS', current })
  }, [])

  if (state.screen === 'home') {
    return <HomeScreen onFiles={handleFiles} loading={loading} />
  }

  if (state.screen === 'review') {
    return (
      <ImportReview
        totalFiles={state.rawFiles.length}
        validDicomCount={state.dicomFiles.length}
        skippedCount={state.rawFiles.length - state.dicomFiles.length}
        studies={state.studies}
        errors={state.errors}
        onContinue={() => dispatch({ type: 'GO_TO_VIEWER' })}
        onClear={handleClear}
      />
    )
  }

  return (
    <ViewerScreen
      studies={state.studies}
      exportOptions={state.exportOptions}
      onOptionsChange={(opts) => dispatch({ type: 'EXPORT_OPTIONS_CHANGED', options: opts })}
      onProgress={handleProgress}
      onExportDone={() => dispatch({ type: 'EXPORT_COMPLETE' })}
      exportProgress={state.exportProgress}
      onClear={handleClear}
    />
  )
}
