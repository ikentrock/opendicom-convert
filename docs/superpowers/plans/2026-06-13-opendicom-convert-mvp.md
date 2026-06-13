# OpenDICOM Convert — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only, privacy-first web app that opens local DICOM medical image files and exports them as PNG, JPG, or ZIP — zero patient data leaves the device.

**Architecture:** Single-page React 18 app served as a static site. DICOM files are read via the File API, detected and parsed by `dicom-parser`, rendered by Cornerstone3D in a WebGL canvas, and exported using Canvas API + JSZip. No backend. No network requests containing patient data are ever made.

**Tech Stack:** React 18 · TypeScript 5 · Vite 5 · `@cornerstonejs/core` + `@cornerstonejs/dicom-image-loader` + `@cornerstonejs/tools` · `dicom-parser` · `jszip` · `file-saver` · Vitest · Playwright

**Working directory:** `/Users/luisenramos/Documents/opendicom/`
**Sample DICOM fixture:** `tests/fixtures/sample.dcm` (MR Image, ~210KB, DICM preamble at byte 128)

---

## File Structure

All new files to create (nothing pre-exists except `results.zip` and `tests/fixtures/sample.dcm`):

```
apps/web/
├── index.html                            Vite entry point
├── package.json                          Dependencies + scripts
├── tsconfig.json                         TypeScript config
├── vite.config.ts                        Vite config with Cornerstone3D setup
├── vitest.config.ts                      Unit test runner config
├── playwright.config.ts                  E2E test config
└── src/
    ├── types.ts                          DicomFile | Study | Series | AppState types
    ├── main.tsx                          Entry point — Cornerstone init + React render
    ├── App.tsx                           Root component with useReducer state machine
    ├── modules/
    │   ├── dicom/
    │   │   ├── detector.ts               isDicom(buffer: ArrayBuffer): boolean
    │   │   ├── parser.ts                 parseDicomMetadata(file: File): Promise<DicomMetadata>
    │   │   └── grouper.ts               groupIntoStudies(files: DicomFile[]): Study[]
    │   ├── viewer/
    │   │   ├── cornerstoneInit.ts        initCornerstone(): Promise<void> — one-time setup
    │   │   └── viewport.ts             createViewport / displayImage / captureCanvas
    │   ├── export/
    │   │   ├── imageExporter.ts          canvasToBlob(canvas, format, quality): Promise<Blob>
    │   │   ├── zipExporter.ts            blobsToZip(entries[], filename): Promise<void>
    │   │   └── batchExporter.ts          runBatchExport({ files, onProgress, signal })
    │   └── privacy/
    │       └── guard.ts                  clearSession() | validateNoStorage()
    └── components/
        ├── HomeScreen.tsx                Landing page with drag/drop
        ├── FileDropZone.tsx              Reusable drop zone + file/folder picker
        ├── PrivacyBanner.tsx             "Processed locally" notice
        ├── ImportReview.tsx              File scan summary screen
        ├── ViewerScreen.tsx              3-panel layout (sidebar + viewer + export)
        ├── DicomViewer.tsx               Cornerstone canvas component + nav
        ├── ExportPanel.tsx               Format / scope / quality options
        └── ProgressIndicator.tsx         Progress bar + cancel button

tests/
├── unit/
│   ├── detector.test.ts
│   ├── parser.test.ts
│   ├── grouper.test.ts
│   ├── imageExporter.test.ts
│   └── guard.test.ts
├── e2e/
│   ├── noUpload.spec.ts                  Verify no network requests with DICOM data
│   ├── fileImport.spec.ts               Import flow
│   └── export.spec.ts                   Export to PNG + ZIP
└── fixtures/
    └── sample.dcm                        Already extracted — MR image ~210KB

docs/
├── architecture.md
├── privacy-model.md
└── limitations.md

README.md
LICENSE
PRIVACY.md
SECURITY.md
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`

- [ ] **Step 1: Create project directory and package.json**

```bash
mkdir -p apps/web/src/modules/dicom apps/web/src/modules/viewer apps/web/src/modules/export apps/web/src/modules/privacy apps/web/src/components apps/web/public
```

Create `apps/web/package.json`:
```json
{
  "name": "opendicom-convert",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@cornerstonejs/core": "^3.0.0",
    "@cornerstonejs/dicom-image-loader": "^3.0.0",
    "@cornerstonejs/tools": "^3.0.0",
    "dicom-parser": "^1.8.21",
    "file-saver": "^2.0.5",
    "jszip": "^3.10.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.2",
    "@testing-library/jest-dom": "^6.6.2",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/file-saver": "^2.0.7",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.5"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd apps/web && npm install
```

Expected: `node_modules/` created, `package-lock.json` written. No errors.

- [ ] **Step 3: Create tsconfig.json**

Create `apps/web/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create index.html**

Create `apps/web/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Open DICOM medical images and export to PNG or JPG. Everything happens locally in your browser." />
    <title>OpenDICOM Convert</title>
    <!--
      Production CSP (add via server headers or _headers file, not here — blocks Vite HMR in dev):
      Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self' blob:;
        img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; connect-src 'none';
        object-src 'none'; base-uri 'none'; form-action 'none';
    -->
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: system-ui, -apple-system, sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create placeholder main.tsx**

