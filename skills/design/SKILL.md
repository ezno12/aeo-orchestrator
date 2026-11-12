---
name: design
description: AEO phase 2. Research, spec, architecture, change-impact analysis, ticket breakdown with file scopes, and for UI work the design direction. Stops at Gate 2 (plan approval) and Gate 2a (design direction). Run as /aeo:design [--guided|--autonomous].
disable-model-invocation: true
argument-hint: "[--guided|--autonomous]"
model: opus
---

# /aeo:design

AEO_ROOT is `${CLAUDE_PLUGIN_ROOT}`. Premium tier is used here because architecture and spec decisions are the highest-leverage judgement in the workflow (`core/model-routing.md`). Delegated tasks still use their own cheaper tiers.

## 0. Start
Read `.aeo/state.json`; Gate 1 must have passed. A gate counts as passed only if `node "${CLAUDE_PLUGIN_ROOT}/runtime/claude-code/scripts/verify-gates.js" --project .` supports it; run it first and redo any gate it fails. Resume if partly done. Preflight per `core/install-protocol.md`. Log `phase: design`.

**Context budget (this command runs on the Premium tier).** Read only `.aeo/state.json`, `.aeo/codebase-map.md` and the AEO core and method files named in the step you are on. Do not read source files, tickets or other AEO files one by one here: send codebase reading and fact gathering to `Explore` with `model: "haiku"` (or `aeo:researcher`), with one precise question each, and work from their answers. Never read run logs (`.aeo/runs/**/audit.jsonl`, `cost.md`): append to them only. Keep Premium turns for decisions.

## 1. Research
One `aeo:researcher` (Economy) per open question, in parallel (max 4 subagents). Interpretation-heavy questions go to the orchestrator or a Balanced researcher call, with the reason logged.

## 2. Spec (skip for `bug-fix` and single-ticket `improvement`)
AEO procedure P1 (method `methods/specification/specification-writing.md`) in both modes. Guided: confirm the test seams with the user before writing. Autonomous: seams become a Gate 2 item.

## 3. Architecture and impact
- Methods (under `methods/`): `architecture/module-design.md`; `architecture/public-interface-design.md` for public/external interfaces; `architecture/adversarial-decision-review.md` for one-way-door decisions; `architecture/deprecation-and-migration.md` when consumers are affected. ADRs in `docs/adr/`, format `architecture/domain-modeling/adr-format.md`.
- Change impact analysis: callers/importers of touched modules, covering tests, public interfaces, ADR conflicts, schema/API consumers. Rate one-way/two-way door and blast radius. This sets risk and the release skip-rule outcome.
- `bug-fix`: delegate reproduction to `aeo:debugger` (Balanced; Premium if intermittent, performance or cross-module, with the reason logged). Confirmed root cause before any plan.

## 4. Design direction (only when the UI flag is `new` or `redesign`)
Follow `core/frontend.md`:
1. If an existing design system was found, it wins: document how the work uses it; skip to 4.4.
2. Run `ui-ux-pro-max:ui-ux-pro-max` searches (design-system recommendation, then typography, colour, landing or chart as relevant). Treat results as options.
3. Use `frontend-design:frontend-design` to shape 2–3 distinct directions; check each against the anti-patterns in `methods/frontend/ui-engineering.md`.
4. Write the design contract per that method, plus the canonical rules (widths 320/375/768/1024/1440, WCAG 2.2 AA, visible focus ≥ 3:1, reduced motion, self-hosted fonts by default).
5. guided: offer UI variants per `methods/architecture/prototyping.md` (`methods/architecture/prototyping/ui-prototype.md`).
6. `design-system/<slug>/MASTER.md` is written only with class 1 approval for that path.
7. **Gate 2a**: the user approves one direction. Record it with its `approval_seq`.

## 5. Tickets
AEO procedure P2 (method `methods/planning/ticket-breakdown.md`) in both modes, with the AEO fields (`Files in scope`, `Verify`, `UI`). Guided: iterate on granularity and blocking edges with the user.

## 6. Gate 2
Present spec, architecture, impact analysis, tickets with file scopes and verification commands, risk level, and the planned model tier per role (from `runtime/claude-code/routing.md`, with any Premium assignment and its reason). Ask for approval of the plan and the file scopes; record it with its `approval_seq`. Plan approval does not grant commits, merges, installs, pushes or deploys. Record it. Next: `/aeo:develop`.

Write the cost line to `.aeo/runs/<run>/cost.md` as in `/aeo:discover`.
