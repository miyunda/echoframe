# Acceptance: Preview Black Screen

## Acceptance Criteria

- Entering the workbench with generated test assets no longer shows a black preview.
- The preview canvas renders after mount without requiring a manual window resize.
- The project still builds successfully.

## Verification

Manual checks:

- Load the generated debug assets.
- Click `进入可视化工作台`.
- Confirm the preview shows the background/title/visual treatment instead of a black frame.

Automated checks:

- `npm run build`

