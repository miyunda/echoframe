# Design: Background Track System

## Problem

EchoFrame no longer requires a background image, but its background model is still too primitive for music-video composition.

- uploaded backgrounds are effectively single-image only
- generated fallback is useful for first-run flow, but not expressive enough for authored videos
- there is no timeline model for background changes, motion, or deterministic transitions

That keeps exports closer to visualizer demos than editable MV scenes.

## Goals

- Replace the single-background assumption with a background-track model.
- Support more than one background image in one project.
- Make background timing deterministic between preview and export.
- Add a simple motion model so still images feel alive.
- Keep the first slice small enough to ship before background video support.

## Non-Goals

- Full background video support in this change.
- AI image or AI video generation.
- A saved project file format.
- Scene-specific transition authoring UI beyond the first baseline controls.

## Decisions

The first implementation should be image-track first, not video-track first.

Each background item should carry:

- stable item id
- source asset
- start time or derived timing slot
- duration
- fit mode
- motion preset

The track should be resolved into one active background item per frame. Preview and export must both use the same resolution logic rather than each inventing timing separately.

Motion should start with deterministic Ken Burns variants:

- slow zoom in
- slow zoom out
- left-to-right pan
- right-to-left pan
- subtle drift

Transitions should begin with one baseline crossfade. More complex wipes or masked transitions can wait until the timing model proves stable.

## User Experience

Users should be able to build a scene from several still images without preprocessing them elsewhere.

The intended first workflow is:

1. Add multiple background images.
2. Let the app spread them across the track automatically.
3. Preview the sequence with motion.
4. Export the same sequence without timing drift.

Users who only want one image should see current behavior preserved.

## Tradeoffs

Deferring video backgrounds lowers ambition in the short term, but it avoids pulling in loop, trim, decode, and memory management complexity before the track contract is stable.

Automatic duration allocation is less flexible than a full manual timeline editor, but it is the right first step because it solves the common case while keeping the UI compact.

## Acceptance Direction

- One project can use multiple background images.
- Preview and export agree on which image is active at a given time.
- Background motion is visible and deterministic.
- Single-image and generated-fallback paths still work.
