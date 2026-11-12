---
name: deliver
description: AEO phase 5. Docs, ADRs, changelog, shortcut debt ledger, PR body with evidence and screenshots, rollback plan, cost report and go/no-go (Gates 9–10). Push, merge and deploy are left to the user. Run as /aeo:deliver.
disable-model-invocation: true
argument-hint: "[--guided|--autonomous]"
model: sonnet
---

# /aeo:deliver

AEO_ROOT is `${CLAUDE_PLUGIN_ROOT}`.

## 0. Start
Gates 7–8 must have passed. A gate counts as passed only if `node "${CLAUDE_PLUGIN_ROOT}/runtime/claude-code/scripts/verify-gates.js" --project .` supports it; run it first and redo any gate it fails. Log `phase: deliver`.

**Read the delivery methods before writing anything.** Open each of these with the Read tool from AEO_ROOT, in this session, before step 1: `methods/delivery/documentation.md`, `methods/delivery/pull-request-writing.md`, `methods/delivery/release-readiness.md` (and `methods/development/ci-cd-automation.md` only if CI changes are in scope). Knowing them is not enough. Each step below follows the named method's structure; list the method files you read in the run summary.

## 1. Documentation
`methods/delivery/documentation.md` (ADRs in `docs/adr/`, format `methods/architecture/domain-modeling/adr-format.md`), README and changelog updates within the approved scope.

## 2. Debt ledger
<!-- Adapted from Ponytail ponytail-debt @ 96608e0 (MIT © 2026 DietrichGebert); see ATTRIBUTION.md -->
1. Find every `shortcut:` comment in the release diff (`git diff <base>...HEAD`) and in the touched files.
2. Write `.aeo/debt.md`: one row per shortcut: `file:line`, the limit, when to upgrade, ticket, date. Keep earlier rows that still exist; mark removed ones `resolved`.
3. Validator check 10 must still pass (no shortcut in a never-cut area).
4. Add a "Deferred (shortcuts)" section to the PR body listing them.

## 3. Pull request
`methods/delivery/pull-request-writing.md` for the PR body, using its sections (Summary, Evidence, Merge Danger): what changed and why, evidence (gate evidence paths, test commands and results), the debt section, and for UI work before/after screenshots from `.aeo/runs/<run>/evidence/ui/`. Write it to `.aeo/runs/<run>/pr.md`; AEO does not push or open the PR.

## 4. Release decision
`methods/delivery/release-readiness.md`: its pre-launch checklist (mark items not applicable with a reason), the rollback plan in its template, go / no-go criteria. `methods/development/ci-cd-automation.md` if CI changes are in scope.

## 5. Cost report
`node "${CLAUDE_PLUGIN_ROOT}/runtime/claude-code/scripts/cost-report.js" --project . --since <run start> --out .aeo/runs/<run>/cost.md`. Show the totals by phase, tier and model, the Premium tasks with their reasons, and any requested-vs-actual mismatch. Label figures as computed lower bounds.

## 6. Gates 9–10
Final `aeo:workflow-validator` run, spawned in the foreground, after steps 1–5: every check in `core/validation.md`, 1–15, over the release diff (for check 5, give it each ticket's `report #N` from the `verify-gates.js` gate 3–6 lines), with check 14 against the refreshed `.aeo/debt.md` (check 14 runs here, not in `/aeo:quality`). This run is Gate 9 and is never skipped or deferred to the user: do not ask for go / no-go until its report is in, and if it is not `PASS`, stop and report. After Gate 9 passes, run `verify-gates.js` once more and add a **Gate ledger** section to `.aeo/runs/<run>/pr.md` with its `LEDGER head` line (record number and full hash) and its `LEDGER VERDICT`. Once the pull request is opened, that hash sits outside this machine: a later rewrite of the ledger up to that record no longer matches it (`runtime/claude-code/ledger.md`). Then the user's go / no-go, recorded as gate 10 with its `approval_seq`. Then print, without running them, the exact commands for the user: push, PR creation, merge, deploy. Each is a separate user action (approval classes 4–6).
