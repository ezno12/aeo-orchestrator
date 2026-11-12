# Gates

A gate passes only with stored evidence under `.aeo/runs/<id>/evidence/` (command, exit code, output excerpt, or an approval record). "Signed by" is who must record the pass.

| Gate | Phase | Passes when | Evidence | Signed by |
|---|---|---|---|---|
| 1 | discover | Scope approved | Approval record naming the scope | User |
| 2 | design | Plan and per-ticket file scopes approved | Approval record; spec and ticket paths | User |
| 2a | design (UI only) | Design direction approved | Design contract path; approval record | User |
| 3 | develop, per ticket | Failing test existed first, then passes | Test logs or commit order | Validator |
| 4 | develop, per ticket | Acceptance criteria each map to evidence; full suite, typecheck, lint exit 0 | Re-run command outputs | Validator |
| 5 | develop, per ticket | Per-slice review (Standards and Spec) has no unresolved hard violation | Review report | Orchestrator |
| 6 | develop, per ticket | Scope respected; minimal-change checks pass; required approvals recorded | Validator report | Validator |
| 7 | quality | Release review complete (fan-out or skip-rule path); UI review if UI work | Persona and UI reports | Orchestrator |
| 8 | quality | No open critical or high security finding; security-auditor ran on the Premium tier | Security report; model record from the cost report | Validator |
| 9 | deliver | Docs, changelog, ADRs, debt ledger, PR body, rollback plan written | File paths | Orchestrator |
| 10 | deliver | Final validator run; go / no-go recorded | Validator report; decision record | Validator, then user |

A failed gate stops the workflow at that gate. The orchestrator explains the failure and proposes a fix; it never weakens a check to pass.

Push, merge and deploy are not gates: they are user actions with their own approvals (`approvals.md`).
