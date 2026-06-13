import { init as initCore } from '@cornerstonejs/core'
import { wadouri, init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader'
import {
  init as initTools,
  addTool,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
} from '@cornerstonejs/tools'

let initialized = false

export async function initCornerstone(): Promise<void> {
  if (initialized) return

  await initCore()

  dicomImageLoaderInit({ maxWebWorkers: 1 })

  await initTools()

  // Register tools globally once
  addTool(WindowLevelTool)
  addTool(PanTool)
  addTool(ZoomTool)
  addTool(StackScrollTool)

  initialized = true
}

export function getImageIdForFile(file: File): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (wadouri as any).fileManager.add(file)
}
