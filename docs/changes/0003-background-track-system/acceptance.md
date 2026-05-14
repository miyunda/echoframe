# Acceptance: Background Track System

## Acceptance Criteria

- Users can add more than one background image.
- The app automatically distributes background timing across the audio duration.
- Preview and export use the same image order, timing, and motion behavior.
- A baseline transition exists between adjacent background items.
- Single-image uploads still work.
- No-image fallback to generated background still works.

## Verification

Manual checks:

- Add two or more background images and one audio file.
- Enter the workbench and confirm the background changes over time.
- Scrub or replay the same section and confirm the same image is active at the same time.
- Export a short test and confirm the sequence order and transition timing match preview.
- Repeat with one background image and with no background image.

Automated checks:

- `npm run build`

## Known Gaps

- No automated visual regression coverage exists for frame-to-frame background timing.
- Background video remains intentionally out of scope for this change.
