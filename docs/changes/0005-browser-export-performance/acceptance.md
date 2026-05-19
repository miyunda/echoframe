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

## Verification Notes

- `npm run build` passes.
- The local workbench opens with the debug seed.
- The profile selector shows `720p30`, `1080p30`, `1080p60`, and disabled `4K30`.
- The Codex in-app browser used for this check does not expose WebCodecs or OffscreenCanvas, so it can verify UI and fallback guards but not real WebCodecs encoding performance.
- Local browser validation succeeded for a representative long export: about 3 minutes of source video at `1080p30` completed in about 4 minutes through the new browser export path.
- That runtime was observed manually and not precisely timed, so it should be treated as an approximate baseline rather than a benchmark-grade measurement.
- Local fallback validation for `1080p60` was captured under these conditions:
  Mac mini M4 (2024), 32 GB RAM, 2 TB storage, macOS 26.4.1, Arc 1.145.0 with Chromium 147.0.7727.138, room temperature about 27 C, no air conditioning.
- In that `1080p60` run, a 185 second source video completed in about 700 seconds through the current compatibility path.
- During the frame-writing stage, Activity Monitor showed the `Browser Helper` process around 45 percent to 46 percent CPU and 75 percent to 77 percent GPU, with only slight fan noise.
- During that same frame-writing stage, observed memory usage stayed around 1.5 GB to 1.7 GB.
- During the audio/video merge stage, Activity Monitor showed `Browser Helper Renderer` around 350 percent CPU with no obvious GPU use, and fan noise increased noticeably but remained acceptable.
- Those CPU and GPU figures were observed manually in Activity Monitor and should be treated as approximate operational notes rather than sampled telemetry.
- After enabling the `1080p60` WebCodecs attempt path, the same source material completed in about 477 seconds.
- In that later `1080p60` run, Activity Monitor showed about 50.7 percent to 51.5 percent CPU and 85.2 percent to 87.9 percent GPU during export, while fan noise remained barely audible in a quiet room.
- Browser idle overhead on the same setup was observed at about 30 percent CPU and 4.1 percent GPU, so the export-path measurements should be interpreted against that baseline rather than as pure incremental load.
- As an external reference point, Jianying/Bijian generated `1080p60` HEVC at about 1.2x real time on the same machine, but bitrate and codec settings were not normalized, so the comparison is directional only.

## Known Risks

- Browser codec support can vary by version and platform.
- AAC encoding support through `AudioEncoder` may be less reliable than video encoding support.
- 1080p60 may still be too slow on some machines without hardware acceleration.
- 4K30 may need a later memory-focused pass before it is practical.