Create `apps/web/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 6: Create placeholder App.tsx**

Create `apps/web/src/App.tsx`:
```tsx
export default function App() {
  return <div style={{ padding: '2rem' }}>OpenDICOM Convert — Loading…</div>
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
cd apps/web && npm run dev
```

Expected: Vite starts on `http://localhost:5173`. Open in browser: see "OpenDICOM Convert — Loading…".

Stop server with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
cd ../.. && git init && git add apps/web/package.json apps/web/tsconfig.json apps/web/index.html apps/web/src/main.tsx apps/web/src/App.tsx
git commit -m "feat: scaffold React + TypeScript + Vite project"
```

---

## Task 2: Vite Configuration

**Files:**
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/vitest.config.ts`

Cornerstone3D uses internal web workers and has specific bundling requirements for Vite.

- [ ] **Step 1: Create vite.config.ts**

Create `apps/web/vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Cornerstone's DICOM image loader spawns workers internally — exclude from
    // pre-bundling so Vite doesn't rewrite its dynamic import paths.
    exclude: ['@cornerstonejs/dicom-image-loader'],
    include: ['dicom-parser'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          cornerstone: ['@cornerstonejs/core', '@cornerstonejs/tools'],
          dicom: ['@cornerstonejs/dicom-image-loader', 'dicom-parser'],
        },
      },
    },
  },
})
```

- [ ] **Step 2: Create vitest.config.ts**

Create `apps/web/vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
  },
})
```

- [ ] **Step 3: Create test setup file**

Create `apps/web/src/tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'

// Canvas.toBlob is not implemented in jsdom — provide a stub
HTMLCanvasElement.prototype.toBlob = function (
  callback: BlobCallback,
  type?: string,
  _quality?: unknown
) {
  const blob = new Blob([''], { type: type ?? 'image/png' })
  callback(blob)
}

// Canvas.getContext returns null in jsdom — stub for unit tests that don't render
const originalGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (contextId: string, options?: unknown) {
  if (contextId === 'webgl' || contextId === 'webgl2') return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return originalGetContext.call(this, contextId as any, options as any)
}
```

- [ ] **Step 4: Create playwright.config.ts**

Create `apps/web/playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '../../tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 5: Verify build compiles**

```bash
cd apps/web && npm run lint
```

Expected: No TypeScript errors.

- [ ] **Step 6: Commit**

```bash
cd ../.. && git add apps/web/vite.config.ts apps/web/vitest.config.ts apps/web/playwright.config.ts apps/web/src/tests/setup.ts
git commit -m "chore: add Vite/Vitest/Playwright config with Cornerstone3D workarounds"
```

---

## Task 3: TypeScript Types

**Files:**
- Create: `apps/web/src/types.ts`

- [ ] **Step 1: Write the type definitions**

Create `apps/web/src/types.ts`:
```typescript
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
```

- [ ] **Step 2: Verify types compile**

```bash
cd apps/web && npm run lint
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd ../.. && git add apps/web/src/types.ts
git commit -m "feat: add TypeScript types for DicomFile, Study, Series, AppState"
```

---

## Task 4: DICOM File Detector

**Files:**
- Create: `apps/web/src/modules/dicom/detector.ts`
- Test: `tests/unit/detector.test.ts`

Validates whether an `ArrayBuffer` contains a DICOM Part 10 file by checking for the `DICM` magic string at byte offset 128. Also accepts pre-Part-10 files by trying to parse the first tag.

- [ ] **Step 1: Write failing tests**

Create `tests/unit/detector.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { isDicom } from '../../apps/web/src/modules/dicom/detector'

function makeDicomBuffer(): ArrayBuffer {
  const buf = new ArrayBuffer(200)
  const view = new Uint8Array(buf)
  view[128] = 0x44 // D
  view[129] = 0x49 // I
  view[130] = 0x43 // C
  view[131] = 0x4d // M
  return buf
}

describe('isDicom', () => {
  it('returns true for a buffer with DICM at offset 128', () => {
    expect(isDicom(makeDicomBuffer())).toBe(true)
  })

  it('returns false when buffer is all zeros', () => {
    expect(isDicom(new ArrayBuffer(200))).toBe(false)
  })

  it('returns false when buffer is shorter than 132 bytes', () => {
    expect(isDicom(new ArrayBuffer(100))).toBe(false)
  })

  it('returns false when DICM magic is at wrong offset', () => {
    const buf = new ArrayBuffer(200)
    const view = new Uint8Array(buf)
    view[0] = 0x44; view[1] = 0x49; view[2] = 0x43; view[3] = 0x4d
    expect(isDicom(buf)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests and see them fail**

```bash
cd apps/web && npx vitest run ../../tests/unit/detector.test.ts 2>&1
```

Expected: `Error: Cannot find module '../../apps/web/src/modules/dicom/detector'`

- [ ] **Step 3: Implement detector.ts**

Create `apps/web/src/modules/dicom/detector.ts`:
```typescript
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
```

- [ ] **Step 4: Run tests and see them pass**

```bash
cd apps/web && npx vitest run ../../tests/unit/detector.test.ts 2>&1
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add apps/web/src/modules/dicom/detector.ts tests/unit/detector.test.ts
git commit -m "feat: add DICOM file detector with magic-byte check"
```

---

## Task 5: DICOM Metadata Parser

**Files:**
- Create: `apps/web/src/modules/dicom/parser.ts`
- Test: `tests/unit/parser.test.ts`

Parses safe (non-patient-identifying) metadata from a DICOM file using `dicom-parser`. Sensitive tags (patient name, ID, DOB) are never read into application state.

- [ ] **Step 1: Write failing tests**

Create `tests/unit/parser.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parseDicomMetadata } from '../../apps/web/src/modules/dicom/parser'
import { readFileSync } from 'node:fs'

// Use the real sample.dcm fixture
const sampleDcmBytes = readFileSync('tests/fixtures/sample.dcm')
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
```

- [ ] **Step 2: Run and see tests fail**

```bash
cd apps/web && npx vitest run ../../tests/unit/parser.test.ts 2>&1
```

Expected: Module not found error.

- [ ] **Step 3: Implement parser.ts**

Create `apps/web/src/modules/dicom/parser.ts`:
```typescript
import dicomParser from 'dicom-parser'
import type { DicomMetadata } from '../../types'

// DICOM tag constants (group/element in little-endian hex)
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

export async function parseDicomMetadata(file: File): Promise<DicomMetadata> {
  const buffer = await file.arrayBuffer()
  const byteArray = new Uint8Array(buffer)

  // dicomParser.parseDicom throws on invalid input
  const dataset = dicomParser.parseDicom(byteArray, {
    TransferSyntaxUID: safeString(
      dicomParser.parseDicom(byteArray.slice(0, 256)),
      TAG.TRANSFER_SYNTAX
    ),
  })

  return {
    transferSyntax:              safeString(dataset, TAG.TRANSFER_SYNTAX),
    modality:                    safeString(dataset, TAG.MODALITY),
    studyDescription:            safeString(dataset, TAG.STUDY_DESC),
    seriesDescription:           safeString(dataset, TAG.SERIES_DESC),
    bodyPartExamined:            safeString(dataset, TAG.BODY_PART),
    photometricInterpretation:   safeString(dataset, TAG.PHOTOMETRIC),
    rows:                        safeUint16(dataset, TAG.ROWS),
    columns:                     safeUint16(dataset, TAG.COLUMNS),
    instanceNumber:              safeIntString(dataset, TAG.INSTANCE_NUM),
    studyInstanceUID:            safeString(dataset, TAG.STUDY_UID),
    seriesInstanceUID:           safeString(dataset, TAG.SERIES_UID),
    sopInstanceUID:              safeString(dataset, TAG.SOP_UID),
  }
}
```

- [ ] **Step 4: Run and see tests pass**

```bash
cd apps/web && npx vitest run ../../tests/unit/parser.test.ts 2>&1
```

Expected: `5 passed`

Note: If dicom-parser throws on the nested call, simplify: replace the options object with just `dicomParser.parseDicom(byteArray)` — the transfer syntax will be auto-detected.

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add apps/web/src/modules/dicom/parser.ts tests/unit/parser.test.ts
git commit -m "feat: add DICOM metadata parser (safe fields only, no patient data)"
```

---

## Task 6: Study/Series Grouper

**Files:**
- Create: `apps/web/src/modules/dicom/grouper.ts`
- Test: `tests/unit/grouper.test.ts`

Groups an array of `DicomFile` objects into a nested `Study → Series → images` tree using Study and Series Instance UIDs.

- [ ] **Step 1: Write failing tests**

Create `tests/unit/grouper.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run and see tests fail**

```bash
cd apps/web && npx vitest run ../../tests/unit/grouper.test.ts 2>&1
```

Expected: Module not found.

- [ ] **Step 3: Implement grouper.ts**

Create `apps/web/src/modules/dicom/grouper.ts`:
```typescript
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
    const firstImage = seriesMap.values().next().value?.[0]
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
```

- [ ] **Step 4: Run and see tests pass**

```bash
cd apps/web && npx vitest run ../../tests/unit/grouper.test.ts 2>&1
```

Expected: `7 passed`

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add apps/web/src/modules/dicom/grouper.ts tests/unit/grouper.test.ts
git commit -m "feat: add study/series grouper with instance-number sorting"
```

---

## Task 7: Privacy Guard Module

**Files:**
- Create: `apps/web/src/modules/privacy/guard.ts`
- Test: `tests/unit/guard.test.ts`

Provides `clearSession()` (clears all in-memory DICOM state), `validateNoStorage()` (asserts no medical data was persisted), and a dev-mode network intercept that errors if binary data is POSTed.

- [ ] **Step 1: Write failing tests**

Create `tests/unit/guard.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateNoStorage, clearSession } from '../../apps/web/src/modules/privacy/guard'

describe('validateNoStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('passes when storage is empty', () => {
    expect(() => validateNoStorage()).not.toThrow()
  })

  it('throws when localStorage contains a key starting with "dicom"', () => {
    localStorage.setItem('dicom-patient', 'John Doe')
    expect(() => validateNoStorage()).toThrow(/medical data/)
  })

  it('throws when sessionStorage contains a key starting with "dicom"', () => {
    sessionStorage.setItem('dicom-uid', '1.2.3')
    expect(() => validateNoStorage()).toThrow(/medical data/)
  })
})

describe('clearSession', () => {
  it('calls the provided cleanup function', () => {
    const cleanup = vi.fn()
    clearSession(cleanup)
    expect(cleanup).toHaveBeenCalledOnce()
  })

  it('clears localStorage entries with dicom prefix', () => {
    localStorage.setItem('dicom-tmp', 'x')
    localStorage.setItem('other-key', 'y')
    clearSession()
    expect(localStorage.getItem('dicom-tmp')).toBeNull()
    expect(localStorage.getItem('other-key')).toBe('y')
  })
})
```

- [ ] **Step 2: Run and see tests fail**

```bash
cd apps/web && npx vitest run ../../tests/unit/guard.test.ts 2>&1
```

Expected: Module not found.

- [ ] **Step 3: Implement guard.ts**

Create `apps/web/src/modules/privacy/guard.ts`:
```typescript
const SENSITIVE_PREFIXES = ['dicom', 'patient', 'study', 'series']

function hasSensitiveKey(storage: Storage): boolean {
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i) ?? ''
    if (SENSITIVE_PREFIXES.some(p => key.toLowerCase().startsWith(p))) return true
  }
  return false
}

