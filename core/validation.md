# Workflow Validator checks

Which checks run when:

| Validation | Checks | Over |
|---|---|---|
| Per ticket (Gates 3–6, `/aeo:develop`) | 1–11 and 15 | the ticket's diff |
| Release review (Gates 7–8, `/aeo:quality`) | 1–13 and 15 (all except 14) | the release diff |
| Final (Gate 9, `/aeo:deliver`, after the debt ledger refresh) | 1–15, all of them | the release diff |

The validator receives only: the delegation contract, the agent's response block, and the diff command. It never sees the implementer's reasoning. It changes nothing and proves it (`git status --porcelain` identical before and after). It returns `PASS`, `FAIL` or `INCONCLUSIVE` per check, each with evidence.

## Per ticket

1. **Scope**: every changed file matches the contract's `may modify` globs and none matches `must not modify`.
2. **Criteria**: every acceptance criterion maps to concrete evidence.
3. **Re-run**: the contract's verification commands (tests, typecheck, lint) exit 0 when re-run by the validator.
4. **Test-first**: a failing test existed before the implementation (test log or commit order).
5. **Response block**: the latest implementer or debugger report for the ticket (at release, for every ticket), read in full with `node <AEO_ROOT>/runtime/claude-code/scripts/verify-gates.js --project . --report <ledger_seq>`. The script takes the report from Claude Code's session log and checks it against the sha256 and length the ledger recorded, so it is the whole report, neither truncated nor changed since it was recorded, and that every label of the response contract (`contracts.md`) is present. Never judge it from the ledger's `response_head` (an anchor excerpt, not the report). Missing, truncated, changed or incomplete = `FAIL`; the script's `report` line decides.
6. **Approvals**: every approval the work needed is recorded in the audit log. Work that needed an approval it does not have (for example an added dependency without a class 2 record) fails this check as well as check 8.
7. **Evidence**: every gate claimed has stored evidence.

## Minimal-change checks (objective only)

8. **No unapproved dependency**: no new entry in any manifest or lockfile without a class 2 approval record.
9. **Shortcut format**: every new `shortcut:` comment has both parts, `shortcut: <limit>, <when to upgrade>`, and is listed in the response block.
10. **Never-cut**: no `shortcut:` comment sits in validation at a trust boundary, error handling that prevents data loss, security controls, accessibility, or required tests. A violation is `FAIL`.
11. **Scope creep**: files or exported symbols added beyond the ticket are listed; unexplained additions are `FAIL`.

Taste (is this abstraction justified?) is not judged here; that belongs to the per-slice review's Standards axis.

## Release (Gates 7–8 in `/aeo:quality`, and Gate 9)

12. Security auditor ran, and its **actual** model was Premium (from the cost report).
13. Every persona required by the release path ran exactly once in the latest release review: the `agent_result` ledger records after the latest `/aeo:quality` prompt. Reports from an earlier review of the same run (before a fix and rerun) neither count nor fail this check.

## Delivery (Gate 9, in `/aeo:deliver` after the ledger refresh)

14. Debt ledger is current: every `shortcut:` comment in the release diff (`git diff <base>...HEAD`) has a row in `.aeo/debt.md` with the same `file:line`, and no open row points to a shortcut that no longer exists (it must be marked `resolved`). The PR body lists the same shortcuts. Not run in `/aeo:quality`: the ledger is refreshed in `/aeo:deliver` step 2.

## Every validation (per ticket and release)

15. **Gate ledger**: run `node <AEO_ROOT>/runtime/claude-code/scripts/verify-gates.js --project .`. Every `LEDGER` line must be `PASS` (the script's summary line is `LEDGER VERDICT`; never quote it as your own `VERDICT`): the hash chain is intact, each record is anchored in the session transcripts, every reference to a record in the session logs matches the ledger (records removed or rewritten fail), no implementer or debugger kept working after the validation a gate cites (a `SendMessage` continuation makes the gate stale until a fresh validation), the ticket's report is complete (check 5), and every gate `state.json` claims cites a supporting record (user approval for gates 1, 2, 2a, 10; a foreground validator `PASS` for the same ticket for gates 3–6; foreground reviewer reports for 7–8). For each cited approval, also judge its wording against `core/approvals.md`. Any `FAIL` fails this check; a gate claimed without a record is never `INCONCLUSIVE`.
