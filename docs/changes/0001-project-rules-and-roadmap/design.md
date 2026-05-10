# Design: Project Rules and Roadmap

## Problem

EchoFrame needs clearer development discipline before larger visual and export changes begin.

The project is about to move from a compact single-purpose music visualizer toward a broader MV generator. That work will touch rendering architecture, export performance, UI controls, templates, and possibly a Mac desktop export path. Without explicit rules, implementation decisions can become hard to review or reverse.

## Goals

- Prevent direct commits on `main`.
- Define one branch naming convention.
- Require design, implementation, and test/acceptance documentation for all meaningful changes.
- Capture a staged roadmap for improving visual quality, background support, export performance, and Mac acceleration.
- Keep the roadmap practical enough to guide near-term implementation.

## Non-Goals

- Implement any runtime feature in this change.
- Choose the final desktop packaging framework.
- Finalize the exact preset API.
- Finalize performance benchmark targets.

## Decisions

Use this branch format:

```text
codex/<type>/<yyyymmdd>-<short-scope>
```

This keeps branches grouped by ownership prefix, intent, date, and human-readable scope.

Every meaningful change must include:

- `design.md`
- `implementation.md`
- `acceptance.md`

These documents should live under `docs/changes/<change-id>/`.

## Tradeoffs

This adds documentation overhead. The overhead is acceptable because upcoming work has architectural risk: rendering and export paths can easily diverge if decisions are not recorded.

The documentation requirement should stay concise. The goal is not long documents; the goal is traceable decisions and verifiable acceptance criteria.

## Open Questions

- Whether future pull requests should require a checklist in a PR template.
- Whether branch naming should be enforced by CI or kept as a human convention.
- Whether roadmap phase documents should be created only when a phase starts or pre-created as placeholders.