export function validateNoStorage(): void {
  if (hasSensitiveKey(localStorage) || hasSensitiveKey(sessionStorage)) {
    throw new Error('[PrivacyGuard] medical data found in browser storage — this should never happen')
  }
}

export function clearSession(onCleared?: () => void): void {
  // Remove any accidentally persisted DICOM-related keys
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i) ?? ''
    if (SENSITIVE_PREFIXES.some(p => key.toLowerCase().startsWith(p))) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k))
  sessionStorage.clear()
  onCleared?.()
}

// Call once at app startup in development to catch accidental uploads
export function installDevNetworkGuard(): void {
  if (import.meta.env.PROD) return

  const originalFetch = window.fetch
  window.fetch = function (input, init) {
    const body = init?.body
    if (body instanceof ArrayBuffer || body instanceof Blob) {
      console.error('[PrivacyGuard] Binary fetch detected — potential DICOM upload!', input)
    }
    return originalFetch.call(this, input, init)
  }

  const originalXhrSend = XMLHttpRequest.prototype.send
  XMLHttpRequest.prototype.send = function (body) {
    if (body instanceof ArrayBuffer || body instanceof Blob) {
      console.error('[PrivacyGuard] Binary XHR send detected!', this)
    }
    return originalXhrSend.call(this, body)
  }
}
```

- [ ] **Step 4: Run and see tests pass**

```bash
cd apps/web && npx vitest run ../../tests/unit/guard.test.ts 2>&1
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add apps/web/src/modules/privacy/guard.ts tests/unit/guard.test.ts
git commit -m "feat: add privacy guard — clear session, validate no storage, dev network monitor"
```

---

## Task 8: Cornerstone3D Initialization + Viewport

**Files:**
- Create: `apps/web/src/modules/viewer/cornerstoneInit.ts`
- Create: `apps/web/src/modules/viewer/viewport.ts`

Cornerstone3D cannot be unit-tested without WebGL, so there are no unit tests for this module. It is covered by Playwright E2E tests in Task 16.

- [ ] **Step 1: Create cornerstoneInit.ts**

Create `apps/web/src/modules/viewer/cornerstoneInit.ts`:
```typescript
import { init as initCore } from '@cornerstonejs/core'
import dicomImageLoader from '@cornerstonejs/dicom-image-loader'
import { init as initTools, addTool, WindowLevelTool, PanTool, ZoomTool, StackScrollMouseWheelTool } from '@cornerstonejs/tools'

let initialized = false

export async function initCornerstone(): Promise<void> {
  if (initialized) return

  await initCore()

  dicomImageLoader.init({ maxWebWorkers: 1 })

  await initTools()

  // Register tools globally once
  addTool(WindowLevelTool)
  addTool(PanTool)
  addTool(ZoomTool)
  addTool(StackScrollMouseWheelTool)

  initialized = true
}

export function getImageIdForFile(file: File): string {
  return dicomImageLoader.wadouri.fileManager.add(file)
}
```

- [ ] **Step 2: Create viewport.ts**

Create `apps/web/src/modules/viewer/viewport.ts`:
```typescript
import {
  RenderingEngine,
  Enums,
  type Types,
  eventTarget,
  Events,
} from '@cornerstonejs/core'
import {
  ToolGroupManager,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollMouseWheelTool,
  Enums as ToolEnums,
} from '@cornerstonejs/tools'

const ENGINE_ID = 'opendicom-engine'
const VIEWPORT_ID = 'main-viewport'
const TOOL_GROUP_ID = 'main-tool-group'

let renderingEngine: RenderingEngine | null = null

function getEngine(): RenderingEngine {
  if (!renderingEngine) {
    renderingEngine = new RenderingEngine(ENGINE_ID)
  }
  return renderingEngine
}

export function enableViewport(element: HTMLDivElement): Types.IStackViewport {
  const engine = getEngine()
  engine.enableElement({
    viewportId: VIEWPORT_ID,
    type: Enums.ViewportType.STACK,
    element,
    defaultOptions: { background: [0, 0, 0] as Types.Point3 },
  })

  // Set up tool group for this viewport
  let toolGroup = ToolGroupManager.getToolGroup(TOOL_GROUP_ID)
  if (!toolGroup) {
    toolGroup = ToolGroupManager.createToolGroup(TOOL_GROUP_ID)!
    toolGroup.addTool(WindowLevelTool.toolName)
    toolGroup.addTool(PanTool.toolName)
    toolGroup.addTool(ZoomTool.toolName)
    toolGroup.addTool(StackScrollMouseWheelTool.toolName)

    toolGroup.setToolActive(WindowLevelTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Primary }],
    })
    toolGroup.setToolActive(PanTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Auxiliary }],
    })
    toolGroup.setToolActive(ZoomTool.toolName, {
      bindings: [{ mouseButton: ToolEnums.MouseBindings.Secondary }],
    })
    toolGroup.setToolActive(StackScrollMouseWheelTool.toolName)
  }
  toolGroup.addViewport(VIEWPORT_ID, ENGINE_ID)

  return engine.getViewport(VIEWPORT_ID) as Types.IStackViewport
}

export function disableViewport(): void {
  if (!renderingEngine) return
  ToolGroupManager.getToolGroup(TOOL_GROUP_ID)?.removeViewports(ENGINE_ID, VIEWPORT_ID)
  renderingEngine.disableElement(VIEWPORT_ID)
}

export async function displayImage(
  viewport: Types.IStackViewport,
  imageIds: string[],
  index = 0
): Promise<void> {
  await viewport.setStack(imageIds, index)
  viewport.render()
}

export function captureCanvas(viewport: Types.IStackViewport): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const handler = () => {
      resolve(viewport.canvas)
    }
    eventTarget.addEventListener(Events.IMAGE_RENDERED, handler, { once: true } as EventListenerOptions)
    viewport.render()
  })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/web && npm run lint 2>&1
