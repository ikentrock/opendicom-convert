# Privacy Model

OpenDICOM Convert is designed to process all DICOM files entirely within your browser.

## What we do NOT do

- Do not upload your files or any file contents
- Do not store patient data in localStorage, sessionStorage, or IndexedDB
- Do not use cookies
- Do not use analytics or crash-reporting SDKs
- Do not load scripts from external CDNs (all dependencies are bundled at build time)
- Do not make any network requests with patient data

## What happens to your data

1. You select DICOM files from your local device using the browser File API
2. Files are read into browser memory — they never leave your machine
3. Pixel data is decoded and rendered by Cornerstone3D using WebGL
4. Exports are generated from the WebGL canvas and downloaded directly to your device
5. All data is cleared when you click "Start over" or close the tab

## Metadata

The app reads non-identifying metadata for grouping (Study UID, Series UID, Instance Number,
Modality, Descriptions). Patient Name, Patient ID, Date of Birth, Accession Number,
Referring Physician, and Institution Name are never read into application state.

## Content Security Policy

For production deployments, add this response header (see `apps/web/public/_headers`):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; worker-src 'self' blob:;
  img-src 'self' blob: data:; style-src 'self' 'unsafe-inline'; connect-src 'none';
  object-src 'none'; base-uri 'none'; form-action 'none';
```

This blocks all external network calls from the page.

## Privacy test

A Playwright E2E test (`tests/e2e/noUpload.spec.ts`) intercepts all network requests during
DICOM file processing and asserts that zero binary POST/PUT requests are made.
Run it with: `cd apps/web && npx playwright test tests/e2e/noUpload.spec.ts`
