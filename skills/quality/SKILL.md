---
name: quality
description: AEO phase 4. One release review: persona fan-out (or the small-change skip path), security gate on the Premium tier, performance and UI review when relevant, full validator run (Gates 7–8). Run as /aeo:quality [--guided|--autonomous].
disable-model-invocation: true
argument-hint: "[--guided|--autonomous]"
model: sonnet
---

# /aeo:quality

AEO_ROOT is `${CLAUDE_PLUGIN_ROOT}`.

## 0. Start
All tickets must have passed Gates 3–6. A gate counts as passed only if `node "${CLAUDE_PLUGIN_ROOT}/runtime/claude-code/scripts/verify-gates.js" --project .` supports it; run it first and redo any gate it fails. Preflight: the AEO reviewer agents are part of the plugin; for UI work, chrome-devtools MCP (fallback Playwright MCP; if neither, tell the user and offer manual screenshots; never skip silently). Log `phase: quality`.

## 1. Path
Apply the skip rule (`core/workflows.md`) and record the numbers.

## 2. Release review
AEO procedure P6 in both modes.

Spawn each once, read-only, in parallel. Each agent's frontmatter sets its model; **still pass `model` explicitly** as below, so a changed default can never downgrade a reviewer:

| Agent | model |
|---|---|
| `aeo:code-reviewer` | `sonnet` (`opus` for high blast radius, reason logged) |
| `aeo:security-auditor` | `opus`, always; give it `.aeo/debt.md` too |
| `aeo:test-engineer` | `haiku` |
| `aeo:web-performance-auditor` | `sonnet`, web UI with performance-relevant change only |
| `aeo:ui-reviewer` | frontmatter (`sonnet`), UI flag set only; URL and evidence path `.aeo/runs/<run>/evidence/ui/` in the contract |

Skip path: the `methods/security/security-hardening.md` checklist instead of the fan-out.

Wait for every spawned reviewer to finish and collect its full report before Gate 7. If a reviewer was started in the background, wait for its completion notice; in headless runs, spawn reviewers in the foreground. A missing report is a Gate 7 failure, never a pass.

## 3. Gates
- **Gate 7**: all required reports present, verbatim, not reranked across reviewers. Record `path` and the reviewers' `ledger_seq` numbers.
- **Gate 8**: no open critical/high security finding; run the cost report and confirm `security-auditor` actually ran on `claude-opus-5-5`. If it did not, Gate 8 fails: report it; never accept a downgrade.
- Full `aeo:workflow-validator` run over the release diff, spawned only after every reviewer report is in (never in the same batch as the reviewers; it checks their ledger records): every check in `core/validation.md` except 14 (checks 1–13 and 15). For check 5, give it each ticket's report number: the `report #N` that `verify-gates.js` prints on the ticket's gate 3–6 lines. Check 14 (debt ledger current) is not run here: `/aeo:deliver` refreshes `.aeo/debt.md` and its final validator run (Gate 9) checks it, so a ledger that only needs refreshing never blocks quality.

Gates 7 and 8 pass only with a validator `VERDICT: PASS`; on `FAIL` or `INCONCLUSIVE`, record them as failed with the validator's reasons, tell the user what blocked them and what would clear it, and stop. A new `/aeo:quality` run redoes the whole release review (steps 1–3): reports and verdicts from an earlier run, passed or failed, are not reused (check 13 counts only the latest review). Before you report, write gates 7 and 8 (status, path, reviewers' `ledger_seq`, the validator's `ledger_seq`) and `phase: quality` to `.aeo/state.json`, then re-run `verify-gates.js`. `/aeo:deliver` starts only from gates recorded there; a pass that is only in your reply does not count.

Findings become new tickets back through `/aeo:develop`; nothing is edited away. Next: `/aeo:deliver`.