```

Expected: No errors. (Cornerstone3D types must be resolvable — if not, the npm install may not have completed correctly.)

- [ ] **Step 4: Commit**

```bash
cd ../.. && git add apps/web/src/modules/viewer/cornerstoneInit.ts apps/web/src/modules/viewer/viewport.ts
git commit -m "feat: add Cornerstone3D initialization and viewport management"
```

---

## Task 9: Image Exporter

**Files:**
- Create: `apps/web/src/modules/export/imageExporter.ts`
- Test: `tests/unit/imageExporter.test.ts`

Converts an `HTMLCanvasElement` to a `Blob` in the requested format.

- [ ] **Step 1: Write failing tests**

Create `tests/unit/imageExporter.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { canvasToBlob } from '../../apps/web/src/modules/export/imageExporter'

function makeCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 100
  canvas.height = 100
  return canvas
}

describe('canvasToBlob', () => {
  it('returns a Blob for PNG format', async () => {
    const blob = await canvasToBlob(makeCanvas(), 'png')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })

  it('returns a Blob for JPEG format', async () => {
    const blob = await canvasToBlob(makeCanvas(), 'jpeg', 0.8)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/jpeg')
  })

  it('throws when canvas.toBlob returns null', async () => {
    const canvas = makeCanvas()
    // Override the stub to return null
    canvas.toBlob = (cb) => cb(null)
    await expect(canvasToBlob(canvas, 'png')).rejects.toThrow(/Canvas export failed/)
  })

  it('uses quality parameter for JPEG', async () => {
    const calls: number[] = []
    const canvas = makeCanvas()
    canvas.toBlob = (cb, _type, quality) => {
      calls.push(quality as number)
      cb(new Blob([''], { type: 'image/jpeg' }))
    }
    await canvasToBlob(canvas, 'jpeg', 0.72)
    expect(calls[0]).toBe(0.72)
  })
})
```

- [ ] **Step 2: Run and see tests fail**

```bash
cd apps/web && npx vitest run ../../tests/unit/imageExporter.test.ts 2>&1
```

Expected: Module not found.

- [ ] **Step 3: Implement imageExporter.ts**

Create `apps/web/src/modules/export/imageExporter.ts`:
```typescript
import type { ExportFormat } from '../../types'

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas export failed — canvas may be empty or tainted'))
      },
      `image/${format}`,
      format === 'jpeg' ? quality : undefined
    )
  })
}

export function sequentialFilename(index: number, format: ExportFormat): string {
  return `image_${String(index + 1).padStart(6, '0')}.${format === 'jpeg' ? 'jpg' : 'png'}`
}

export function seriesFilename(
  studyIndex: number,
  seriesIndex: number,
  imageIndex: number,
  format: ExportFormat
): string {
  const ext = format === 'jpeg' ? 'jpg' : 'png'
  const s = (n: number) => String(n + 1).padStart(3, '0')
  return `study_${s(studyIndex)}/series_${s(seriesIndex)}/image_${String(imageIndex + 1).padStart(6, '0')}.${ext}`
}
```

- [ ] **Step 4: Run and see tests pass**

```bash
cd apps/web && npx vitest run ../../tests/unit/imageExporter.test.ts 2>&1
```

Expected: `4 passed`

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add apps/web/src/modules/export/imageExporter.ts tests/unit/imageExporter.test.ts
git commit -m "feat: add canvas-to-blob image exporter with sequential/series filename helpers"
```

---

## Task 10: ZIP Exporter + Batch Exporter

**Files:**
- Create: `apps/web/src/modules/export/zipExporter.ts`
- Create: `apps/web/src/modules/export/batchExporter.ts`

- [ ] **Step 1: Create zipExporter.ts**

Create `apps/web/src/modules/export/zipExporter.ts`:
```typescript
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
```

- [ ] **Step 2: Create batchExporter.ts**

Create `apps/web/src/modules/export/batchExporter.ts`:
```typescript
import type { DicomFile, ExportOptions, Study } from '../../types'
import { canvasToBlob, sequentialFilename, seriesFilename } from './imageExporter'
import { downloadAsZip, type ZipEntry } from './zipExporter'
import type { Types } from '@cornerstonejs/core'
import { displayImage, captureCanvas } from '../viewer/viewport'

export interface BatchExportParams {
  scope: 'current' | 'series' | 'all'
  currentImageId: string
  studies: Study[]
  viewport: Types.IStackViewport
  options: ExportOptions
  onProgress: (current: number, total: number) => void
  signal: AbortSignal
}

function collectImages(params: BatchExportParams): DicomFile[] {
  const { scope, currentImageId, studies } = params
  if (scope === 'current') {
    for (const study of studies) {
      for (const series of study.series) {
        const match = series.images.find(f => f.imageId === currentImageId)
        if (match) return [match]
      }
    }
    return []
  }
  if (scope === 'series') {
    for (const study of studies) {
      for (const series of study.series) {
        if (series.images.some(f => f.imageId === currentImageId)) {
          return series.images
        }
      }
    }
    return []
  }
  // 'all'
  return studies.flatMap(s => s.series.flatMap(r => r.images))
}

export async function runBatchExport(params: BatchExportParams): Promise<void> {
  const { viewport, options, onProgress, signal } = params
  const images = collectImages(params)

  if (images.length === 0) throw new Error('No images to export')

  if (images.length === 1) {
    // Single-image direct download
    const canvas = await captureCanvas(viewport)
    const blob = await canvasToBlob(canvas, options.format, options.quality)
    const filename = sequentialFilename(0, options.format)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    onProgress(1, 1)
    return
  }

  // Batch → ZIP
  const entries: ZipEntry[] = []
  for (let i = 0; i < images.length; i++) {
    if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError')

    const imageId = images[i].imageId
    await displayImage(viewport, [imageId])
    const canvas = await captureCanvas(viewport)
    const blob = await canvasToBlob(canvas, options.format, options.quality)
    entries.push({ path: sequentialFilename(i, options.format), blob })
    onProgress(i + 1, images.length)
  }

  await downloadAsZip(entries, `opendicom_export_${Date.now()}.zip`)
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/web && npm run lint 2>&1
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd ../.. && git add apps/web/src/modules/export/zipExporter.ts apps/web/src/modules/export/batchExporter.ts
git commit -m "feat: add ZIP exporter and batch export queue with progress + cancel"
```

---

## Task 11: Privacy Banner + File Drop Zone Components

**Files:**
- Create: `apps/web/src/components/PrivacyBanner.tsx`
- Create: `apps/web/src/components/FileDropZone.tsx`

- [ ] **Step 1: Create PrivacyBanner.tsx**

Create `apps/web/src/components/PrivacyBanner.tsx`:
```tsx
export function PrivacyBanner() {
  return (
    <div style={{
      background: '#0f4',
      color: '#000',
      padding: '0.5rem 1rem',
      borderRadius: '6px',
      fontSize: '0.85rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1.5rem',
    }}>
      <span>🔒</span>
      <span>
        <strong>Private by design.</strong> Files are processed locally in your browser and never uploaded to any server.
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create FileDropZone.tsx**

Create `apps/web/src/components/FileDropZone.tsx`:
```tsx
import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'

