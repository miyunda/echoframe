# Acceptance: Visual Scene Foundation

## Acceptance Criteria

- A shared renderer module exists and is used by both live preview and export.
- The selected preset is user-configurable from the UI.
- The `classic-stereo` preset preserves the legacy red/blue baseline.
- At least two additional presets are selectable and visible in preview.
- Export uses the selected preset rather than a hard-coded style.

## Verification

Manual checks:

- Upload an image and audio file.
- Switch between presets and confirm the preview visibly changes.
- Start export and confirm the output is produced without runtime errors.
- Verify the exported output matches the selected preset family.

Automated checks:

- `npm run build`

## Known Gaps

- No automated visual regression testing exists yet.
- Export performance is intentionally unchanged in this phase.

