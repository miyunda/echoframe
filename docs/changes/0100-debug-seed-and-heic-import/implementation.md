# Implementation: Debug Seed and HEIC Rejection

## Scope

- Add image upload validation helpers for unsupported formats.
- Reject HEIC and HEIF uploads before preview/export.
- Make the debug seed action also generate a background image and enter preview.
- Improve upload card display names for generated assets.

## Files

- `src/utils/imageAssets.js`
- `src/utils/debugAudio.js`
- `src/App.jsx`
- `src/components/FileUpload.jsx`

## Steps

1. Add change documentation.
2. Add a helper that detects unsupported HEIC/HEIF files.
3. Route background and avatar uploads through the helper.
4. Keep normal image uploads unchanged.
5. Add a generated debug background and make the debug flow enter preview.
6. Verify the project still builds.
