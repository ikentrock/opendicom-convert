# OpenDICOM Convert

Open DICOM medical imaging files locally in your browser and export them to PNG or JPG.

**No upload. No server. No patient data leaves your device.**

## Quick start

```bash
cd apps/web
npm install
npm run dev
```

Open http://localhost:5173, select DICOM files (.dcm), preview them, and export.

## What it does

- Opens `.dcm` files (DICOM Part 10 format)
- Groups files by study and series automatically
- Displays images using Cornerstone3D WebGL renderer
- Exports current image as PNG/JPG, or batch-exports series/all as a ZIP
- Runs entirely in the browser — nothing is uploaded

## Privacy

All processing happens locally in your browser using the File API and WebGL canvas.
No analytics, no cookies, no network calls. See [PRIVACY.md](PRIVACY.md) for details.

## Running tests

```bash
# Unit tests
cd apps/web && npm test

# E2E tests (includes privacy proof test)
cd apps/web && npx playwright test
```

## Building for production

```bash
cd apps/web && npm run build
```

Static files output to `apps/web/dist/`. Deploy to any static host (Netlify, Vercel, GitHub Pages, nginx).

## Supported browsers

Chrome, Edge, Firefox, Safari (latest). Folder upload requires Chrome or Edge.

## Limitations

See [docs/limitations.md](docs/limitations.md).

## License

[Apache 2.0](LICENSE)

## Disclaimer

**This software is not a medical device.** It is not intended for diagnosis, treatment decisions, or clinical interpretation. Always consult a qualified healthcare professional for medical advice.
