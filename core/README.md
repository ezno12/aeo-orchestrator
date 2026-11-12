# AEO core (portable)

These files define the workflow independent of any runtime. They contain no model identifiers, prices or tool names; the Claude Code adapter in `runtime/claude-code/` maps them to concrete settings.

| File | Defines |
|---|---|
| `classification.md` | Step 0: six work classes and the UI flag |
| `workflows.md` | What each class does in each of the five phases |
| `gates.md` | Gates 1–10 and 2a, their evidence and who signs them |
| `contracts.md` | Delegation contract, response contract, completion evidence |
| `approvals.md` | The seven approval classes and approval wording |
| `failure-recovery.md` | Failure classes, retries, escalation, loop guard |
| `model-routing.md` | Economy / Balanced / Premium tiers, role assignment, escalation rules |
| `skill-precedence.md` | Which method owns which responsibility; other plugins in AEO projects |
| `state-memory-audit.md` | `.aeo/` layout, resume, memory, audit log |
| `cost-reporting.md` | What is recorded per task and per workflow |
| `validation.md` | Workflow Validator checks |
| `development.md` | Implementation rules for every ticket |
| `frontend.md` | Canonical UI rules and the design-direction step |
| `install-protocol.md` | Preflight and install requests |
| `principles/minimal-change.md` | Minimal correct change (adapted from Ponytail) |
| `../methods/` | Curated methods adapted from Matt Pocock and Addy Osmani (read by path, never via the Skill tool); audit in `methods/README.md` |
| `procedures/P1…P6` | Autonomous-mode procedures, each with a provenance header |

## Precedence (highest first)

1. The user's explicit instruction in this run.
2. Safety rules: approvals (`approvals.md`), never-cut list (`principles/minimal-change.md`), security gate.
3. The approved spec and ticket.
4. The project's own documented standards (CONTRIBUTING, CODING_STANDARDS, ADRs, agent instruction files).
5. AEO core.
6. AEO methods (`methods/`, adapted upstream guidance), as assigned in `skill-precedence.md`.

When two sources conflict at the same level, stop and ask; do not pick silently.
