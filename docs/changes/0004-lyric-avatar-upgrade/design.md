# Design: Lyric and Avatar Upgrade

## Problem

EchoFrame already renders synced lyrics and an animated avatar, but the current result is still closer to a technical demo than an intentional MV layout.

- lyric rendering is effectively one visual treatment with limited control over hierarchy
- bilingual lyrics are supported, but layout behavior is not formalized as a user-facing mode
- subtitle parsing now accepts `.lrc`, `.srt`, and `.vtt`, but format support is not yet framed as part of a broader lyric system
- avatar motion exists, but avatar presentation is still mostly preset-driven and not exposed as a clear mode choice

That leaves Phase 3 underdefined even though the renderer already has enough surface area to support a stronger lyric-first workflow.

## Goals

- Define Phase 3 as a lyric-and-avatar system rather than a collection of isolated renderer tweaks.
- Treat `.lrc`, `.srt`, and `.vtt` as first-class subtitle inputs under one lyric pipeline.
- Establish clear lyric layout modes that can map to existing and future renderer behavior.
- Establish clear avatar display modes that can map to existing and future scene presets.
- Keep preview and export behavior aligned by continuing to use one shared render path.

## Non-Goals

- A full timeline editor for per-line typography overrides.
- Word-by-word karaoke authoring UI in this first change.
- Arbitrary avatar masking, freeform transforms, or layered sticker composition.
- A saved project schema migration beyond what current in-memory state already supports.

## Decisions

The first Phase 3 slice should formalize capabilities before broadening controls.

Subtitle support should remain format-agnostic after parsing. The parser layer can accept `.lrc`, `.srt`, and `.vtt`, but the renderer should consume one normalized lyric-cue shape.

Lyric presentation should be described through stable layout modes:

- `single-line`: primary line only, optimized for minimal overlays
- `bilingual-stacked`: primary line plus translation with explicit hierarchy
- `minimal-subtitle`: restrained subtitle treatment for background-led presets
- `karaoke-progress`: reserved as a later mode once per-line progress timing is ready

Avatar presentation should also be described through stable modes:

- `static-circle`: current circular image baseline
- `vinyl-disc`: existing record-style treatment
- `glow-ring`: avatar-led composition for more stylized presets
- `hidden`: no avatar rendering

Preset defaults should continue to matter, but presets should no longer be the only place where lyric and avatar behavior is defined. The product should move toward "preset supplies a default, user can override when needed."

## User Experience

Users should be able to think about lyrics and avatar independently from the underlying parser or preset internals.

The intended progression is:

1. Upload lyrics in `.lrc`, `.srt`, or `.vtt`.
2. Choose a lyric layout that matches the song and composition.
3. Choose whether the avatar is visible and which presentation mode it uses.
4. Preview the same timing and placement that export will produce.

Users who do not upload an avatar should still get a coherent lyric-led composition.

## Tradeoffs

Adding named layout and avatar modes before exposing every control keeps the surface area understandable, but it means some advanced customization stays preset-bound for now.

Normalizing `.srt` and `.vtt` into the same lyric model reduces renderer complexity, but it also means subtitle-specific metadata outside EchoFrame's current visual needs should be ignored in this phase.

## Acceptance Direction

- `.lrc`, `.srt`, and `.vtt` inputs are documented as supported lyric sources.
- Lyric layout modes are defined clearly enough to guide implementation.
- Avatar mode expectations are defined clearly enough to guide implementation.
- Preview and export remain bound to the same lyric timing and avatar motion model.
