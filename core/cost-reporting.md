# Cost reporting

Recorded per task (each agent run) and per workflow (each run id), from the runtime's own records, not from estimates where records exist.

## Per task

| Field | Source |
|---|---|
| task id, agent type, role | delegation record |
| tier requested, model requested | delegation record |
| model actually used | runtime record of the agent's messages |
| input, output, cache-read, cache-write tokens | runtime usage records |
| cost | runtime-reported cost when available; otherwise computed from the price table, labelled `computed (list price)` |
| escalation | from / to / reason, if any |

## Per workflow

Totals by phase, by tier and by model; the main-session cost; the share spent on Premium with the reason for each Premium task.

## Rules

- Transcript-based figures are a **lower bound**: some auxiliary runtime requests are billed but not written to transcripts (Claude Code 2.1.322: about USD 0.00013 per headless session, ≈1%, observed in validation run G0). When the runtime reports its own total for a session, prefer it and show both.
- Never present an estimate as a measurement. Every figure carries its basis: `reported` (runtime figure) or `computed (list price, <price table date>)`.
- Token budgets and cost caps are **advisory** in interactive sessions: they are compared and reported, not enforced. Say so in the report.
- A requested-vs-actual model mismatch is listed at the top of the report.
