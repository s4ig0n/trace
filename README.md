# trace

trace is a privacy-first evidence workspace for preserving original files, recording local SHA-256 integrity hashes, adding user context, building a timeline, creating basic image redactions, and exporting controlled evidence reports.

It is an evidence preservation and organization tool. It is not a truth machine, legal authority, emergency service, or substitute for legal advice.

## Privacy model

- No account, analytics, ads, remote database, or evidence upload.
- Case records and original files are stored on-device in IndexedDB. Files are stored as Blobs, never in localStorage.
- Original Blobs are immutable application records. User context and image working copies are stored separately.
- Hashing, metadata parsing, PDF generation, and ZIP generation run in the browser.
- Clearing browser data also removes local trace cases. Export required material first.
- trace does not claim to verify truth, authenticity, intent, or deception.

The production application does not load web fonts or runtime assets from third-party servers. After the first successful load, the PWA service worker caches the application shell for offline use.

## Supported files

Images, video, audio, and PDFs can be imported. Common browser-decodable images, audio, and video provide previews and dimensions or duration where the browser exposes them. Safe EXIF/XMP fields may be read from images. Full C2PA validation, deepfake detection, PDF redaction, video redaction, and audio redaction are not included.

## Local setup

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite. To test the offline PWA behavior, use a production build because service workers are disabled during normal development.

## Commands

```bash
npm run dev          # local development server
npm test             # complete automated test suite
npm run test:watch   # tests in watch mode
npm run typecheck    # TypeScript checks
npm run build        # production build
npm run preview      # serve the production build locally
```

## Export behavior

The PDF report contains the selected case summary, timeline, evidence captions, optional context, metadata, hashes, a limitations statement, and page numbers. The ZIP includes that PDF, selected originals or derived copies, `manifest.json`, and `README.txt`. Manifest hashes are freshly calculated from the files placed in the export. Private notes are excluded by default.

All exports are generated locally. Saving a browser download is the first point where trace creates a file outside IndexedDB.

## Browser support

Current desktop and mobile versions of Chrome, Edge, Firefox, and Safari with IndexedDB, Web Crypto, Blob, canvas, and service-worker support. Media metadata and install behavior vary by browser. Private browsing modes may restrict storage persistence or quota.

## Threat model

trace reduces accidental disclosure to a remote service by keeping case data local and by making export explicit. It helps detect later file changes through SHA-256 comparison and maintains separation between originals and working copies.

trace does not protect against malware, another person with access to the unlocked device or browser profile, browser or operating-system compromise, screenshots, filesystem recovery, malicious browser extensions, or loss of data caused by clearing browser storage. Browser deletion cannot guarantee physical disk erasure. A SHA-256 match proves byte equality only, not when, where, or by whom content was created.

## Dependencies

Runtime dependencies are deliberately small:

- **React / React DOM** provide the typed component UI and accessible state-driven interactions.
- **idb** is a maintained, minimal promise wrapper for versioned IndexedDB storage and transactions.
- **exifr** reads a narrow selection of image EXIF/XMP fields locally with GPS values disabled.
- **pdf-lib** generates report PDFs entirely in the browser.
- **JSZip** generates evidence packages entirely in the browser.
- **vite-plugin-pwa** creates the web app manifest and Workbox service worker for offline use.

Vite, TypeScript, Vitest, Testing Library, jsdom, and fake-indexeddb are development-only tools for builds and tests.

## Known limitations

- Web Crypto has no streaming SHA-256 API. trace yields between file chunks to keep progress visible, then creates one in-memory buffer for the final digest. Very large files can exceed device memory.
- Metadata parsing is intentionally limited and is not forensic validation.
- C2PA is only surfaced when a recognizable metadata marker is encountered. Signature and trust-chain validation are not implemented.
- Image previews use the original local Blob. Separate raster previews are generated only through the redaction workflow.
- Image redaction produces PNG working copies. Blur is a visual privacy aid and may not be suitable for every disclosure risk.
- Updating a redaction creates an additional derived record in this MVP. Evidence deletion removes all derived records.
- PDF reports currently prioritize textual context over embedded full-resolution evidence imagery.
- Local data is scoped to the browser profile and origin. There is no cross-device sync or recovery.

## AI assistance acknowledgement

The initial MVP implementation was produced with AI-assisted development under human direction. Product claims, privacy boundaries, generated code, and dependency choices should receive human review before sensitive real-world use.

## Future improvements

Validated C2PA verification, streaming hash support, richer safe metadata adapters, PDF and video redaction, explicit derived-copy management, encrypted portable backups, location-aware support resources, expanded PDF preview rendering, and independent security and accessibility audits.

## 2 to 3 minute demo script

1. Open the landing page and introduce trace as a local-first evidence workspace. Emphasize: “Integrity is recorded. Truth is never declared.”
2. Select **Start tracing**, create a case, and explain that no account or upload is involved.
3. Import a safe sample image. Point out local hashing progress, the SHA-256 record, metadata uncertainty labels, and the unchanged original.
4. Add a source, first-seen date, account name, and a private note. Explain that context is separate from the file.
5. Create a timeline entry and link the image.
6. Open the redaction editor, draw a solid rectangle, and save the result as a working copy.
7. In Report, select the evidence and working copy, keep private notes excluded, review the limitations, then export PDF and ZIP.
8. Open `manifest.json` from the ZIP and close by showing case deletion and the on-device privacy explanation.
