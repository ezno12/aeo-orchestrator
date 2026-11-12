# Failure recovery: diagnose first, then act

Never change the model before the failure is classified. Write the class and the diagnosis to the audit log first.

| Failure class | Detected by | Action | Tier change |
|---|---|---|---|
| `scope` (contract violation) | Validator | Discard the worktree; retry once with a corrected contract | No |
| `context` (missing context, ambiguous criteria) | Agent report | Supply pointers, or ask the user | No |
| `environment` (missing tool, permission denied, network, flaky infra) | Error text | Fix with the user's approval, or stop | No |
| `budget` (turn limit hit while progressing) | Partial output | Split the task | No |
| `test` (failure with unknown cause) | Validator | Debugger at its normal tier | No |
| `reasoning` (same wrong approach twice; hypotheses falsified; validator finds a logic error) | Written diagnosis | Escalate **one** tier, citing the diagnosis | Yes |
| `exhausted` (Premium failed, or 3 attempts used) | Attempt counter | Stop and report to the user | — |

Rules:

- One retry per class, one escalation per task, then the user.
- Partial work and worktrees are kept for inspection; nothing restarts silently.
- Loop guard: no progress in 2 rounds, or a waiting chain longer than the ticket frontier, means stop and report.
- A model change is recorded with: task id, from tier, to tier, failure class, diagnosis.
