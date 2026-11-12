# Adaptive workflows by class

"Guided-only" steps need the user live and are never automated.

| Class | Discover | Design | Develop | Quality | Deliver |
|---|---|---|---|---|---|
| `new-project` | Intent; grilling and domain modelling; stack choice by cited research; tracker bootstrap; optional `CONSTRAINTS.md` | Spec; architecture and ADRs; tickets, ticket 1 is a walking skeleton (build, test command, CI) | All tickets test-first | Full release review | README, ADRs, CI, PR. No deploy unless asked |
| `full-project` | As `new-project`, plus a decision map when the route is unclear (guided-only) | One spec and ticket set per milestone | Per milestone | Release review per milestone | Per milestone; suggest a retro |
| `new-feature` | Refresh codebase map; grilling (short if the request is already sharp) | Spec; impact analysis; tickets | Test-first tickets; per-slice review | Release fan-out unless the skip rule applies | Docs, changelog, debt ledger, PR |
| `improvement` | Codebase map; intent gate | Heavy impact analysis; characterisation tests first; migration plan if consumers are affected. A single ticket may skip the spec | Characterisation tests stay green; new behaviour red → green | As feature | PR states one-way or two-way door and blast radius |
| `bug-fix` | Reproduce (debugger) | Confirmed root cause; minimal fix plan; one ticket; no spec | Regression test red, fix, green; full suite | Per-slice review; security checklist if a trust boundary is touched; fan-out only if the skip rule fails | PR with the confirmed hypothesis |
| `refactoring` | Codebase map; architecture survey (guided-only) or codebase design | Deepening design; impact analysis; wide changes use expand → migrate → contract tickets | Suite green before and after each slice; no behaviour change | Per-slice Standards axis; test-engineer checks coverage held | PR with blast radius |

## UI work (any class with `ui != none`)

See `frontend.md`. Adds: design-system detection in discover, design direction and Gate 2a in design, UI ticket rules in develop, UI review in quality, screenshots in deliver.

## Release fan-out skip rule

All three must hold: the release touches 2 files or fewer, the diff is under 50 lines, and it touches no authentication, payments, data access or configuration. Then the release review is the security checklist plus the full validator run. Otherwise run the full persona fan-out.

## Modes

| | Guided (default) | Autonomous (`--autonomous`, per run) |
|---|---|---|
| Spec, tickets, tracker setup | AEO procedures P1, P2, P5 with the user: seams confirmed, breakdown iterated, any tracker | Same procedures without live interaction: seams and breakdown go to Gate 2; local tracker only |
| Labelling | Every procedure output starts with its provenance line | Same |
| Requirements interview | Live | Not available: start only from a confirmed intent and spec; stop at the first ambiguity |
| Approvals | All | All. Autonomous mode removes typing, never approvals |
| Audit log | `mode: guided` | `mode: autonomous`, plus procedure id |
