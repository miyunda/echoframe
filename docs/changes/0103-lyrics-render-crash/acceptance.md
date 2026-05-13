# Acceptance: Lyrics Render Crash

## Acceptance Criteria

- Entering the workbench with an LRC file no longer causes a black screen.
- Preview works both with and without lyrics.

## Verification

Manual checks:

- Load generated debug audio plus generated LRC and open the workbench.
- Load a user-supplied LRC and open the workbench.

Automated checks:

- `npm run build`

