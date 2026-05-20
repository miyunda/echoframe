# Design: Style Pack Completion

## Problem

EchoFrame's style-pack roadmap named four target directions, but only `fresh-nature` had been implemented. That left the preset system visually uneven: one new family existed in code while `post-apocalyptic-wasteland`, `decayed-industrial`, and `cute-playground` were still only planning language.

## Goals

- Complete the remaining three requested style packs.
- Keep all three presets on the shared preview/export renderer path.
- Give each preset a visibly distinct composition, not just a different palette.
- Reuse the existing Canvas 2D renderer and shared frame state.
- Preserve lyric readability and keep the UI surface unchanged.

## Non-Goals

- Add per-preset advanced controls.
- Introduce image-texture pipelines, WebGL, or external animation dependencies.
- Redesign the scene picker beyond using the existing preset list.
- Change export profiles or encoder behavior.

## User Experience

Users can choose three additional presets from the existing scene picker:

- `Post-Apocalyptic Wasteland`: dusty atmosphere, harsh glare, sparse distressed motion, and low heavy bars.
- `Decayed Industrial`: steel grid, warning-light accents, scan-line feel, and mechanical pulse columns.
- `Cute Playground`: floating sticker shapes, candy tones, soft bubble motion, and bouncy playful accents.

Each preset should remain readable with lyrics on top and should still honor uploaded background sources. When there is no background source, each preset should still feel coherent through generated backdrop tokens and overlay behavior.

## Architecture

The change adds three entries to `SCENE_PRESETS` and three narrow branches to `sceneRenderer`:

- `wasteland`
- `industrial`
- `playful`

Each branch reuses shared helpers where possible:

- `drawLightSweep`
- `drawWaveRibbon`
- `drawStereoBars`
- `drawRadialBars`

Each branch adds only the minimum new procedural shapes needed to establish a distinct scene language:

- wasteland: dust field and horizon haze
- industrial: steel grid and pulse columns
- playful: sticker shapes and bubble outlines

## Tradeoffs

Completing the other three packs in one change keeps momentum and closes the roadmap gap, but it also broadens visual QA compared with shipping them one by one.

The presets stay procedural instead of asset-driven. That keeps export deterministic and implementation scope controlled, but it means some styles may want future texture or typography tuning after hands-on review.
