# Design: Hide Audio Title

## Problem

The rendered scene prints the uploaded audio file name, such as `foo.wav`, into the video frame. This can look accidental and distract from the visual composition.

## Goal

Remove the audio file name from the rendered canvas so preview and export frames no longer show it.

## Non-Goals

- Add a configurable title field.
- Redesign typography or lyric layout.
- Remove file names from upload cards or other non-rendered UI.
