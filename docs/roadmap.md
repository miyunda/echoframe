# EchoFrame Roadmap

EchoFrame should evolve from a single music visualizer into a template-driven MV generator. The core direction is:

1. Build a reusable visual scene system.
2. Improve export performance without locking the product to one runtime.
3. Add richer background, lyric, avatar, and template controls.
4. Introduce a Mac-accelerated export path after the rendering model is stable.

## Phase 0: Project Governance

Status: planned for immediate adoption.

User value:

- Keeps work reviewable and recoverable.
- Prevents untracked decisions from living only in conversation.
- Makes design, implementation, and acceptance expectations explicit before feature work starts.

Technical scope:

- Adopt branch rule: no direct commits on `main`.
- Adopt branch naming: `codex/<type>/<yyyymmdd>-<short-scope>`.
- Require design, implementation, and test/acceptance documents for every meaningful change.

Required documents:

- `docs/project-rules.md`
- `docs/changes/0001-project-rules-and-roadmap/design.md`
- `docs/changes/0001-project-rules-and-roadmap/implementation.md`
- `docs/changes/0001-project-rules-and-roadmap/acceptance.md`

Acceptance criteria:

- The repository has a documented branch rule.
- The repository has a documented documentation rule.
- Future roadmap work references these rules.

Risks and fallback:

- Risk: documentation becomes ceremony without guiding implementation.
- Fallback: keep each change document short, concrete, and tied to acceptance checks.

## Phase 1: Visual Scene Foundation

Goal: turn the current hard-coded red/blue spectrum into a preset-based scene system.

User value:

- Users can choose different MV looks instead of one fixed visual style.
- Preview and export remain visually consistent.
- New effects can be added without rewriting the export pipeline.

Technical scope:

- Extract a shared `renderFrame()` contract used by both preview and export.
- Introduce visual presets with stable IDs, names, configurable defaults, and frame render functions.
- Move the existing red/blue stereo bars into a `classic-stereo` preset.
- Define a shared frame state containing time, duration, left/right frequency data, bass energy, overall energy, lyric state, avatar state, and background state.
- Keep the first implementation Canvas 2D based.

Initial presets:

- `classic-stereo`: current red/blue stereo spectrum, preserved as compatibility baseline.
- `cinematic-lyric`: background-led layout with soft vignette, subtle spectrum, stronger lyric treatment.
- `neon-ring`: circular avatar spectrum, glow ring, bass pulse, particle accents.
- `album-cover`: cover-art composition with restrained motion and typography.

Required documents:

- `docs/changes/0002-visual-scene-foundation/design.md`
- `docs/changes/0002-visual-scene-foundation/implementation.md`
- `docs/changes/0002-visual-scene-foundation/acceptance.md`

Acceptance criteria:

- Preview and export use the same preset renderer.
- Existing output can be reproduced through `classic-stereo`.
- At least two new presets are usable from the UI.
- Preset choice is reflected in exported video.

Risks and fallback:

- Risk: abstraction gets too large before visual quality improves.
- Fallback: keep the preset API minimal and only extract data already needed by the first presets.

## Phase 2: Background Track System

Goal: replace the single static background image model with a flexible background track.

User value:

- Videos feel more like MVs and less like static visualizer exports.
- Users can build a complete video from multiple images or a short background video.
- The same song can have different visual narratives.

Technical scope:

- Support multiple background images.
- Add automatic duration allocation across images.
- Add Ken Burns motion: pan, zoom, and crop per background item.
- Add background fitting modes: cover, contain, fill, manual crop.
- Add optional background video input with loop or trim behavior.
- Add palette extraction from background/avatar to drive preset colors.

Required documents:

- `docs/changes/0003-background-track-system/design.md`
- `docs/changes/0003-background-track-system/implementation.md`
- `docs/changes/0003-background-track-system/acceptance.md`

Acceptance criteria:

- A project can export with more than one background image.
- Background transitions are deterministic between preview and export.
- At least one preset reacts to extracted colors.
- Single-image behavior remains supported.

Risks and fallback:

- Risk: video backgrounds complicate browser memory usage.
- Fallback: ship multi-image backgrounds first, then add video background after export memory behavior is measured.

## Phase 3: Lyric and Avatar Upgrade

Goal: make the current avatar and LRC support feel intentional, not decorative.

User value:

- Lyrics become readable and expressive.
- Avatar treatment feels like part of the scene.
- Bilingual lyrics can be styled cleanly for publishing.

Technical scope:

- Add lyric layout modes: single line, bilingual stacked, karaoke progress, minimal subtitle.
- Add per-line transitions: fade, rise, scale, highlight sweep.
- Add avatar modes: static circle, vinyl disc, glow ring, hidden.
- Add beat-aware avatar motion with smoothing controls.
- Add safe zones for social/video platforms.

Required documents:

- `docs/changes/0004-lyric-avatar-upgrade/design.md`
- `docs/changes/0004-lyric-avatar-upgrade/implementation.md`
- `docs/changes/0004-lyric-avatar-upgrade/acceptance.md`

Acceptance criteria:

- Existing `.lrc` files still render.
- Bilingual lines remain legible at 1080p.
- Avatar can be disabled or styled per preset.
- Exported video matches preview for lyric timing and avatar motion.

Risks and fallback:

- Risk: too many typography controls make the UI heavy.
- Fallback: expose preset-level lyric styles first, then add advanced controls later.

## Phase 4: Browser Export Performance

Goal: reduce export time and memory pressure in the browser.

User value:

- Shorter waiting time.
- Fewer failed exports for long tracks.
- Better responsiveness during export.

Technical scope:

