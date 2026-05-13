# Design: Debug Seed and HEIC Rejection

## Problem

Two current flows fail basic usability:

- The debug seed button generates audio and lyrics only, so the primary action remains blocked when no background image is present.
- HEIC and HEIF images can reach export unchanged and fail when the browser cannot decode them through `createImageBitmap`.

## Goals

- Make the debug seed action produce an immediately testable scene.
- Reject HEIC and HEIF uploads early with a clear instruction.
- Keep the change small and local to asset preparation and seed generation.

## Non-Goals

- Add full project fixtures or snapshot-based visual tests.
- Implement a general media transcoding pipeline.
- Change the export backend.

## Decisions

- Add a debug background generator so the seed action creates a complete scene.
- Reject unsupported HEIC and HEIF assets at upload time instead of failing later in preview or export.
- Keep format conversion outside the product and rely on Finder Quick Action or similar tools.

## Tradeoffs

Rejecting HEIC adds a conversion step for some users, but it keeps the browser product focused and avoids maintaining brittle format-conversion behavior that is not central to MV generation.
