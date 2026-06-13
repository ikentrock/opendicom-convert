# Known Limitations

## MVP (v0.1–v0.2) — Current Release

- **No ZIP input**: ZIP files containing DICOM images cannot be opened directly.
  Users must extract files first, or use folder upload.
- **No DICOMDIR parsing**: The DICOMDIR index file present on medical CDs is ignored.
  Files must be selected individually or via folder picker.
- **No multi-frame DICOM**: Only the first frame of multi-frame DICOM files is shown.
  This affects some CT/MR protocols that store multiple frames per file.
- **No compressed transfer syntaxes**: JPEG 2000 (J2K) and JPEG-LS compressed files
  may not decode correctly depending on the browser build of Cornerstone3D.
- **Folder upload is browser-dependent**: The `webkitdirectory` attribute works in
  Chrome and Edge. It has partial support in Firefox and no support in Safari.
- **Large series performance**: Loading 200+ images at once may be slow on
  low-memory devices. Consider exporting in smaller batches.
- **Not for diagnosis**: This tool is not validated for clinical use and must not be
  used to make medical decisions.

## Planned Improvements

- v0.3: Folder/CD support with DICOMDIR parsing
- v0.4: Window/level controls, image invert, series scrolling improvements
- v1.0: Multi-frame DICOM, compressed transfer syntax support
