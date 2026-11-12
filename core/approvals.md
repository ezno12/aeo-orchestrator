# Approvals

Plan approval never authorises git operations, installs or global changes. Each class is approved separately, and every approval is written to the audit log.

| # | Class | Granted by | Runtime enforcement | Executor |
|---|---|---|---|---|
| 1 | File modifications | Gate 2 plan approval, covering only the per-ticket file scopes | Deny on secrets and global config paths; scope breaches detected by the validator (detected, not prevented) | Agents |
| 2 | Dependency installation | Each new package, by name | `ask` on package-manager installs and `npx` | Orchestrator after the prompt |
| 3 | Local commits | Per run and branch, named | `ask` on every `git commit` (including commits suggested by any method) | Orchestrator or implementer after the prompt |
| 4 | Remote pushes | Per push | **Deny**. The user runs the printed command | User |
| 5 | Merges | Local integration merges: per run, named. Default branch or PR merge: separately | `ask` on merge and rebase; deny on PR-merge commands | Local: orchestrator. Default branch: user |
| 6 | Production deployment | Per deploy | **Deny** on production deploy commands and deploy tools | User |
| 7 | Global settings | Per change | Deny on edits under the user's global agent config; `ask` on plugin and config commands | Orchestrator after the prompt |

Always denied: `git reset --hard`, `git clean -f…`, `git branch -D`, `git checkout .`, `git restore .`, any forced push.

## Wording

- An approval names its class and scope, for example: "approve commits on `feat/login` for run 12".
- "Looks good", "fine", "sure" and other hedged replies do not grant classes 2–7. Ask again with the exact class and scope.
- Silence, a question, or completion of research is never approval.

## Install requests

Class 2 and class 7 requests use the card in `install-protocol.md`.