interface Props {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function FileDropZone({ onFiles, disabled = false }: Props) {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const items = e.dataTransfer.items
    const files: File[] = []
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }
    } else {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        files.push(e.dataTransfer.files[i])
      }
    }
    if (files.length > 0) onFiles(files)
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onFiles(files)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? '#4ade80' : '#475569'}`,
        borderRadius: '12px',
        padding: '3rem 2rem',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.2s',
        background: dragging ? 'rgba(74,222,128,0.05)' : 'transparent',
      }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
        Drag DICOM files here, or use the buttons below
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          style={btnStyle}
        >
          Select files (.dcm)
        </button>
        <button
          onClick={() => folderInputRef.current?.click()}
          disabled={disabled}
          style={{ ...btnStyle, background: '#334155' }}
        >
          Select folder
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".dcm,application/dicom"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
        data-testid="file-input"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is non-standard
        webkitdirectory=""
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInput}
        data-testid="folder-input"
      />
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: '0.6rem 1.25rem',
  background: '#1d4ed8',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 500,
}
```

- [ ] **Step 3: Commit**

```bash
cd ../.. && git add apps/web/src/components/PrivacyBanner.tsx apps/web/src/components/FileDropZone.tsx
git commit -m "feat: add PrivacyBanner and FileDropZone components"
```

---

## Task 12: Home Screen + Import Review Screen

**Files:**
- Create: `apps/web/src/components/HomeScreen.tsx`
- Create: `apps/web/src/components/ImportReview.tsx`

- [ ] **Step 1: Create HomeScreen.tsx**

Create `apps/web/src/components/HomeScreen.tsx`:
```tsx
import { PrivacyBanner } from './PrivacyBanner'
import { FileDropZone } from './FileDropZone'

interface Props {
  onFiles: (files: File[]) => void
  loading: boolean
}

export function HomeScreen({ onFiles, loading }: Props) {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
        OpenDICOM Convert
      </h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Open DICOM files and convert them to PNG or JPG. Everything happens locally in your browser.
      </p>

      <PrivacyBanner />

      <FileDropZone onFiles={onFiles} disabled={loading} />

      {loading && (
        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '1rem' }}>
          Scanning files…
        </p>
      )}

      <p style={{ color: '#475569', fontSize: '0.8rem', marginTop: '2rem', textAlign: 'center' }}>
        ⚠️ Not intended for diagnosis, treatment decisions, or clinical interpretation.
        Always consult a qualified healthcare professional.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create ImportReview.tsx**

Create `apps/web/src/components/ImportReview.tsx`:
```tsx
import type { Study } from '../types'

interface Props {
  totalFiles: number
  validDicomCount: number
  skippedCount: number
  studies: Study[]
  errors: string[]
  onContinue: () => void
  onClear: () => void
}

