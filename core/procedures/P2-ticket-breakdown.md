<!-- Provenance: AEO procedure P2 (tickets). Runs the vendored method methods/planning/ticket-breakdown.md,
adapted from mattpocock/skills `to-tickets` @ 4ae2317 (MIT © 2026 Matt Pocock), plus the
slice rules of addyosmani/agent-skills `incremental-implementation` @ 301b02b that it lacks. -->
# P2: ticket breakdown (both modes)

Follow `methods/planning/ticket-breakdown.md`, with these AEO rules:

1. Read the approved spec.
2. Draft tracer-bullet vertical slices: each cuts a narrow, complete path through every layer, is verifiable on its own, and fits one fresh context. Prefactoring first. Wide mechanical refactors use expand → migrate → contract tickets instead. A slice changes one concern: no ticket mixes a feature, an unrelated refactor and build-config changes.
3. Give each ticket its blocking edges.
4. Add AEO fields to each ticket: `Files in scope` (globs the implementer may modify), `Verify` (commands), `UI` (yes/no). Shared files (lockfiles, migrations) belong to one ticket only.
5. Present the breakdown (title, blocked by, what it delivers, file scope). **Guided**: iterate with the user on granularity and edges (the method's "quiz" step). **Autonomous**: the same list goes to Gate 2.
6. Local tracker: write `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from 01 in dependency order, using the method's local template with the AEO fields, first line:

```
> Produced by AEO procedure P2 (method to-tickets, adapted from Matt Pocock's skills).
```

   A remote tracker is published only after the user's explicit approval for that publish.
7. The user approves the breakdown and file scopes at Gate 2; autonomous mode does not skip this approval.
