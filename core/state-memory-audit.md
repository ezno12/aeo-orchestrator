# State, memory and audit

## Layout

```
.aeo/
  state.json          work items, class, UI flag, mode, phase, tickets + status,
                      gates + evidence paths, approvals, attempt counters, current run id
  memory.md           workflow memory: conventions, decisions, recurring pitfalls (< 200 lines,
                      curated, written only by the orchestrator)
  codebase-map.md     stack, build/test/lint commands, structure, conventions, hot spots,
                      glossary/ADR pointers, agent instruction files, UI/design-system section,
                      and the HEAD commit it was built from
  debt.md             shortcut ledger (see /aeo:deliver)
  runs/<run-id>/      (git-ignored)
    audit.jsonl       append-only log
    cost.md           per-task and per-workflow model usage and cost
    evidence/         gate evidence; ui/ screenshots
```

Committed: `state.json`, `memory.md`, `codebase-map.md`, `debt.md`. Ignored: `runs/`.

Domain memory stays where the domain-modeling method keeps it (`GLOSSARY.md`/`CONTEXT.md`, `docs/adr/`). `.aeo/memory.md` is only for workflow knowledge.

## Resume

Every command reads `state.json` first and checks its gate claims with `runtime/claude-code/scripts/verify-gates.js`; a claim the ledger does not support is treated as not passed. Unfinished work resumes at the first incomplete step; completed gates are not repeated. If HEAD moved since the codebase map was built and touched areas differ, rebuild the map first.

## Audit log

`audit.jsonl` receives one JSON object per line. Orchestrators and agents append to it and never read it whole (it grows with every command); resume state comes from `state.json`. To check one record, filter it (for example `grep '"phase":"design"'`).

- from the orchestrator: phase changes, classification, delegations (task, agent, tier, reason), approvals (class, scope, wording), gate results, failure classes, escalations with diagnosis;
- from hooks, independent of the model: every Bash command with its git / dependency category, every subagent start and stop with requested and actual model and token usage.

Never rewrite or truncate the log.

## Gate ledger (`.aeo/gates.jsonl`)

Written only by the `hooks/ledger.js` hook, never by the orchestrator or an agent (project settings deny Edit, Write and Bash on it, and the file is read-only between appends). Each record is numbered and hash-chained, and carries the session and tool-use ids that anchor it in Claude Code's own transcripts:

- `user_prompt`: every message the user types (the only source of gate approvals);
- `agent_result`: the final result of every `aeo:*` agent call (validator verdicts, reviewer reports).

After each such event the hook tells the orchestrator the record number. Gate entries in `state.json` cite it; a gate without a cited record is not passed. Keep this schema exactly; the verifier fails ticket gates that are not inside a ticket with an `id`:

```
"gates": { "1": {"status": "passed", "approval_seq": 12},
           "7": {"status": "passed", "path": "fanout", "ledger_seq": [31, 32, 33]},
           "8": {"status": "passed", "ledger_seq": [32]} }
"work_items": [ { "id": "W1", "gates": {…}, "tickets": [ { "id": "01", "gates": {
    "3": {"status": "passed", "ledger_seq": 27}, "4": {…27}, "6": {…27},   (the validator PASS for this ticket)
    "5": {"status": "passed", "ledger_seq": [25, 26]} } } ] } ]    (Standards and Spec reviews of the final code)
```

What the verifier detects, the Claude Code log format it depends on, the versions tested and the remaining limits: `runtime/claude-code/ledger.md`. The ledger detects tampering; it does not prevent it.

`state.json` stays freely writable (no prompts for routine updates); it is a claim, and `runtime/claude-code/scripts/verify-gates.js` checks every claim against the ledger (validation check 15). Gate-relevant agents run in the foreground: a background call records only its launch, not its verdict.
