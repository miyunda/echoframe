# Browser Export Performance Design

## Problem

EchoFrame currently exports by rendering every frame to a 1080p canvas, converting that frame to a JPEG blob, writing the JPEG into FFmpeg.wasm's in-memory filesystem, and then asking FFmpeg.wasm to encode the image sequence into MP4.

That path is simple and compatible, but it scales poorly. A 4 minute export at 60fps produces about 14,400 image files before video encoding even begins. The browser spends time on canvas-to-JPEG conversion, array-buffer copies, thousands of virtual filesystem writes, FFmpeg.wasm video encoding, and cleanup of thousands of temporary files.

The result is that realistic projects, such as a 4 minute song with a 7 image background track, can take tens of minutes to complete.

## Goals

- Reduce export time for normal browser exports.
- Reduce memory pressure during long exports.
- Keep preview and export on the same scene renderer.
- Keep FFmpeg.wasm available as a compatibility fallback.
- Preserve 1080p60 as a first-class export profile, even if the first optimized implementation ships with 1080p30 as the lower-risk default.
- Make export performance measurable with repeatable benchmark cases.

## Non-Goals

- Do not introduce the Mac accelerated export path in this phase.
- Do not require Electron, Tauri, or native FFmpeg for browser export.
- Do not change visual preset behavior as part of the encoder work.
- Do not remove FFmpeg.wasm until a replacement is proven across supported browsers.

## User Experience

Users should choose an export profile before starting export:

- `720p30`: fast preview/share profile.
- `1080p30`: default high-quality browser profile.
- `1080p60`: smooth high-quality profile for final publishing.
- `4K30`: future high-resolution profile after the optimized path is stable.

The product should default to `1080p30` for the first WebCodecs release because it cuts frame count in half compared with 1080p60 while still matching common publishing quality. 1080p60 must remain visible in the product direction and should be enabled once the WebCodecs path proves stable enough on representative machines.

During export, progress should clearly distinguish:

- engine selection
- audio analysis
- scene rendering and video encoding
- audio muxing
- final output preparation

If WebCodecs is unsupported or fails capability checks, the app should fall back to the current FFmpeg.wasm path and explain that the compatibility path may be slower.

## Architecture

The optimized browser path should move from image-sequence export to direct frame encoding:

1. Decode and analyze audio once.
2. Create an `OffscreenCanvas` at the selected profile resolution.
3. For each output frame, call the shared `renderSceneFrame()` contract.
4. Wrap the canvas output in a `VideoFrame`.
5. Encode the `VideoFrame` through `VideoEncoder`.
6. Mux encoded video and audio into MP4.

The key architectural rule is that WebCodecs changes the encoder, not the scene renderer. The render inputs should remain the same frame state, background track state, preset, lyric state, avatar state, and image assets used by preview and the current export path.

## Export Profiles

Profiles should be explicit data rather than scattered constants:

```text
id       width  height  fps  target bitrate
720p30   1280   720     30   4 Mbps
1080p30  1920   1080    30   8 Mbps
1080p60  1920   1080    60   12-16 Mbps
4K30     3840   2160    30   35-45 Mbps
```

The first implementation can ship only `1080p30` through WebCodecs and route the others through fallback or mark them experimental, but it should not encode assumptions that make 1080p60 hard to add.

## Capability Detection

The app should check:

- `VideoEncoder` support.
- `VideoEncoder.isConfigSupported()` for the chosen codec and profile.
- `hardwareAcceleration: "prefer-hardware"` support when available.
- MP4 muxing support for the chosen video codec and audio format.

If hardware acceleration is not available, software WebCodecs may still be acceptable for lower profiles, but the UI should not imply native-level performance.

## Audio Strategy

The current FFmpeg.wasm path handles audio muxing and AAC conversion. The WebCodecs path needs a deliberate audio plan:

- Preferred: encode audio with `AudioEncoder` to AAC when supported, then mux video and audio in MP4.
- Fallback: encode video with WebCodecs, then use FFmpeg.wasm only for final audio muxing if browser audio encoding support is insufficient.

Using FFmpeg.wasm only for muxing is still materially faster and lighter than using it for thousands of JPEG files plus video encoding.

## Benchmark Cases

Performance work should be measured against at least these cases:

- 30 second debug audio with generated background.
- 4 minute song, 7 image background track, lyrics enabled, 1080p30.
- 4 minute song, 7 image background track, lyrics enabled, 1080p60.

For each case record:

- browser and version
- machine
- selected export profile
- export path
- total export time
- peak observed memory if available
- output duration
- audio/video sync result

## Tradeoffs

WebCodecs support is uneven across browsers, so the optimized path cannot be the only path yet. Keeping FFmpeg.wasm increases maintenance cost, but it preserves compatibility and provides a known rollback path.

Starting with 1080p30 is a pragmatic sequencing decision, not a product ceiling. It reduces first-pass frame volume while the new encoder path, muxing, progress reporting, and fallback behavior are stabilized. 1080p60 remains part of the target profile set.

## Open Questions

- Which AVC codec string is most reliable across target Chromium builds?
- Should 1080p60 be visible but marked experimental before benchmark confidence is high?
- Can browser `AudioEncoder` AAC support cover the target environment, or is FFmpeg.wasm muxing still needed?
- Should long exports run fully in a worker from the first slice, or should the first slice prove the encoder path before moving orchestration off the main thread?
