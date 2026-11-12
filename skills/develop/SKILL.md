---
name: develop
description: AEO phase 3. Implement approved tickets test-first, each in its own worktree, with per-slice review and validator checks (Gates 3–6). Commits only through the commit approval prompt. Run as /aeo:develop [--guided|--autonomous].
disable-model-invocation: true
argument-hint: "[--guided|--autonomous]"
model: sonnet
---

# /aeo:develop

AEO_ROOT is `${CLAUDE_PLUGIN_ROOT}`. Orchestrate; do not implement tickets in the main session.

## 0. Start
Gate 2 (and 2a for UI work) must have passed. A gate counts as passed only if `node "${CLAUDE_PLUGIN_ROOT}/runtime/claude-code/scripts/verify-gates.js" --project .` supports it; run it first and redo any gate it fails. To redo a ticket gate (for example one reported `stale` because an implementer or debugger kept working after its validation), first set that ticket's gates 3–6 to `pending` in `state.json`, then re-review and re-validate the current code; a validation cannot pass while `state.json` still claims the stale gates. Read state; resume at the first unfinished ticket. Preflight. Log `phase: develop`.
Ask once for the run's git approvals if not yet recorded: class 3 (commits on the named branch) and class 5 (local integration merges). Without them, leave work uncommitted in worktrees.

## 1. Per ticket, frontier first (max 3 implementers, max 4 subagents)
Spawn implementers, reviewers and the validator **in the foreground** and wait for each result (several foreground calls in one message still run in parallel). Gate evidence comes only from foreground results: a background launch records no verdict (`core/state-memory-audit.md`).
1. **Implement**:
   - delegate to `aeo:implementer` (Balanced, frontmatter) with a full delegation contract (`core/contracts.md`): AEO_ROOT, ticket path, file scope, criteria, verify commands, `maxTurns 60`. P3 governs.
2. **Per-slice review**: follow `methods/code-review/code-review.md` on the ticket's diff. Add `${CLAUDE_PLUGIN_ROOT}/core/principles/minimal-change.md` to the Standards axis sources. Its sub-agents run on Balanced via `CLAUDE_CODE_SUBAGENT_MODEL`.
3. **Validate**: `aeo:workflow-validator` with a delegation contract whose first line is `TASK <ticket id>-validate…` (the ledger ties the verdict to the ticket by it; a validator result without it cannot pass a ticket gate), the diff command and the `ledger_seq` of the implementer's (or debugger's) latest result for the ticket; the validator reads that report in full with `verify-gates.js --report <ledger_seq>` (check 5). Gates 3, 4, 6.
4. **Gate 5**: no unresolved hard Standards or Spec violation. Record gates 3, 4 and 6 with the `ledger_seq` of the validator's own foreground `PASS` for this ticket, and gate 5 with the `ledger_seq` of both per-slice review results (Standards and Spec) on the final code, all inside this ticket's entry in `work_items[].tickets[]` (`core/state-memory-audit.md`). Run the per-slice review axes as foreground `aeo:code-reviewer` calls so the ledger records them; re-run both after any implementation change.
5. On any failure, classify with `core/failure-recovery.md` first. Only a diagnosed `reasoning` failure escalates (new Agent call with `model` one tier up; log from/to/diagnosis). One retry, one escalation, then the user.
6. On PASS: commit and merge into the integration branch only through the approval prompts.

Bugs during development → `aeo:debugger` (Balanced; Premium for intermittent / performance / cross-module, reason logged).
New dependency requests from agents → install request card (`core/install-protocol.md`), never a silent install.

## 2. After each ticket
Update `state.json` (status, gate evidence paths), append `SHORTCUTS` to `.aeo/debt.md`, and record the per-task model and cost with `node "${CLAUDE_PLUGIN_ROOT}/runtime/claude-code/scripts/cost-report.js" --project . --since <run start> --out .aeo/runs/<run>/cost.md`. Any requested-vs-actual model mismatch is reported to the user immediately.

When all tickets pass: `methods/development/code-simplification.md` may be proposed as a separate follow-up change. Next: `/aeo:quality`.
