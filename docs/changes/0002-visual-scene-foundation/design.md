# Design: Visual Scene Foundation

## Problem

EchoFrame currently renders visuals through duplicated logic spread across preview and export code paths.

- `Visualizer.jsx` owns the live canvas path.
- `Preview.jsx` owns a separate offline export renderer.
- Visual style is effectively hard-coded to one red/blue stereo spectrum scene.

That makes new visual work expensive and risks drift between preview and exported output.

## Goals

- Establish one shared full-frame scene renderer for both preview and export.
- Introduce a preset model with stable IDs and human-readable names.
- Preserve the current visual style through a compatibility preset.
- Add at least two new presets to prove the abstraction is useful.
- Expose preset selection in the UI before export.

## Non-Goals

- Replace FFmpeg.wasm in this change.
- Add video backgrounds or multi-image background tracks.
- Add advanced typography or karaoke word highlighting.
- Add a saved project model.

## Decisions

Use a shared renderer module that accepts:

- `ctx`, `width`, `height`
- `preset`
- `frameState`
- `assets`
- `renderState`

`frameState` should carry the minimal runtime data needed by presets:

- current time
- duration
- left and right frequency data
- bass energy
- overall energy
- lyric timeline

`renderState` should store cross-frame smoothing data such as:

- left and right bar states
- avatar vertical offset

Presets should be declarative metadata plus a render style identifier rather than fully separate rendering engines. This keeps Phase 1 small while still allowing distinct looks.

## Presets in Scope

- `classic-stereo`: preserve the current red/blue analyzer look.
- `cinematic-lyric`: lyric-first scene with softer spectrum and stronger vignette.
- `neon-ring`: circular ring spectrum around the avatar with glow treatment.

## Tradeoffs

Using one renderer with style variants is less flexible than a fully independent per-preset render function. It is the right tradeoff for Phase 1 because the product still needs one stable scene contract before more complex presets are added.

Moving the preview to a full-frame canvas changes the internal composition approach, but it gives a much stronger guarantee that preview and export match.

## Acceptance Direction

- Preview and export both call the shared scene renderer.
- The preset picker changes live preview output.
- Export uses the selected preset.
- The classic preset remains available as the compatibility baseline.

