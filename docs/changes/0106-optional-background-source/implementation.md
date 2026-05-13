# Implementation: Optional Background Source

## Changed Files

- `src/App.jsx`
- `src/components/Preview.jsx`
- `src/components/Visualizer.jsx`
- `src/utils/imageAssets.js`
- `src/utils/sceneRenderer.js`

## Plan

1. Replace `image` state with `background` plus a source selector.
2. Add a generated background asset record so the start gate can accept a non-image source.
3. Make preview and export load a bitmap only when the background type is `image`.
4. Render a procedural animated backdrop when no image bitmap is present.

## Rollback

Restore `image` as a required upload, remove the background-source selector, and remove the generated-backdrop path from the renderer.
