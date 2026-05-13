# Design: Cosmic Particles Preset

## Problem

EchoFrame has a preset renderer, but the available looks are still visually close to simple spectrum layouts. The product needs a richer scene that demonstrates particles, light motion, and stronger beat response without copying another visualizer service.

## Goals

- Add one visually distinct preset with a more premium music-video feel.
- Keep preview and export consistent through the shared scene renderer.
- Use Canvas 2D so the change does not depend on a new rendering stack.
- Make the scene deterministic from time and audio data so exported frames remain stable.

## Non-Goals

- Add user-facing controls for particle density, waveform shape, or color tuning.
- Introduce Three.js, WebGL, or a new animation dependency.
- Redesign the upload or preview workflow.

## User Experience

Users can choose a new `Cosmic Particles` scene from the existing scene picker. The scene keeps the uploaded background and optional avatar, then layers star-like particles, bass pulse rings, a moving light sweep, radial bars, and flowing waveform ribbons.

## Architecture

The preset is added to `SCENE_PRESETS` with the `cosmic` style. `sceneRenderer` branches on that style and draws the additional layers from the same `frameState` used by the other presets.

The particle field is generated from deterministic hash values instead of random state. This keeps preview and export visually aligned and avoids storing large per-particle state.

## Tradeoffs

Canvas 2D limits true 3D depth, but it is enough for a first richer visual layer and avoids disrupting the export path. The scene is intentionally preset-driven for now; detailed controls can come after the visual vocabulary proves useful.
