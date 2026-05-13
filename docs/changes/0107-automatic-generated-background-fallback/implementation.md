# Implementation: Automatic Generated Background Fallback

## Changed Files

- `src/App.jsx`

## Plan

1. Remove the visible background-source selector.
2. Make the background upload optional again at the UI level.
3. Use a stable generated-background asset as the fallback when no user image exists.
4. Let the workbench start when audio is present, regardless of whether a background image was uploaded.
