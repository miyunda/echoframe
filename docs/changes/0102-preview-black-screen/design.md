# Design: Preview Black Screen

## Problem

The preview workbench can open to a black screen even when the required assets are loaded. The likely failure mode is that the full-frame canvas initializes before it has a usable size, so the first render is lost.

## Goals

- Make preview rendering wait for a real canvas size.
- Repaint the static frame whenever the canvas becomes measurable.
- Keep the fix local to the preview canvas lifecycle.

## Decisions

- Use `ResizeObserver` for the preview canvas container instead of relying only on `window.resize`.
- Skip drawing when the canvas width or height is zero.

