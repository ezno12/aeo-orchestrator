<!-- Provenance: AEO procedure P4 (parallel-build). Original AEO text, replacing
mattpocock/skills `implement-spec` @ 4ae2317 (MIT © 2026 Matt Pocock). Differences from upstream:
nesting depth 1 (implementers never spawn agents), at most 3 implementers, commits and merges
go through approval classes 3 and 5, no PR is opened or marked ready by AEO. -->
# P4: parallel build

1. Read the spec and tickets; build the task graph and the current frontier.
2. Ask for class 3 (commits) and class 5 (local integration merges) approvals for this run and integration branch. Without them, run tickets sequentially and leave work uncommitted in worktrees for the user.
3. Create the integration branch (local only).
4. For each frontier ticket (at most 3 at once), delegate to `aeo:implementer` with P3, in its own worktree based on the integration branch.
5. When an implementer returns `done`: per-slice review, then validator. On `PASS`, the orchestrator merges into the integration branch (class 5 prompt). On `FAIL`, apply `failure-recovery.md`.
6. Recompute the frontier; continue until all tickets are done or a stop condition is reached.
7. Run the per-slice review once more over the integration branch; fixes go to one fresh implementer.
8. Clean up worktrees that have been merged; keep failed ones for inspection.
9. Report the integration branch. Opening a PR and pushing are the user's actions.
