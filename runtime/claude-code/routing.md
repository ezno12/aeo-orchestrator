# Claude Code routing (adapter for core/model-routing.md)

Validated against Claude Code 2.1.322. See `evals/README.md` for the routing tests (R1–R7) and their latest results.

## Tier → model alias

| Tier | Alias | Model id |
|---|---|---|
| Economy | `haiku` | `claude-haiku-5-5` |
| Balanced | `sonnet` | `claude-sonnet-5-5` |
| Premium | `opus` | `claude-opus-5-5` |

`fable` (`claude-fable-5-2`) is never assigned automatically; only on the user's explicit request.

## How a subagent's model is resolved (observed in the 2.1.322 binary)

1. The `model` argument of the Agent tool call, for that one call; otherwise the agent definition's `model` frontmatter.
2. Otherwise `CLAUDE_CODE_SUBAGENT_MODEL` (AEO project settings set it to `sonnet`, so unassigned subagents never inherit a Premium main session).
3. Otherwise the main session's model.

`CLAUDE_CODE_SUBAGENT_MODEL_FORCE` would disable (1). AEO never sets it.

## Assignment table (what the orchestrator passes)

| Role | How it is reached | Model | Set by |
|---|---|---|---|
| `aeo:researcher` | Agent tool | `haiku` | frontmatter |
| `aeo:implementer` | Agent tool | `sonnet` | frontmatter |
| `aeo:debugger` | Agent tool | `sonnet` (pass `model: "opus"` for intermittent / performance / cross-module bugs, or after a diagnosed reasoning failure) | frontmatter + call |
| `aeo:workflow-validator` | Agent tool | `sonnet` (pass `opus` for high-risk releases) | frontmatter + call |
| `aeo:ui-reviewer` | Agent tool | `sonnet` | frontmatter |
| `Explore` (built-in) | Agent tool | `haiku` | **always pass `model: "haiku"`** |
| `aeo:code-reviewer` | Agent tool | `sonnet` (`opus` for high blast radius) | frontmatter + **call** |
| `aeo:security-auditor` | Agent tool | **`opus`, always** | frontmatter + **call** (both, so neither alone can downgrade it) |
| `aeo:test-engineer` | Agent tool | `haiku` | frontmatter + **call** |
| `aeo:web-performance-auditor` | Agent tool | `sonnet` | frontmatter + **call** |
| Per-slice review sub-agents (`methods/code-review/code-review.md`) | spawned by the orchestrator | `sonnet` via `CLAUDE_CODE_SUBAGENT_MODEL` | env |
| Doubt-driven reviewer (`methods/architecture/adversarial-decision-review.md`) | spawned by the design orchestrator | `sonnet` (`opus` for a one-way door with a high blast radius, reason logged) | **call** |
| Any other subagent | — | `sonnet` via env | env |

## Main session (orchestrator)

Each AEO command declares a `model` in its frontmatter: `sonnet` for discover, develop, quality and deliver; `opus` for design. Test R5 (2.1.322, headless): a session started on `haiku` ran `/aeo:discover` entirely on `sonnet`, so the switch works for the command's turn. VS Code panel (round-6 acceptance, 2.1.322): the command's model covers only the command's own turn. Every later turn in that phase ran on the panel's default model, including plain replies to the command's questions ("yes") and turns started automatically when a background agent reports back. With an Opus default, that moved all of discovery after its first turn onto Opus. The project template therefore sets `"model": "sonnet"` (project scope; the user's global default is untouched); `/aeo:design` still switches its own turn to Opus. Agents are unaffected: their models come from their frontmatter or the orchestrator's `model` parameter. The cost report shows which model each turn actually used.

## Validated on 2.1.322 (evals/RESULTS.md)

R1 frontmatter model · R2 per-call override · R3 explicit persona models (security-auditor ran on Opus) · R4 `CLAUDE_CODE_SUBAGENT_MODEL` from project settings · built-in Explore defaults to Haiku · R5 command-skill model switch (headless) · R6 cost computation matches the runtime's reported cost for all three tiers.

## Escalation call

Escalation is a new Agent call with an explicit `model` one tier up, after the failure diagnosis has been written to the audit log. Never re-run the same task on the same tier more than once.

## Verification

After every delegated task, `scripts/cost-report.js` reads the subagent's transcript and `.meta.json` (`agentType`, requested `model`, `pickedEffortModel`) and the model on each message. The validator compares them with this table.
