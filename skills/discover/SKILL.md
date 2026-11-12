---
name: discover
description: AEO phase 1. Classify the work (Step 0), map the codebase and any design system, establish intent and requirements, bootstrap the tracker, and stop at Gate 1 (scope approval). Run as /aeo:discover [--guided|--autonomous] <request>.
disable-model-invocation: true
argument-hint: "[--guided|--autonomous] <what you want to build or fix>"
model: sonnet
---

# /aeo:discover

AEO_ROOT is `${CLAUDE_PLUGIN_ROOT}`. Read `core/README.md` there for precedence. Pass `AEO_ROOT` in every delegation contract.

## 0. Start
1. Mode: `--autonomous` only if the user wrote it in this command; otherwise guided.
2. Read `.aeo/state.json` if it exists. Unfinished work: say where it stands and resume at the first incomplete step. Never redo a passed gate.
3. New run: create `.aeo/` (class 1: this is the only write before Gate 1 besides research notes), set `current_run` to `<YYYYMMDD-HHMM>-<slug>`, log `phase: discover` to `.aeo/runs/<run>/audit.jsonl`.
4. **Preflight** (`core/install-protocol.md`): `git` present; for UI work, the `ui-ux-pro-max` plugin enabled. Missing → install request card, stop. AEO's methods ship inside the plugin (`methods/`) and need no other skill plugin.

## 1. Step 0 classification
Follow `core/classification.md`. Show class, UI flag and evidence; accept the user's override. Split mixed requests.

## 2. Codebase map (existing code only)
Delegate to `Explore` with `model: "haiku"` (see `runtime/claude-code/routing.md`) **in the foreground**: wait for its report, because the steps below depend on it. Then write `.aeo/codebase-map.md` (format in `core/state-memory-audit.md`), including the `ui` section: tokens, Tailwind config, component library, `design-system/`. Rebuild only if HEAD moved in touched areas.

## 3. Intent and requirements
Methods are read and followed from `methods/` under AEO_ROOT (see `core/skill-precedence.md`); never use the Skill tool for them. **Read the method file for this step before asking the first question**, and use its question format.
- Who / why / success unknown → `methods/discovery/intent-interview.md` (one question at a time).
- Then `methods/discovery/requirements-interview.md` and `methods/architecture/domain-modeling.md` for decisions and vocabulary (concise when the request is already sharp).
- Autonomous mode cannot interview: if intent or requirements are ambiguous, stop and ask.
- External facts → `aeo:researcher` (Economy) with one question each.

## 4. Tracker
If `docs/agents/issue-tracker.md` is missing: AEO procedure P5 (`core/procedures/P5-tracker-bootstrap.md`). Guided: any tracker, with the user. Autonomous: local markdown only.

## 5. Gate 1
Present: class + evidence, UI flag, scope in and out, open questions, risks. Ask for scope approval. Record the approval (class, scope, wording) in `state.json` with the `approval_seq` the gate-ledger hook reported for the user's message (`core/state-memory-audit.md`), and in the audit log. Hedged replies are not approval. Next command: `/aeo:design`.

End with a short cost line from `node "${CLAUDE_PLUGIN_ROOT}/runtime/claude-code/scripts/cost-report.js" --project . --since <run start>` written to `.aeo/runs/<run>/cost.md`.