export function ImportReview({
  totalFiles,
  validDicomCount,
  skippedCount,
  studies,
  errors,
  onContinue,
  onClear,
}: Props) {
  const totalImages = studies.reduce(
    (n, s) => n + s.series.reduce((m, r) => m + r.images.length, 0),
    0
  )

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1rem' }} data-testid="import-review">
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Import Summary</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        <tbody>
          {[
            ['Files selected', totalFiles],
            ['Valid DICOM files', validDicomCount],
            ['Skipped (not DICOM)', skippedCount],
            ['Studies detected', studies.length],
            ['Series detected', studies.reduce((n, s) => n + s.series.length, 0)],
            ['Total images', totalImages],
          ].map(([label, value]) => (
            <tr key={label as string} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={{ padding: '0.5rem 0', color: '#94a3b8' }}>{label}</td>
              <td style={{ padding: '0.5rem 0', fontWeight: 600 }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {errors.length > 0 && (
        <div style={{ background: '#1e1a00', border: '1px solid #713f12', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem' }}>
          <strong style={{ color: '#fbbf24' }}>Warnings ({errors.length})</strong>
          <ul style={{ color: '#fde68a', fontSize: '0.8rem', marginTop: '0.25rem', paddingLeft: '1rem' }}>
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {validDicomCount === 0 ? (
        <p style={{ color: '#f87171', marginBottom: '1rem' }}>
          No valid DICOM files were found. Please select .dcm files.
        </p>
      ) : (
        <button onClick={onContinue} style={{ ...primaryBtn, marginRight: '0.75rem' }}>
          Open Viewer →
        </button>
      )}
      <button onClick={onClear} style={secondaryBtn}>Start over</button>
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '0.65rem 1.5rem', background: '#1d4ed8', color: '#fff',
  border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600,
}
const secondaryBtn: React.CSSProperties = {
  ...primaryBtn, background: '#334155',
}
```

- [ ] **Step 3: Commit**

```bash
cd ../.. && git add apps/web/src/components/HomeScreen.tsx apps/web/src/components/ImportReview.tsx
git commit -m "feat: add HomeScreen and ImportReview components"
```

---

## Task 13: Viewer Components

**Files:**
- Create: `apps/web/src/components/DicomViewer.tsx`
- Create: `apps/web/src/components/ProgressIndicator.tsx`
- Create: `apps/web/src/components/ExportPanel.tsx`
- Create: `apps/web/src/components/ViewerScreen.tsx`

- [ ] **Step 1: Create DicomViewer.tsx**

Create `apps/web/src/components/DicomViewer.tsx`:
```tsx
import { useRef, useEffect } from 'react'
import type { Types } from '@cornerstonejs/core'
import { enableViewport, disableViewport, displayImage } from '../modules/viewer/viewport'

interface Props {
  imageIds: string[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onViewportReady: (viewport: Types.IStackViewport) => void
}

export function DicomViewer({ imageIds, currentIndex, onIndexChange, onViewportReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<Types.IStackViewport | null>(null)

  // Initialize viewport once
  useEffect(() => {
    if (!containerRef.current) return
    const viewport = enableViewport(containerRef.current)
    viewportRef.current = viewport
    onViewportReady(viewport)
    return () => {
      disableViewport()
      viewportRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update image when imageIds or currentIndex changes
  useEffect(() => {
    if (!viewportRef.current || imageIds.length === 0) return
    displayImage(viewportRef.current, imageIds, currentIndex).catch((err) => {
      console.error('Failed to display image:', err)
    })
  }, [imageIds, currentIndex])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ flex: 1, background: '#000', borderRadius: '4px', overflow: 'hidden', minHeight: '400px' }}
      />
      {imageIds.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: '#0f172a' }}>
          <button
            onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            style={navBtn}
          >
            ← Prev
          </button>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {currentIndex + 1} / {imageIds.length}
          </span>
          <button
            onClick={() => onIndexChange(Math.min(imageIds.length - 1, currentIndex + 1))}
            disabled={currentIndex === imageIds.length - 1}
            style={navBtn}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  padding: '0.4rem 0.9rem', background: '#334155', color: '#e2e8f0',
  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem',
}
```

- [ ] **Step 2: Create ProgressIndicator.tsx**

Create `apps/web/src/components/ProgressIndicator.tsx`:
```tsx
interface Props {
  current: number
  total: number
  onCancel: () => void
}

export function ProgressIndicator({ current, total, onCancel }: Props) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  return (
    <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
        <span style={{ color: '#94a3b8' }}>Exporting {current}/{total}…</span>
        <span style={{ color: '#e2e8f0' }}>{pct}%</span>
      </div>
      <div style={{ background: '#1e293b', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#1d4ed8', transition: 'width 0.2s' }} />
      </div>
      <button onClick={onCancel} style={{ marginTop: '0.75rem', background: '#7f1d1d', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}>
        Cancel
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create ExportPanel.tsx**

Create `apps/web/src/components/ExportPanel.tsx`:
```tsx
import type { ExportFormat, ExportOptions, ExportScope } from '../types'

interface Props {
  options: ExportOptions
  onChange: (opts: Partial<ExportOptions>) => void
  onExport: () => void
  disabled: boolean
}

export function ExportPanel({ options, onChange, onExport, disabled }: Props) {
  return (
    <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '6px' }}>
      <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Export
      </h3>

      <label style={labelStyle}>Format</label>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {(['png', 'jpeg'] as ExportFormat[]).map(f => (
          <button
            key={f}
            onClick={() => onChange({ format: f })}
            style={{ ...chipBtn, background: options.format === f ? '#1d4ed8' : '#334155' }}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {options.format === 'jpeg' && (
        <>
          <label style={labelStyle}>JPEG quality: {Math.round(options.quality * 100)}%</label>
          <input
            type="range"
            min={70}
            max={100}
            value={Math.round(options.quality * 100)}
            onChange={e => onChange({ quality: Number(e.target.value) / 100 })}
            style={{ width: '100%', marginBottom: '0.75rem' }}
          />
        </>
      )}

      <label style={labelStyle}>Scope</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1rem' }}>
        {([
          ['current', 'Current image'],
          ['series', 'Whole series'],
          ['all', 'All images'],
        ] as [ExportScope, string][]).map(([value, label]) => (
          <label key={value} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
            <input
              type="radio"
              name="scope"
              value={value}
              checked={options.scope === value}
              onChange={() => onChange({ scope: value })}
            />
            {label}
          </label>
        ))}
      </div>

      <button onClick={onExport} disabled={disabled} style={{ ...primaryBtn, width: '100%' }}>
        Export{options.scope !== 'current' ? ' as ZIP' : ''}
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.3rem' }
const chipBtn: React.CSSProperties = { padding: '0.3rem 0.75rem', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff', fontSize: '0.85rem', fontWeight: 500 }
const primaryBtn: React.CSSProperties = { padding: '0.65rem', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }
```

- [ ] **Step 4: Create ViewerScreen.tsx**

Create `apps/web/src/components/ViewerScreen.tsx`:
```tsx
import { useState, useRef } from 'react'
import type { Types } from '@cornerstonejs/core'
import type { Study, ExportOptions } from '../types'
import { DicomViewer } from './DicomViewer'
import { ExportPanel } from './ExportPanel'
import { ProgressIndicator } from './ProgressIndicator'
import { runBatchExport } from '../modules/export/batchExporter'

interface Props {
  studies: Study[]
  exportOptions: ExportOptions
  onOptionsChange: (opts: Partial<ExportOptions>) => void
  onProgress: (current: number, total: number) => void
  onExportDone: () => void
  exportProgress: { current: number; total: number } | null
  onClear: () => void
}

export function ViewerScreen({
  studies,
  exportOptions,
  onOptionsChange,
  onProgress,
  onExportDone,
  exportProgress,
  onClear,
}: Props) {
  const [selectedStudyIdx, setSelectedStudyIdx] = useState(0)
  const [selectedSeriesIdx, setSelectedSeriesIdx] = useState(0)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const viewportRef = useRef<Types.IStackViewport | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const study = studies[selectedStudyIdx]
  const series = study?.series[selectedSeriesIdx]
  const imageIds = series?.images.map(f => f.imageId) ?? []

  async function handleExport() {
    if (!viewportRef.current || !study || !series) return
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await runBatchExport({
        scope: exportOptions.scope,
        currentImageId: imageIds[selectedImageIdx],
        studies,
        viewport: viewportRef.current,
        options: exportOptions,
        onProgress,
        signal: controller.signal,
      })
      onExportDone()
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Export failed:', err)
      }
    } finally {
      abortRef.current = null
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    onExportDone()
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f1117' }}>
      {/* Left panel: study/series tree */}
      <div style={{ width: '220px', borderRight: '1px solid #1e293b', overflowY: 'auto', padding: '0.75rem' }}>
        <button onClick={onClear} style={{ width: '100%', padding: '0.4rem', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          ← Start over
        </button>
        {studies.map((s, si) => (
          <div key={s.studyInstanceUID} style={{ marginBottom: '0.5rem' }}>
            <div
              onClick={() => { setSelectedStudyIdx(si); setSelectedSeriesIdx(0); setSelectedImageIdx(0) }}
              style={{ padding: '0.4rem 0.5rem', borderRadius: '4px', cursor: 'pointer', background: selectedStudyIdx === si ? '#1e3a5f' : 'transparent', fontSize: '0.8rem', color: '#cbd5e1' }}
            >
              📋 {s.description ?? `Study ${si + 1}`}
            </div>
            {selectedStudyIdx === si && s.series.map((r, ri) => (
              <div
                key={r.seriesInstanceUID}
                onClick={() => { setSelectedSeriesIdx(ri); setSelectedImageIdx(0) }}
                style={{ padding: '0.3rem 0.5rem 0.3rem 1rem', borderRadius: '4px', cursor: 'pointer', background: selectedSeriesIdx === ri ? '#1e293b' : 'transparent', fontSize: '0.75rem', color: '#94a3b8' }}
              >
                🔹 {r.description ?? `Series ${ri + 1}`} ({r.images.length})
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Center: viewer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <DicomViewer
          imageIds={imageIds}
          currentIndex={selectedImageIdx}
          onIndexChange={setSelectedImageIdx}
          onViewportReady={(vp) => { viewportRef.current = vp }}
        />
      </div>

      {/* Right panel: export */}
      <div style={{ width: '220px', borderLeft: '1px solid #1e293b', padding: '0.75rem', overflowY: 'auto' }}>
        {exportProgress ? (
          <ProgressIndicator
            current={exportProgress.current}
            total={exportProgress.total}
            onCancel={handleCancel}
          />
        ) : (
          <ExportPanel
            options={exportOptions}
            onChange={onOptionsChange}
            onExport={handleExport}
            disabled={imageIds.length === 0}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add apps/web/src/components/DicomViewer.tsx apps/web/src/components/ProgressIndicator.tsx apps/web/src/components/ExportPanel.tsx apps/web/src/components/ViewerScreen.tsx
git commit -m "feat: add DicomViewer, ExportPanel, ProgressIndicator, ViewerScreen components"
```

---

## Task 14: App State Machine + Main Entry

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/main.tsx`

Wires all modules and screens together using a `useReducer` state machine.

- [ ] **Step 1: Rewrite App.tsx**

Replace `apps/web/src/App.tsx` with:
```tsx
import { useReducer, useCallback } from 'react'
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
      return { ...state, rawFiles: action.files, screen: 'home' }
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
      return { ...state, exportProgress: { ...state.exportProgress!, current: action.current } }
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
  const [loading, setLoading] = useReducerBool(false)

  const handleFiles = useCallback(async (files: File[]) => {
    setLoading(true)
    dispatch({ type: 'FILES_DROPPED', files })

    const dicomFiles: DicomFile[] = []
    const errors: string[] = []

    await Promise.all(files.map(async (file) => {
      try {
        const valid = await isDicomFile(file)
        if (!valid) return
        const metadata = await parseDicomMetadata(file)
        const imageId = getImageIdForFile(file)
        dicomFiles.push({ file, imageId, metadata })
      } catch (err) {
        errors.push(`${file.name}: ${(err as Error).message}`)
      }
    }))

    const studies = groupIntoStudies(dicomFiles)
    dispatch({ type: 'DICOM_PARSED', dicomFiles, studies, errors })
    setLoading(false)
  }, [])

  const handleClear = useCallback(() => {
    clearSession()
    dispatch({ type: 'SESSION_CLEARED' })
  }, [])

  if (state.screen === 'home' || state.screen === 'review') {
    return (
      <>
        {state.screen === 'home' && (
          <HomeScreen onFiles={handleFiles} loading={loading} />
        )}
        {state.screen === 'review' && (
          <ImportReview
            totalFiles={state.rawFiles.length}
            validDicomCount={state.dicomFiles.length}
            skippedCount={state.rawFiles.length - state.dicomFiles.length}
            studies={state.studies}
            errors={state.errors}
            onContinue={() => dispatch({ type: 'GO_TO_VIEWER' })}
            onClear={handleClear}
          />
        )}
      </>
    )
  }

  return (
    <ViewerScreen
      studies={state.studies}
      exportOptions={state.exportOptions}
      onOptionsChange={(opts) => dispatch({ type: 'EXPORT_OPTIONS_CHANGED', options: opts })}
      onProgress={(current, total) => {
        if (state.exportProgress === null) dispatch({ type: 'EXPORT_STARTED', total })
        dispatch({ type: 'EXPORT_PROGRESS', current })
      }}
      onExportDone={() => dispatch({ type: 'EXPORT_COMPLETE' })}
      exportProgress={state.exportProgress}
      onClear={handleClear}
    />
  )
}

// Tiny local hook to avoid importing useState alongside useReducer
function useReducerBool(initial: boolean): [boolean, (v: boolean) => void] {
  const [s, d] = useReducer((_: boolean, v: boolean) => v, initial)
  return [s, d]
}
```

- [ ] **Step 2: Update main.tsx to initialize Cornerstone before rendering**

Replace `apps/web/src/main.tsx` with:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initCornerstone } from './modules/viewer/cornerstoneInit'
import { installDevNetworkGuard } from './modules/privacy/guard'

installDevNetworkGuard()

initCornerstone().then(() => {
  const root = document.getElementById('root')
  if (!root) throw new Error('Root element not found')
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}).catch((err) => {
  console.error('Failed to initialize Cornerstone3D:', err)
  document.body.innerHTML = '<p style="color:red;padding:2rem">Failed to initialize viewer. Please use Chrome or Firefox.</p>'
})
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/web && npm run lint 2>&1
```

Expected: No errors. If TypeScript complains about `useReducerBool`, move `loading` state to a `useState` call instead.

- [ ] **Step 4: Manual smoke test**

```bash
cd apps/web && npm run dev
```

1. Open http://localhost:5173
2. Verify the home screen shows with drop zone and privacy banner
3. Select one of the `.dcm` files from `tests/fixtures/sample.dcm`
4. Verify import review screen appears with "1 valid DICOM files"
5. Click "Open Viewer" — verify Cornerstone viewport appears

- [ ] **Step 5: Commit**

```bash
cd ../.. && git add apps/web/src/App.tsx apps/web/src/main.tsx
git commit -m "feat: wire up App state machine — home → review → viewer flow"
```

---

## Task 15: Unit Tests (all modules)

Run all existing unit tests together and fix any failures.

- [ ] **Step 1: Run the full unit test suite**

```bash
cd apps/web && npx vitest run ../../tests/unit/ 2>&1
```

Expected: All tests pass (`detector`, `parser`, `grouper`, `imageExporter`, `guard`).

- [ ] **Step 2: Fix parser.ts if needed**

If `parser.test.ts` fails because `parseDicom` throws on the nested call for TransferSyntax, replace the options argument:

In `apps/web/src/modules/dicom/parser.ts`, replace:
```typescript
const dataset = dicomParser.parseDicom(byteArray, {
  TransferSyntaxUID: safeString(
    dicomParser.parseDicom(byteArray.slice(0, 256)),
    TAG.TRANSFER_SYNTAX
  ),
})
```
with:
```typescript
const dataset = dicomParser.parseDicom(byteArray)
```

Then re-run:
```bash
npx vitest run ../../tests/unit/ 2>&1
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
cd ../.. && git add -A
git commit -m "test: all unit tests passing"
```

---

## Task 16: End-to-End Tests (Playwright)

**Files:**
- Create: `tests/e2e/noUpload.spec.ts`
- Create: `tests/e2e/fileImport.spec.ts`
- Create: `tests/e2e/export.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
cd apps/web && npx playwright install chromium 2>&1
```

Expected: Chromium downloaded.

- [ ] **Step 2: Create noUpload.spec.ts**

Create `tests/e2e/noUpload.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'
import path from 'path'

test('no binary data is uploaded while processing DICOM files', async ({ page }) => {
  const uploadedBinaryRequests: string[] = []

  page.on('request', (request) => {
    const method = request.method()
    if (method === 'POST' || method === 'PUT') {
      const postData = request.postDataBuffer()
      if (postData && postData.length > 0) {
        uploadedBinaryRequests.push(request.url())
      }
    }
  })

  await page.goto('/')
  await page.waitForSelector('text=OpenDICOM Convert')

  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(path.resolve('tests/fixtures/sample.dcm'))

  // Wait for import review to appear
  await page.waitForSelector('[data-testid="import-review"]', { timeout: 15000 })

  expect(uploadedBinaryRequests, 'Binary data was uploaded — privacy violation!').toHaveLength(0)
})
```

- [ ] **Step 3: Create fileImport.spec.ts**

Create `tests/e2e/fileImport.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'
import path from 'path'

test('user can select a DICOM file and see import review', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('OpenDICOM Convert')
  await expect(page.locator('text=processed locally')).toBeVisible()

  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(path.resolve('tests/fixtures/sample.dcm'))

  await page.waitForSelector('[data-testid="import-review"]', { timeout: 15000 })
  await expect(page.locator('text=Valid DICOM files')).toBeVisible()
  await expect(page.locator('text=1').first()).toBeVisible()
})

test('user can proceed from import review to the viewer', async ({ page }) => {
  await page.goto('/')
  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(path.resolve('tests/fixtures/sample.dcm'))
  await page.waitForSelector('[data-testid="import-review"]', { timeout: 15000 })

  await page.click('text=Open Viewer')

  // Viewer has a canvas element from Cornerstone
  await page.waitForSelector('canvas', { timeout: 15000 })
  await expect(page.locator('canvas')).toBeVisible()
})
```

- [ ] **Step 4: Create export.spec.ts**

Create `tests/e2e/export.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'
import path from 'path'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  const fileInput = page.locator('[data-testid="file-input"]')
  await fileInput.setInputFiles(path.resolve('tests/fixtures/sample.dcm'))
  await page.waitForSelector('[data-testid="import-review"]', { timeout: 15000 })
  await page.click('text=Open Viewer')
  await page.waitForSelector('canvas', { timeout: 15000 })
})

test('export panel is visible in viewer', async ({ page }) => {
  await expect(page.locator('text=Export')).toBeVisible()
  await expect(page.locator('text=PNG')).toBeVisible()
  await expect(page.locator('text=JPEG')).toBeVisible()
})

test('single image export triggers a download', async ({ page }) => {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 20000 }),
    page.click('text=Export'),
  ])
  expect(download.suggestedFilename()).toMatch(/image_000001\.(png|jpg)/)
})
```

- [ ] **Step 5: Run E2E tests**

```bash
cd apps/web && npx playwright test 2>&1
```

Expected: All 5 tests pass. If the Cornerstone canvas takes longer to initialize, increase `waitForSelector` timeout.

- [ ] **Step 6: Commit**

```bash
cd ../.. && git add tests/e2e/noUpload.spec.ts tests/e2e/fileImport.spec.ts tests/e2e/export.spec.ts
git commit -m "test: add Playwright E2E tests — no-upload proof, file import, export"
```

---

## Task 17: Documentation + Open-Source Files

**Files:**
- Create: `README.md`
- Create: `LICENSE`
- Create: `PRIVACY.md`
- Create: `SECURITY.md`
- Create: `docs/architecture.md`
- Create: `docs/privacy-model.md`
- Create: `docs/limitations.md`
- Create: `apps/web/public/_headers` (Netlify CSP)

- [ ] **Step 1: Create README.md**

Create `README.md`:
```markdown
# OpenDICOM Convert

Open DICOM medical imaging files locally in your browser and export them to PNG or JPG.

**No upload. No server. No data leaves your device.**

## Quick start

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173, select DICOM files, and export.

## What it does

- Opens `.dcm` files (DICOM Part 10 format)
- Groups files by study and series
- Displays images using Cornerstone3D
- Exports current image, series, or all images to PNG/JPG as a ZIP
- Runs entirely in the browser — nothing is uploaded

## What it does not do

- No diagnosis. This is not a medical device.
- No PACS integration.
- No multi-frame DICOM (coming in v0.4).
- No ZIP input (coming later).
- No server-side processing.

## Building for production

```bash
cd apps/web && npm run build
```

Static files are output to `apps/web/dist/`. Deploy to any static hosting.

## Supported browsers

Chrome, Edge, Firefox, Safari (latest versions).

## License

Apache 2.0

## Disclaimer

This software is not a medical device. It is not intended for diagnosis, treatment decisions,
or clinical interpretation. Always consult a qualified healthcare professional for medical advice.
```

- [ ] **Step 2: Create LICENSE**

Create `LICENSE`:
```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   Copyright 2026 OpenDICOM Contributors

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

- [ ] **Step 3: Create PRIVACY.md**

Create `PRIVACY.md`:
```markdown
# Privacy Model

OpenDICOM Convert processes all DICOM files locally in your browser.

## What we do NOT do

- We do not upload your files.
- We do not store any patient data.
- We do not use cookies or localStorage for medical data.
- We do not use analytics or crash-reporting SDKs.
- We do not load scripts from external CDNs.

## What happens to your data

1. You select files from your local device.
2. Files are read into browser memory using the File API.
3. Pixel data is decoded and rendered by Cornerstone3D in a WebGL canvas.
4. Exports are generated in the browser and downloaded directly to your device.
5. All data is cleared when you click "Start over" or close the tab.

## Content Security Policy

For production deployments, add this CSP header:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self' blob:;
  img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; connect-src 'none';
  object-src 'none'; base-uri 'none'; form-action 'none';
```

## Metadata

The app reads non-identifying metadata for grouping (Study UID, Series UID, Instance Number,
Modality, Descriptions). Patient Name, Patient ID, Date of Birth, Accession Number, and
Referring Physician are never read into application state.
```

- [ ] **Step 4: Create SECURITY.md**

Create `SECURITY.md`:
```markdown
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please open a GitHub issue tagged `security`
or email the maintainers. Do not disclose publicly until a fix is available.

## Threat Model

The primary security concern is accidental patient data leakage. The app is designed with:

- No network transmission of DICOM content.
- No persistence of medical data in browser storage.
- File type validation before processing.
- Sanitized metadata display (no raw tag values rendered as HTML).
- Content Security Policy blocking external network calls in production.
```

- [ ] **Step 5: Create docs/limitations.md**

Create `docs/limitations.md`:
```markdown
# Known Limitations

## MVP (v0.1–v0.2)

- **No ZIP input**: Users must select individual .dcm files or use folder upload.
  ZIP import is planned for a future version.
- **No DICOMDIR parsing**: The DICOMDIR index file is ignored. Files must be selected individually.
- **No multi-frame DICOM**: Only the first frame of multi-frame files is displayed.
- **No compressed transfer syntaxes**: JPEG 2000 and JPEG-LS compressed DICOM may not decode correctly.
- **Folder upload browser-dependent**: `webkitdirectory` is non-standard. Works in Chrome/Edge, partial in Firefox.
- **Not for diagnosis**: This tool is not validated for clinical use.
```

- [ ] **Step 6: Create Netlify CSP headers file**

Create `apps/web/public/_headers`:
```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self' blob:; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
```

- [ ] **Step 7: Commit**

```bash
cd /Users/luisenramos/Documents/opendicom && git add README.md LICENSE PRIVACY.md SECURITY.md docs/architecture.md docs/limitations.md apps/web/public/_headers
git commit -m "docs: add README, LICENSE (Apache 2.0), PRIVACY, SECURITY, limitations"
```

---

## Self-Review Against Spec

### Spec coverage check

| Spec section | Task that covers it |
|---|---|
| No upload / no backend | Privacy guard (T7), noUpload E2E test (T16), PRIVACY.md (T17) |
| File picker + drag/drop | FileDropZone (T11) |
| Folder picker | FileDropZone `webkitdirectory` (T11) |
| Detect valid DICOM | isDicomFile (T4) |
| Study/series grouping | grouper (T6) |
| Preview image | DicomViewer + Cornerstone (T8, T13) |
| Zoom / Pan / Window-Level | Cornerstone tools registered in viewport.ts (T8) |
| Export PNG / JPG | imageExporter (T9) |
| ZIP export | zipExporter + batchExporter (T10) |
| Batch progress + cancel | batchExporter + ProgressIndicator (T10, T13) |
| Anonymous sequential filenames | sequentialFilename() (T9) |
| No sensitive metadata in state | parser reads only safe tags (T5), types.ts no patient fields |
| No localStorage/IndexedDB for medical data | guard.ts (T7) |
| Content Security Policy | `public/_headers` + index.html comment (T2, T17) |
| Static site / no backend | Vite static build (T2) |
| Apache 2.0 license | LICENSE (T17) |
| README with limitations | README.md + docs/limitations.md (T17) |

### Gaps identified (deferred to later versions per spec)

- DICOMDIR parsing → v0.3
- ZIP input → later
- Multi-frame DICOM → v0.4
- Image invert tool → v0.4
- CSV metadata export → optional future

### Type consistency check

- `ExportFormat` defined in `types.ts:32`, used correctly in `imageExporter.ts`, `ExportPanel.tsx`, `batchExporter.ts`
- `ExportScope` defined in `types.ts:33`, used in `ExportPanel.tsx` and `batchExporter.ts`
- `enableViewport` exported from `viewport.ts`, imported in `DicomViewer.tsx`
- `captureCanvas` takes `Types.IStackViewport`, returned by `enableViewport` ✓
- `getImageIdForFile` in `cornerstoneInit.ts` returns `string`, stored as `DicomFile.imageId: string` ✓

---

## Execution Notes

**Potential Cornerstone3D Vite issues:**

If `npm run dev` shows errors like `Cannot read properties of undefined (reading 'wadouri')` or worker-related errors, try adding to `vite.config.ts`:
```typescript
define: {
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
}
```

If `@cornerstonejs/dicom-image-loader` fails to import, check the actual exported API:
```bash
node -e "const m = require('./node_modules/@cornerstonejs/dicom-image-loader/dist/cjs/index.js'); console.log(Object.keys(m))"
```
and adjust the import accordingly.

**WebGL canvas export:** If exported images appear blank, add `preserveDrawingBuffer: true` by checking the Cornerstone3D `RenderingEngine` constructor options in the version installed.
```
