# Design: Style Pack Roadmap

## Problem

EchoFrame has a shared scene preset system, but the available choices are still mostly individual visualizer compositions. Users who think in mood or video direction need higher-level style families such as wasteland, industrial, nature, or playful looks.

Without a style-pack plan, future presets can drift into isolated color variants instead of becoming recognizable MV directions.

## Goals

- Define a small set of candidate style packs for future video scenes.
- Make each style pack more than a palette by describing composition, texture, motion, lyric treatment, and avatar treatment.
- Keep preview and export consistency as a non-negotiable requirement.
- Identify the best first pack to implement after this documentation change.
- Preserve the existing preset architecture instead of introducing a new rendering stack.

## Non-Goals

- Implement a new scene preset in this change.
- Add new user-facing controls for style tuning.
- Add generated image assets or texture pipelines.
- Change export performance, encoder behavior, or desktop packaging.
- Redesign the scene picker UI.

## Style Pack Candidates

### Post-Apocalyptic Wasteland

This pack should feel dry, damaged, and exposed. It should use dusty overlays, sun-bleached highlights, low-saturation contrast, intermittent glitch scratches, and sparse rhythm response.

The lyric treatment should be distressed but still readable. Avatar treatment should be optional or reduced, because the background and atmosphere should carry the scene.

### Decayed Industrial

This pack should feel mechanical, heavy, and worn. It should use rust-like tones, dark metal surfaces, warning-light accents, scan lines, subtle vibration, and beat-synced machinery pulses.

The lyric treatment can be compact and utilitarian. Avatar treatment can lean into a monitor, gauge, or porthole motif.

### Fresh Nature

This pack should feel open, breathable, and organic. It should use soft daylight, foliage shadows, drifting particles, low-contrast overlays, and smooth motion that responds gently to energy.

The lyric treatment should be clean and subtitle-first. Avatar treatment should stay quiet, with light border motion rather than aggressive pulses.

### Cute Playground

This pack should feel playful without becoming visually noisy. It should use rounded shapes, sticker-like accents, controlled bright colors, bouncy beat motion, and simple decorative elements that do not cover lyrics.

The lyric treatment can use subtle pop or bounce timing. Avatar treatment can become a toy-like badge or soft circular frame.

## Architecture

Style packs should continue to use `SCENE_PRESETS` metadata and the shared `sceneRenderer` frame contract. A pack can add a new `preset.style` branch only when its composition cannot be expressed by the existing stereo, radial, cinematic, cosmic, or vinyl branches.

Each style pack should define:

- stable preset ID
- display name and Chinese title
- visual principles
- theme tokens
- layout values
- lyric defaults
- avatar defaults
- generated fallback background direction
- distinct motion or composition behavior

## Recommended First Implementation

`fresh-nature` is the safest first pack. It can reuse the current Canvas 2D renderer shape, background fallback system, subtitle modes, and gentle particle logic without needing complex texture assets.

`decayed-industrial` is the best second pack because it can prove a more aggressive motion language while still staying Canvas 2D based.

`post-apocalyptic-wasteland` and `cute-playground` should wait until the team is ready to make stronger texture and typography decisions.

## Tradeoffs

Planning several packs at once gives the product a clearer visual direction, but implementing them all at once would make review and regression testing too broad. The roadmap should define the family, while implementation should stay one pack at a time.

Keeping the work Canvas 2D based limits rich materials and 3D depth, but it protects export consistency and avoids adding a dependency before the visual direction is proven.

## Open Questions

- Should style packs eventually become user-shareable templates, or remain built-in presets?
- Should generated fallback backgrounds be deterministic procedural drawings, bundled texture assets, or user-selected assets?
- Should style packs expose advanced controls later, or stay as opinionated one-click presets?
