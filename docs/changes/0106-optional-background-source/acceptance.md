# Acceptance: Optional Background Source

## Manual Checks

- Load only an audio file, choose `动态背景`, and confirm the workbench can open.
- Confirm the preview shows an animated background instead of a blank frame.
- Confirm uploading a background image still works.
- Confirm switching between `上传图片` and `动态背景` updates the start gate correctly.
- Confirm export still initializes for both source types.

## Automated Checks

- `npm run build`
