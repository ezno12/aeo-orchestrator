<!-- Provenance: AEO procedure P3 (ticket-implementation). Original AEO text, adapting
mattpocock/skills `implement` @ 4ae2317 (MIT © 2026 Matt Pocock). Unlike upstream, it never
commits on its own: commits go through approval class 3. -->
# P3: ticket implementation

Run by `aeo:implementer` in its own worktree, from a delegation contract.

1. Read the ticket, the contract, `core/development.md` and `core/principles/minimal-change.md`.
2. **Before the loop**, list every place the change must reach (callers, tests, fixtures, config, exports). If any is outside the contract's file scope, stop with `STATUS blocked` and failure class `scope`.
3. Red → green following `methods/testing/test-driven-development.md`, one seam at a time, at the seams agreed in the spec and ticket. Record each failing-test run as evidence.
   Slice rules (from Addy Osmani's `incremental-implementation`): one concern per step; the code builds and the existing tests pass after every step; no unrelated refactor or config change mixed in. Commits are not part of the loop (approval class 3).
4. Typecheck and run single test files regularly; run the full suite once at the end.
5. Any deliberate shortcut gets `shortcut: <limit>, <when to upgrade>` and a line under `SHORTCUTS`.
6. Do not commit, push or merge. Leave the worktree for the orchestrator.
7. Return the response contract with `NOT VERIFIED` filled in.

The orchestrator then runs the per-slice review (`methods/code-review/code-review.md`, with `core/principles/minimal-change.md` added as a standards source) and the Workflow Validator.
