# Browser Export Performance Acceptance

## Acceptance Criteria

- WebCodecs export works for the first supported browser profile.
- FFmpeg.wasm fallback still exports successfully.
- 1080p60 remains represented in the export profile model and product direction.
- Preview and export still use the same scene renderer.
- Export progress stays understandable across analysis, rendering/encoding, muxing, and finalization.
- A representative long export uses less memory than the current JPEG image-sequence path.
- Output audio/video sync is verified.

## Manual Checks

1. Export a 30 second debug project at `1080p30`.
2. Export a 4 minute project with 7 background images, lyrics, and avatar at `1080p30`.
3. Export or explicitly fallback-test the same 4 minute project at `1080p60`.
4. Confirm the exported visual layout matches preview for selected preset, background timing, lyrics, and avatar behavior.
5. Confirm the output duration matches the source audio duration within an acceptable tolerance.
6. Confirm lyrics remain in sync near the beginning, middle, and end of the video.

## Performance Checks

Record before and after numbers for:

- current FFmpeg.wasm image-sequence path
- WebCodecs `1080p30`
- WebCodecs or fallback `1080p60`

Use the same input assets for each run:

- 4 minute audio
- 7 image background track
- representative lyric file
- avatar image

Record:

- browser and version
- machine
- profile
- export path
- total time
- observed memory behavior
- output duration
- sync result

## Automated Checks

- `npm run build`

Automated visual equivalence tests are not yet available. Until they exist, manual preview/export comparison remains required for this phase.

## Known Risks

- Browser codec support can vary by version and platform.
- AAC encoding support through `AudioEncoder` may be less reliable than video encoding support.
- 1080p60 may still be too slow on some machines without hardware acceleration.
- 4K30 may need a later memory-focused pass before it is practical.
