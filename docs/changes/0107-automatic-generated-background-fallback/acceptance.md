# Acceptance: Automatic Generated Background Fallback

## Manual Checks

- Upload only an audio file and confirm the workbench opens.
- Confirm preview uses the generated background when no image was uploaded.
- Upload a background image and confirm it replaces the generated fallback.
- Confirm the debug seed path still opens with the generated debug image.

## Automated Checks

- `npm run build`
