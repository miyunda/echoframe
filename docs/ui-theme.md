# UI Theme Rules

EchoFrame's application UI uses the Rosé Pine Dawn palette defined in [tailwind.config.js](/Users/yu/repos/echoframe/tailwind.config.js:1).

## Scope

These rules apply to the app shell, controls, panels, overlays, buttons, forms, status surfaces, and supporting text.

These rules do not automatically apply to exported video scenes. Scene rendering may use preset-specific art direction as long as preview and export stay aligned.

## Rules

- Prefer theme tokens such as `base`, `surface`, `overlay`, `muted`, `subtle`, `text`, `rose`, `pine`, `foam`, and `iris` over hard-coded `white`, `black`, or raw hex values in UI components.
- Use `text` and `subtle` for default readability. Do not use translucent white text on light surfaces.
- Use `surface` and `overlay` for unselected cards, panels, and controls. Reserve pure white for elevated or selected surfaces.
- Map positive or success states into the Dawn palette first, usually `pine` or `foam`, before introducing unrelated green utility colors.
- Map destructive actions into `rose`/`love` variants before introducing unrelated red utility colors.
- If a UI state needs a color that does not fit the existing token set, add a named token in `tailwind.config.js` before using a raw color in component markup.

## Allowed Exceptions

- Canvas-rendered video scenes in `scenePresets` and `sceneRenderer` may keep preset-specific colors.
- Browser-engine overlays, image content, and user media previews are not required to match the UI palette.
- Temporary debug UI may use direct colors, but it should not ship without either tokenizing them or documenting why the exception is necessary.
