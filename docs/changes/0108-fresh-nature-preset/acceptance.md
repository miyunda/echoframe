# Acceptance: Fresh Nature Preset

## Manual Checks

- Select `Fresh Nature` in the visual scene picker.
- Confirm the preview shows a soft nature-inspired scene with drifting motes, leaf shadows, a gentle light sweep, and waveform motion.
- Confirm the generated fallback background works when no background source is uploaded.
- Confirm uploaded background sources still render behind the nature treatment.
- Confirm lyrics remain readable at 1080p.
- Switch back to existing presets and confirm they still render.

## Automated Checks

- `npm run build`

## Known Risks

- The procedural leaf treatment may need visual tuning after browser QA.
- Future style packs may require scene picker grouping once the preset list grows.
