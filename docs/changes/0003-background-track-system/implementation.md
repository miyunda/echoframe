# Implementation: Background Track System

## Scope

This change introduces the first real background-track model and wires it through preview and export.

## Planned Files

- `src/App.jsx`
  Replace single background selection state with a background track input model.
- `src/components/Preview.jsx`
  Use resolved background-track frames during export.
- `src/components/Visualizer.jsx`
  Use the same background-track resolver during live preview.
- `src/utils/sceneRenderer.js`
  Accept a resolved background frame instead of assuming one static image.
- `src/utils/imageAssets.js`
  Extend asset helpers as needed for multiple background items.
- `src/utils/backgroundTrack.js`
  Define track normalization, duration allocation, item lookup, and motion sampling.

## Steps

1. Add `0003` design, implementation, and acceptance documents.
2. Define a background-track item model and a resolver contract.
3. Add UI support for multiple background images with stable ordering.
4. Implement automatic duration allocation from total audio length.
5. Implement deterministic motion presets and a baseline crossfade.
6. Update preview and export to consume the same resolved background frame.
7. Verify build and manual preview/export behavior.

## Risks

- Background resolution logic can drift if preview and export do not share exactly the same helper.
- Multiple large images can increase memory pressure in browser preview.
- Motion and transition tuning can look cheap if defaults are too aggressive.

## Rollback

If the track model proves unstable, revert to the current single-background path while preserving the generated fallback behavior.
