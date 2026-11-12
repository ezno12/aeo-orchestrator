# Model routing (cost-optimized)

Objective: maximum engineering quality at minimum reasonable cost. Use the cheapest tier that can **reliably** do the task; never the strongest tier by default.

## Tiers

| Tier | For |
|---|---|
| Economy | Simple research and fact extraction, codebase search, routine checks, coverage-gap scans, summarising, formatting |
| Balanced | Implementation, debugging, validation, frontend engineering, per-slice review, UI review, orchestration of develop/quality/deliver |
| Premium | Complex architecture, difficult debugging after a diagnosed reasoning failure, security-critical reasoning |

## Role assignment (automatic)

The orchestrator assigns the tier from the role; it does not ask the user per task.

| Role | Tier | Escalates to | Never below |
|---|---|---|---|
| Researcher (docs, API facts) | Economy | Balanced when sources conflict or need interpretation | — |
| Codebase search / map | Economy | Balanced if the map is wrong | — |
| Test-coverage scan (test-engineer) | Economy | Balanced if the validator finds the output shallow | — |
| Implementer | Balanced | Premium on a diagnosed reasoning failure | — |
| Debugger, routine | Balanced | Premium on a diagnosed reasoning failure | — |
| Debugger, intermittent / performance / cross-module | Premium | User | Premium |
| Workflow Validator | Balanced | Premium for releases marked high-risk | Balanced (a gate is never judged on Economy) |
| Per-slice review sub-agents | Balanced | Premium if the diff exceeds ~1000 lines or touches auth or data | — |
| Code reviewer (release) | Balanced | Premium for high blast radius | — |
| UI reviewer | Balanced | — | — |
| Web performance auditor | Balanced | — | — |
| **Security auditor** | **Premium** | User | **Premium: never downgraded to save cost** |
| Orchestrator: discover, develop, quality, deliver | Balanced | Premium only if the user asks | — |
| Orchestrator: design (architecture, spec, ADRs) | Premium | — | — |
| Any other subagent | Balanced (default) | — | — |

## Escalation

- Escalate only for (a) task complexity known at assignment time and recorded as the reason (for example "auth change", "cross-module race"), or (b) a diagnosed `reasoning` failure (`failure-recovery.md`).
- Never escalate for `environment`, `context`, `scope` or `budget` failures.
- One tier step per escalation; record from, to and reason.

## Verification

- The tier actually used by every agent is read back from the runtime's records after the task (not assumed from what was requested) and written to the cost report.
- A mismatch between requested and actual tier is a validator finding. For the security auditor it fails Gate 8.
- If the runtime cannot set or report a tier for some role, the cost report says so explicitly; nothing is claimed that was not observed.
