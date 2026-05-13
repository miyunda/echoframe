# Acceptance: Debug Seed and HEIC Rejection

## Acceptance Criteria

- Clicking the debug seed action produces a visible, previewable scene without requiring a manual background upload.
- Generated assets show usable names in the upload cards.
- HEIC and HEIF uploads are rejected immediately with a clear conversion instruction.
- Unsupported HEIC files no longer reach preview or export.

## Verification

Manual checks:

- Click the debug seed action on a fresh page and confirm preview opens with image, audio, and lyrics.
- Upload a HEIC background and confirm the app rejects it with a conversion instruction.

Automated checks:

- `npm run build`
