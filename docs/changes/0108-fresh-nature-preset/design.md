# Design: Fresh Nature Preset

## Problem

EchoFrame has a style-pack roadmap, but the first requested style family still needs a concrete implementation. The existing presets cover classic analyzer, cinematic lyrics, neon ring, cosmic particles, and vinyl cover treatments. None of them provide a calm, daylight, organic look.

## Goals

- Add one `fresh-nature` preset as the first style-pack implementation.
- Use soft daylight colors, foliage shadows, drifting motes, and gentle waveform motion.
- Keep preview and export consistent through the shared scene renderer.
- Stay Canvas 2D based and avoid new runtime dependencies.
- Preserve lyric readability with restrained motion and subtitle-friendly contrast.

## Non-Goals

- Implement the other style-pack candidates.
- Add texture image assets or generated bitmap backgrounds.
- Add user-facing controls for leaf density, particle count, or color tuning.
- Redesign the scene picker.
- Change encoder behavior.

## User Experience

Users can choose `Fresh Nature` from the existing visual scene picker. The scene uses a generated soft green daylight background when no background source is provided. Uploaded backgrounds still work, with the nature treatment layered on top.

The preset should feel quieter than `Cosmic Particles`: drifting light motes, soft leaf-shadow motion, a gentle light sweep, and a low waveform ribbon should support the music without overwhelming lyrics.

## Architecture

The preset is added to `SCENE_PRESETS` with `style: "nature"`.

`sceneRenderer` adds a narrow nature branch that reuses existing primitives where possible:

- generated backdrop theme tokens
- `drawLightSweep`
- `drawWaveRibbon`
- `drawStereoBars`

The nature branch adds deterministic Canvas 2D helpers for drifting motes and leaf-shadow shapes. Like the cosmic particle field, these helpers use hash-derived positions instead of random state so preview and export stay aligned.

## Tradeoffs

The first nature implementation uses procedural leaf silhouettes rather than real texture assets. This keeps the change small and deterministic, but the scene may need future asset work if the product wants a more photographic nature look.

The preset uses a new renderer branch instead of only changing theme tokens because the style needs distinct organic motion, not just a different palette.
