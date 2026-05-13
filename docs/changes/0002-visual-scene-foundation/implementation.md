# Implementation: Visual Scene Foundation

## Scope

This change introduces the first shared scene architecture and preset selector.

## Planned Files

- `src/utils/scenePresets.js`
  Defines preset metadata and lookup helpers.
- `src/utils/sceneRenderer.js`
  Defines frame-state creation, persistent render state, and the shared render function.
- `src/components/Visualizer.jsx`
  Uses the shared renderer for live preview.
- `src/components/Preview.jsx`
  Uses the shared renderer for export and preview composition.
- `src/App.jsx`
  Adds preset selection state and passes the selected preset through the flow.

## Steps

1. Add `0002` design, implementation, and acceptance documents.
2. Define preset metadata and a default preset.
3. Create a shared renderer with:
   - scene background drawing
   - avatar treatment
   - title treatment
   - lyric drawing
   - stereo and radial visualizer modes
4. Update live preview to render the complete frame through the shared renderer.
5. Update offline export to use the same renderer.
6. Add a preset picker in the app UI and carry the choice into preview/export.
7. Verify the build.

## Risks

- Full-frame preview rendering could expose sizing or layout issues.
- The new renderer may initially preserve only part of the current visual nuance.
- Export still depends on the current FFmpeg path, so Phase 1 does not address performance limits.

## Rollback

If the shared renderer causes regressions, revert the `sceneRenderer` and `scenePresets` integration and restore the previous live/export-specific render paths.

