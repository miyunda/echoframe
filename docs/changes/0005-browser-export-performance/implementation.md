# Browser Export Performance Implementation

## Planned Sequence

1. Add export profile definitions for `720p30`, `1080p30`, `1080p60`, and `4K30`.
2. Add export path capability detection for WebCodecs.
3. Build a WebCodecs export module that renders frames through `renderSceneFrame()` and encodes them with `VideoEncoder`.
4. Add MP4 muxing for encoded video and audio.
5. Keep the existing FFmpeg.wasm image-sequence path as fallback.
6. Add profile-aware progress reporting and output naming.
7. Add benchmark instructions and record baseline numbers.

## First Implementation Slice

The first slice should target:

- `1080p30`
- AVC/H.264 through `VideoEncoder`
- the existing shared scene renderer
- the current background track model
- current lyric and avatar rendering behavior
- FFmpeg.wasm fallback when WebCodecs is unavailable

This keeps the optimized path small enough to review while attacking the main bottleneck: the JPEG image-sequence handoff into FFmpeg.wasm.

## 1080p60 Handling

1080p60 must stay in the profile model from the beginning. The first slice may leave it on the fallback path or mark it experimental, but the implementation should avoid hard-coded `30fps` assumptions in renderer timing, progress math, file naming, or profile UI.

When WebCodecs 1080p30 is stable, 1080p60 should be enabled by adjusting profile selection and validating:

- queue backpressure behavior
- bitrate
- audio/video sync
- memory usage
- final output duration

## Candidate File Changes

- `src/utils/exportProfiles.js`
  Defines stable export profiles, labels, dimensions, fps, bitrate, and availability flags.

- `src/utils/webcodecsExport.js`
  Owns WebCodecs capability detection and optimized browser export orchestration.

- `src/components/Preview.jsx`
  Adds export profile selection, chooses WebCodecs or FFmpeg.wasm, and keeps progress readable.

- `src/utils/offlineProcessor.js`
  Accepts target fps instead of assuming 60fps for all exports.

- `src/utils/export.worker.js`
  Either replace with the new shared-renderer export worker or remove after the new module supersedes it.

## Important Integration Detail

The current `src/utils/export.worker.js` should not be promoted unchanged. It draws an older visualizer path directly in the worker and does not use `renderSceneFrame()`. Promoting it as-is would make preview and export visually diverge.

The optimized path must call the shared renderer with the same frame-state shape used by preview and fallback export.

## Rollback

If WebCodecs export proves unstable, keep the profile UI and capability detection but route all profiles through the existing FFmpeg.wasm fallback. The fallback path is slow, but known and recoverable.
