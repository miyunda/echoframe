# Implementation: Fresh Nature Preset

## Changed Files

- `src/utils/scenePresets.js`
- `src/utils/sceneRenderer.js`
- `src/App.jsx`
- `docs/changes/0108-fresh-nature-preset/design.md`
- `docs/changes/0108-fresh-nature-preset/implementation.md`
- `docs/changes/0108-fresh-nature-preset/acceptance.md`

## Plan

1. Add `fresh-nature` preset metadata with soft daylight colors, generated backdrop stops, and restrained layout values.
2. Allow scene presets to override top and bottom backdrop overlays while preserving existing defaults.
3. Add deterministic nature helpers for drifting motes and soft leaf-shadow shapes.
4. Route `preset.style === "nature"` through the new nature scene branch.
5. Reuse existing light sweep, waveform ribbon, and stereo bar helpers to keep the implementation compact.
6. Adjust the scene picker grid so six presets lay out evenly on desktop.
7. Verify the build.

## Migration Risks

- The scene picker now has one more option, so the grid may need future grouping if style packs keep growing.
- Procedural leaves can look too abstract without visual QA on real backgrounds.
- Light overlays can reduce contrast on bright uploaded backgrounds if not tested with lyrics.

## Rollback

Remove the `fresh-nature` preset entry, delete the `nature` renderer branch and helper functions, and remove the optional overlay token usage if it is no longer needed.
