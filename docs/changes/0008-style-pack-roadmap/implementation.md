# Implementation: Style Pack Roadmap

## Scope

This is a documentation-only change that establishes the next visual style expansion direction.

## Changed Files

- `docs/roadmap.md`
- `docs/changes/0008-style-pack-roadmap/design.md`
- `docs/changes/0008-style-pack-roadmap/implementation.md`
- `docs/changes/0008-style-pack-roadmap/acceptance.md`

## Plan

1. Add a Phase 7 roadmap section for style-pack expansion.
2. Document the four candidate packs:
   - `post-apocalyptic-wasteland`
   - `decayed-industrial`
   - `fresh-nature`
   - `cute-playground`
3. Define implementation boundaries so future packs remain on the shared preview/export render path.
4. Recommend `fresh-nature` as the first implementation candidate because it has the lowest dependency and texture risk.
5. Define acceptance checks for future style-pack work.

## Future Implementation Shape

Each style-pack implementation should be a narrow feature change with its own docs and code review. The expected code path is:

- add a preset entry in `src/utils/scenePresets.js`
- add renderer helpers in `src/utils/sceneRenderer.js` only when existing branches are insufficient
- pass through existing lyric and avatar mode defaults where possible
- verify `npm run build`
- manually compare preview and export behavior for the selected pack

## Migration Risks

- Style packs could create too many preset choices if the picker is not grouped later.
- Theme-only packs could dilute the product quality bar.
- Strong texture or typography choices can reduce lyric readability if not tested at 1080p.

## Rollback

Remove the Phase 7 roadmap section and delete `docs/changes/0008-style-pack-roadmap/`.
