# Implementation: Cosmic Particles Preset

## Changed Files

- `src/utils/scenePresets.js`
- `src/utils/sceneRenderer.js`
- `src/App.jsx`

## Plan

1. Add a `cosmic-particles` preset with colors, layout values, and scene-specific theme tokens.
2. Add Canvas 2D helpers for deterministic particles, bass pulse rings, moving light sweep, and waveform ribbons.
3. Route `preset.style === "cosmic"` through a new scene composition function.
4. Adjust the scene picker grid so four presets lay out cleanly on desktop.

## Rollback

Remove the `cosmic-particles` preset entry, delete the `cosmic` renderer branch and helper functions, and restore the picker grid column count if needed.
