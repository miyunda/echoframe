# Implementation: Preview Black Screen

## Scope

- Harden `Visualizer.jsx` canvas sizing and redraw timing.

## Steps

1. Add change documentation.
2. Add a `syncCanvasSize` helper that reads the actual canvas bounds.
3. Observe container size changes with `ResizeObserver`.
4. Draw only after non-zero dimensions are available.
5. Verify the build.

