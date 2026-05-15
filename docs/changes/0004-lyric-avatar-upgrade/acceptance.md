# Acceptance: Lyric and Avatar Upgrade

## Acceptance Criteria

- The Phase 3 lyric/avatar direction is documented in a way that can guide implementation.
- `.lrc`, `.srt`, and `.vtt` are documented as supported lyric input formats.
- Lyric layout modes are named and scoped clearly enough to build against.
- Avatar modes are named and scoped clearly enough to build against.
- Preview and export are still expected to share lyric timing and avatar rendering logic.

## Verification

Manual checks:

- Review the current upload flow and confirm subtitle parsing supports `.lrc`, `.srt`, and `.vtt`.
- Confirm the documented lyric modes match existing renderer behavior where applicable and leave room for the next implementation slice.
- Confirm the documented avatar modes match existing circle and vinyl behavior while defining `hidden` and `glow-ring` as valid next steps.
- Confirm the Phase 3 docs stay consistent with the roadmap language.

Automated checks:

- `npm run build`

## Known Gaps

- No automated rendering tests currently verify subtitle timing equivalence across `.lrc`, `.srt`, and `.vtt`.
- Lyric layout and avatar mode controls are documented here before their full UI surface is implemented.
- Karaoke progress remains intentionally deferred until cue-progress data and rendering rules are defined more tightly.
