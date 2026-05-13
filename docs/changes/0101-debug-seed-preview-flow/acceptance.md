# Acceptance: Debug Seed Load Flow

## Acceptance Criteria

- Clicking the debug seed action keeps the user on the upload screen.
- The generated test audio is loaded.
- The generated test subtitle asset is shown as loaded.
- The preview button becomes available after the generated background and audio are loaded.

## Verification

Manual checks:

- Click the debug seed action and confirm the page does not jump into preview.
- Confirm the audio upload card shows the debug audio file name.
- Confirm the lyric upload card shows the debug lyric file name.
- Confirm the start button is enabled.

Automated checks:

- `npm run build`