- Promote the existing WebCodecs worker idea into the main export candidate.
- Encode frames through `VideoEncoder` instead of writing thousands of JPEGs into FFmpeg.wasm.
- Use `hardwareAcceleration: "prefer-hardware"` where supported.
- Add MP4 muxing for encoded video and audio.
- Keep FFmpeg.wasm as fallback.
- Add export profiles: 720p30, 1080p30, 1080p60, 4K30.

Required documents:

- `docs/changes/0005-browser-export-performance/design.md`
- `docs/changes/0005-browser-export-performance/implementation.md`
- `docs/changes/0005-browser-export-performance/acceptance.md`

Acceptance criteria:

- WebCodecs export works in supported Chromium browsers.
- FFmpeg.wasm fallback still works.
- Export progress remains understandable.
- Memory usage is lower than the current frame-to-JPEG path for a representative song.
- Output audio/video sync is verified.

Risks and fallback:

- Risk: WebCodecs support varies by browser and codec.
- Fallback: feature-detect at runtime and keep FFmpeg.wasm as compatibility path.

## Phase 5: Mac Accelerated Export

Goal: add a Mac path that can reliably use Apple Silicon hardware acceleration.

User value:

- Faster high-resolution exports on M-series Macs.
- Better long-video reliability than browser-only export.
- A path toward batch export and professional presets.

Technical scope:

- Package the existing UI in a desktop shell such as Tauri or Electron.
- Reuse the same scene renderer and project model.
- Export through native/system tooling that can access VideoToolbox.
- Evaluate `h264_videotoolbox` and `hevc_videotoolbox` through system FFmpeg.
- Keep browser deployment as the privacy-first, no-install option.

Required documents:

- `docs/changes/0006-mac-accelerated-export/design.md`
- `docs/changes/0006-mac-accelerated-export/implementation.md`
- `docs/changes/0006-mac-accelerated-export/acceptance.md`

Acceptance criteria:

- Mac export path can encode with VideoToolbox on supported hardware.
- Browser export remains available.
- A documented benchmark compares FFmpeg.wasm, WebCodecs, and Mac accelerated export.
- Export output is visually equivalent for the same preset and settings.

Risks and fallback:

- Risk: desktop packaging increases release and support complexity.
- Fallback: keep Mac export experimental until browser scene and project models are stable.

## Phase 6: Project Model and Template Sharing

Goal: make EchoFrame projects reusable.

User value:

- Users can save and revisit MV setups.
- Templates can be shared across songs.
- Preset authors can contribute new looks.

Technical scope:

- Define a versioned project JSON format.
- Store assets, preset settings, background tracks, lyric settings, and export profiles.
- Add import/export of project files.
- Add template metadata and preview thumbnails.

Required documents:

- `docs/changes/0007-project-model-template-sharing/design.md`
- `docs/changes/0007-project-model-template-sharing/implementation.md`
- `docs/changes/0007-project-model-template-sharing/acceptance.md`

Acceptance criteria:

- A project can be saved and loaded.
- Project schema is versioned.
- Older supported project files can be migrated or rejected with a clear message.
- A template can be applied to a different song.

Risks and fallback:

- Risk: schema changes lock the product too early.
- Fallback: version the schema from the start and keep the first schema focused on current features.

## Phase 7: Style Pack Expansion

Goal: grow the visual preset system into recognizable video style families.

User value:

- Users can pick an MV direction that matches the song mood instead of only choosing layout mechanics.
- The product can support more expressive publishing scenarios without requiring manual design work.
- Presets become easier to describe, compare, and extend as coherent style packs.

Technical scope:

- Define style-pack principles that cover color, texture, motion language, typography, lyric treatment, avatar treatment, and generated fallback backgrounds.
- Keep every style pack on the shared scene renderer path so preview and export remain aligned.
- Add new style packs incrementally, with one implementation change per pack when possible.
- Treat background assets and palette extraction as optional enhancers rather than hard dependencies.
- Avoid coupling style packs to a specific encoder or desktop export path.

Candidate style packs:

- `post-apocalyptic-wasteland`: dusty atmosphere, harsh sunlight, damaged overlays, sparse motion, and distressed lyric treatment.
- `decayed-industrial`: rusted metal, warning-light accents, mechanical pulses, scan lines, and heavier beat response.
- `fresh-nature`: soft daylight, foliage shadows, organic particle drift, gentle motion, and clean subtitle-first typography.
- `cute-playground`: rounded shapes, sticker-like accents, bouncy beat motion, bright but controlled colors, and playful lyric timing.

Required documents:

- `docs/changes/0008-style-pack-roadmap/design.md`
- `docs/changes/0008-style-pack-roadmap/implementation.md`
- `docs/changes/0008-style-pack-roadmap/acceptance.md`

Acceptance criteria:

- The candidate style packs have documented visual principles and implementation boundaries.
- Each future style-pack implementation can be reviewed independently.
- Preview/export consistency remains a requirement for all style packs.
- At least one candidate pack has a clear recommended first implementation path.

Risks and fallback:

- Risk: style packs become shallow color swaps rather than meaningfully different scenes.
- Fallback: require each pack to define at least one motion or composition behavior that is distinct from existing presets.

## Phase Order

Recommended order:

1. Phase 0: Project Governance
2. Phase 1: Visual Scene Foundation
3. Phase 2: Background Track System
4. Phase 3: Lyric and Avatar Upgrade
5. Phase 4: Browser Export Performance
6. Phase 5: Mac Accelerated Export
7. Phase 6: Project Model and Template Sharing
8. Phase 7: Style Pack Expansion

The most important dependency is Phase 1. Better visuals, browser export, and Mac export should all use the same scene contract so the product does not split into incompatible rendering paths.
