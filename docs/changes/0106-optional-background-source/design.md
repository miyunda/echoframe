# Design: Optional Background Source

## Problem

The current flow blocks users until they upload a background image. That adds friction for quick trials and does not match the renderer's direction toward reusable visual scenes.

## Goals

- Replace the background-image requirement with a background-source model.
- Let users choose either an uploaded image or a generated dynamic background.
- Keep preview and export behavior consistent through the shared renderer.

## Non-Goals

- Support uploaded background video in this change.
- Generate AI video assets or remote media.
- Add advanced background controls beyond source selection.

## Approach

The app state moves from `image` to `background`. The minimum supported types are `image` and `generated`.

When the selected source is `generated`, the shared canvas renderer draws a built-in procedural backdrop instead of expecting a user image. That keeps the no-image path deterministic and exportable.
