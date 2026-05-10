# Acceptance: Project Rules and Roadmap

## Acceptance Criteria

- The repository documents that direct commits to `main` are not allowed.
- The repository documents the branch naming format.
- The repository documents the design, implementation, and test/acceptance documentation requirement.
- The roadmap follows the proposed staged direction:
  - visual scene foundation
  - background track system
  - lyric and avatar upgrade
  - browser export performance
  - Mac accelerated export
  - project model and template sharing
- This documentation change has its own design, implementation, and acceptance documents.

## Verification

Manual verification:

- Read `docs/project-rules.md`.
- Read `docs/roadmap.md`.
- Confirm this directory contains `design.md`, `implementation.md`, and `acceptance.md`.
- Confirm the current branch is not `main`.

Automated verification:

- No automated tests are required because this change does not alter runtime code.

## Known Risks

- The rules are documented but not enforced by CI.
- Future contributors may skip change documents unless reviews enforce the rule.

