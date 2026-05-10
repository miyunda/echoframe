# Project Rules

This document defines the working rules for EchoFrame changes. These rules apply to code, product, design, documentation, build, and release work.

## Branching

Do not commit directly to `main`.

All work must happen on a topic branch with this format:

```text
codex/<type>/<yyyymmdd>-<short-scope>
```

Allowed `<type>` values:

- `docs`: documentation-only changes
- `feat`: user-facing feature work
- `fix`: bug fixes
- `perf`: performance improvements
- `refactor`: internal restructuring without intended behavior changes
- `test`: test-only changes
- `chore`: tooling, dependency, or maintenance work

Examples:

```text
codex/docs/20260510-roadmap-governance
codex/feat/20260511-visualizer-presets
codex/perf/20260514-webcodecs-export
```

If a change has more than one type, choose the type that best describes the user-visible goal.

## Documentation

Every change must include three document types:

- Design document: explains the problem, goals, non-goals, user experience, architecture, tradeoffs, and open questions.
- Implementation document: explains the planned work, changed files/modules, sequencing, migration risks, and rollback approach.
- Test and acceptance document: explains verification steps, acceptance criteria, manual checks, automated tests, performance checks, and known residual risks.

For feature or architecture work, place these documents under:

```text
docs/changes/<change-id>/
```

Use this structure:

```text
docs/changes/<change-id>/design.md
docs/changes/<change-id>/implementation.md
docs/changes/<change-id>/acceptance.md
```

The `<change-id>` should be stable and readable:

```text
0002-visualizer-preset-system
0003-webcodecs-export-pipeline
```

Documentation-only changes still need design, implementation, and acceptance records when they establish project direction or rules.

## Roadmap Discipline

Roadmap items should be staged so each phase can ship independently.

Each roadmap phase must define:

- User value
- Technical scope
- Required documents
- Acceptance criteria
- Risks and fallback path

Performance work and visual feature work should stay decoupled when possible. A faster export path should not require a specific visual style, and a new visual style should not require a specific encoder.

