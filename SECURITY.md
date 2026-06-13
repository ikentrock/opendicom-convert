# Security Policy

## Reporting a Vulnerability

Please open a GitHub issue tagged `security` or contact the maintainers directly.
Do not disclose publicly until a fix is available.

## Security Design

The primary concern is preventing patient data leakage:

- No DICOM content or metadata is transmitted over any network
- Patient-identifying DICOM tags are never parsed into application state
- File type is validated (DICM magic bytes) before processing
- All dependencies are bundled at build time — no external CDN scripts
- Content Security Policy blocks external network calls in production
- `connect-src 'none'` in the CSP prevents any fetch/XHR calls
- A Playwright test proves no binary upload occurs during normal usage

## Dependency Scanning

Run `npm audit` to check for known vulnerabilities in dependencies.
