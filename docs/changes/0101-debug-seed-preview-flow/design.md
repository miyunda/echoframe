# Design: Debug Seed Load Flow

## Problem

The debug seed action currently switches directly into preview after generating assets. In practice this creates a confusing black-screen transition and does not match the intended behavior of simply loading test audio and subtitles.

## Goals

- Make the debug seed action load test assets without forcing a preview transition.
- Show a clear loaded state for the generated subtitle asset.
- Keep the generated background so the preview button becomes immediately usable.

## Decisions

- Treat the debug seed action as asset preparation, not navigation.
- Track a display name for the loaded lyric asset instead of showing a generic placeholder.

