# Acceptance: Cosmic Particles Preset

## Manual Checks

- Load the debug seed assets.
- Select `Cosmic Particles`.
- Open the preview workbench and confirm the scene shows particles, pulse rings, waveform ribbons, and the uploaded background.
- Play the audio and confirm the visual response changes with the music.
- Confirm switching back to existing presets still works.

## Automated Checks

- `npm run build`

## Known Risks

- The richer scene draws more canvas operations per frame than the existing presets.
- Very low-powered browsers may need future density controls or a quality mode.
