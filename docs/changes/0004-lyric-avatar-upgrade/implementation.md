# Implementation: Lyric and Avatar Upgrade

## Scope

This change documents the first implementation direction for Phase 3 and anchors already-shipped subtitle format support inside that larger plan.

## Planned Files

- `docs/changes/0004-lyric-avatar-upgrade/design.md`
  Define the problem, capability model, and user-facing modes.
- `docs/changes/0004-lyric-avatar-upgrade/implementation.md`
  Define the expected rollout sequence and touched modules.
- `docs/changes/0004-lyric-avatar-upgrade/acceptance.md`
  Define verification for lyric formats, layout behavior, and avatar presentation.
- `src/utils/subtitleParser.js`
  Preserve normalized parsing for `.lrc`, `.srt`, and `.vtt`.
- `src/utils/sceneRenderer.js`
  Remains the shared render path for lyric placement and avatar drawing across preview and export.
- `src/utils/visualizerUtils.js`
  Likely home for expanded lyric layout rendering helpers.
- `src/components/Visualizer.jsx`
  Continue to consume shared renderer output during live preview.
- `src/components/Preview.jsx`
  Continue to consume the same renderer output during export.
- `src/App.jsx`
  Likely home for future user-facing lyric and avatar mode state.

## Steps

1. Add `0004` design, implementation, and acceptance documents.
2. Treat the merged `.srt` and `.vtt` parser support as Phase 3 baseline capability.
3. Define a normalized lyric layout contract that the renderer can switch on by mode.
4. Define an avatar mode contract that can reuse existing circle and vinyl rendering paths while allowing hidden and glow-led variants.
5. Expose the minimum necessary UI controls for lyric layout and avatar mode selection.
6. Keep preview and export on the same renderer helpers to avoid timing or layout drift.
7. Verify build plus manual preview/export checks with representative subtitle files.

## Risks

- Lyric layout logic can become fragmented if format parsing, cue normalization, and canvas drawing evolve separately.
- Avatar mode overrides can fight preset styling if precedence is not defined clearly.
- Subtitle files with different segmentation conventions may reveal edge cases in bilingual rendering and cue wrapping.

## Rollback

If Phase 3 controls create unstable rendering behavior, keep the normalized subtitle parser support and fall back to preset-defined lyric/avatar defaults until the mode contracts are simpler.
