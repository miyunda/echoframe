# Implementation: Hide Audio Title

## Changed Files

- `src/utils/sceneRenderer.js`

## Plan

Remove the title drawing step from the shared scene renderer. Because preview and export both call `renderSceneFrame`, the behavior changes consistently in both outputs.

## Rollback

Restore the title drawing function and call if rendered file-name titles are needed again.
