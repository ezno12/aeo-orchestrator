# AEO: AI Engineering Orchestrator

AEO is a Claude Code plugin that takes a piece of software work from idea to pull request through five commands, one phase each:

```
/aeo:discover  →  /aeo:design  →  /aeo:develop  →  /aeo:quality  →  /aeo:deliver
   scope           spec, plan       code, tests       release review    docs, PR, go/no-go
```

It writes code test-first, has every change reviewed and validated by separate agents, records every approval and verdict in a tamper-evident ledger, and stops at gates where **you** decide. It never pushes, merges into your default branch or deploys: it prints those commands for you to run.

- **One method per job**: AEO ships its own methods (test-driven development, specification, planning, debugging, review), adapted from Matt Pocock's and Addy Osmani's MIT-licensed skills; competing workflow plugins are switched off in AEO projects.
- **Frontend aware**: UI UX Pro Max design data, a design-direction gate and a browser-based UI reviewer for user-interface work.
- **Cost-aware models**: Haiku for lookups, Sonnet for engineering, Opus for design and security. The actual model and cost of every step are read back and reported.

## Contents

1. [Requirements](#requirements)
2. [Install in a project](#install-in-a-project)
3. [Quick start: your first feature](#quick-start-your-first-feature)
4. [The commands](#the-commands)
5. [Options: `--guided` and `--autonomous`](#options---guided-and---autonomous)
6. [Approving: what to type](#approving-what-to-type)
7. [The gates](#the-gates)
8. [Examples by kind of work](#examples-by-kind-of-work)
9. [What AEO writes in your project](#what-aeo-writes-in-your-project)
10. [Models and cost](#models-and-cost)
11. [Checking the gate ledger yourself](#checking-the-gate-ledger-yourself)
12. [Troubleshooting](#troubleshooting)
13. [Repository layout](#repository-layout)
14. [Sources and licence](#sources-and-licence)

## Requirements

- **Claude Code** (CLI or the VS Code extension). Validated on **2.1.322**; after an update, see "After a Claude Code update" in `runtime/claude-code/ledger.md`.
- **Node.js 16+** (AEO's hooks and scripts).
- **git**, and the project must be a git repository.
- Optional: **Python 3** for UI UX Pro Max's design-data search (UI work only).

## Install in a project

Run these from the root of the project that should use AEO. Everything is installed at **project scope**: your other projects and your global Claude Code settings are not touched.

```bash
claude plugin marketplace add ezno12/aeo-orchestrator --scope project
claude plugin install ui-ux-pro-max@aeo-sources --scope project
claude plugin install aeo@aeo-sources --scope project
```

`ezno12/aeo-orchestrator` is the GitHub repository; this repository is itself the plugin marketplace (`.claude-plugin/marketplace.json`), so no registration anywhere is needed. A full git URL (`https://github.com/ezno12/aeo-orchestrator.git`) or a local folder path works too. A private repository works only for people whose git can already clone it.

Then merge `runtime/claude-code/project-settings.template.json` into the project's `.claude/settings.json` (create the file if it does not exist). The template:

- sets the project's default model to **Sonnet** (your global default is not changed);
- switches off plugins that would compete with AEO in this project only (Ponytail, Superpowers, the Vercel plugin, social-media skills);
- adds the safety rules: `git push`, history-destroying git commands and production deploys are denied; commits, merges and installs ask you first; the gate ledger cannot be edited.

On machines with personal copies of UI UX Pro Max skills, also merge `runtime/claude-code/personal-duplicates.example.json`.

Open the project in VS Code (or start `claude` in it) and **trust the folder** when asked; until you do, the project settings are not applied. Type `/aeo:` in Claude Code: the five commands should appear.

**Local path or git URL?** A local-path install runs AEO straight from that folder, so every edit to it immediately affects every project using it. That is convenient while developing AEO; for real projects, install from the git repository at a reviewed commit.

## Quick start: your first feature

A complete run, in a new Claude Code conversation in your project. Text in `code` is what you type.

1. **Discover**: `/aeo:discover Add a countChars(s) helper to src/text.js`
   AEO classifies the work (here: a new feature), maps the relevant code, asks the few questions that remain open (each with a recommended answer) and shows **Gate 1**: what is in and out of scope.
   You answer the questions (`yes` accepts all its recommendations), then approve the scope: `approve scope as presented`.
2. **Design**: `/aeo:design`
   AEO writes a spec, checks what the change can affect, agrees the test approach with you and splits the work into tickets with file scopes. It stops at **Gate 2**: `I approve Gate 2: the plan, test seams and file scopes as presented`.
3. **Develop**: `/aeo:develop`
   Each ticket is built test-first by an implementer agent in its own git worktree, reviewed twice (standards, and match with the spec) and checked by an independent validator. AEO asks before any commit: `I approve class 3: commits on feature/count-chars for run <run-id>`.
4. **Quality**: `/aeo:quality`
   A release review: code reviewer, security auditor (always on Opus), test engineer, plus performance and UI reviewers when relevant, then a full validation. Findings become new tickets for `/aeo:develop`.
5. **Deliver**: `/aeo:deliver`
   Docs, changelog, the shortcut "debt ledger", a pull-request description with evidence, a rollback plan and a cost report, then a final validation. You give the go: `I approve go for run <run-id>`. AEO then **prints** the push and pull-request commands for you to run.

You can stop at any point (`stop here`) and continue later: every command picks up from `.aeo/state.json`.

## The commands

| Command | What it does | Stops at | You type |
|---|---|---|---|
| `/aeo:discover [options] <request>` | Classifies the work, maps the codebase (and design system for UI work), clarifies intent and requirements, sets up the local issue tracker | **Gate 1**: scope | `approve scope as presented` |
| `/aeo:design [options]` | Research, spec, architecture and decision records, change-impact analysis, tickets with file scopes; for UI work, design directions | **Gate 2**: plan · **Gate 2a**: design direction (UI only) | `I approve Gate 2: …` · `I approve the design direction B` |
| `/aeo:develop [options]` | Builds each ticket test-first in its own worktree; two reviews per slice; validator per ticket | Commit and merge approvals; any failed gate | `I approve class 3: commits on <branch> for run <id>` |
| `/aeo:quality [options]` | One release review by specialist agents; full validation | **Gates 7–8**; on failure, it stops and explains | Nothing, unless it reports a problem |
| `/aeo:deliver [options]` | Docs, debt ledger, PR text, rollback plan, cost report, final validation (Gate 9) | **Gate 10**: your go / no-go | `I approve go for run <id>` or `no-go` |

Only `/aeo:discover` takes a request. The others continue the current run. You run every command yourself: AEO's commands are never started on their own.

## Options: `--guided` and `--autonomous`

Every command accepts one mode option. **`--guided` is the default**, so these two are the same:

```
/aeo:discover Add rate limiting to the login endpoint
/aeo:discover --guided Add rate limiting to the login endpoint
```

| | `--guided` (default) | `--autonomous` |
|---|---|---|
| Questions | Asks you as it goes (requirements interview, test seams, ticket breakdown) | Asks nothing it can decide from the spec; collects its choices for you to approve at the next gate |
| When to use | New or unclear work, anything touching design | Clear, well-specified work you want done with less typing |
| Requirements interview | Live | Not available: the request must already be clear; it stops at the first real ambiguity |
| Issue tracker | Any tracker you choose | Local markdown only (`.scratch/`) |
| **Approvals** | **All of them** | **All of them**: autonomous mode removes typing, never approvals |

Examples:

```
/aeo:discover --autonomous Fix: countWords('  a  b ') returns 5, expected 2
/aeo:design --autonomous
/aeo:develop --autonomous
```

The mode applies to that command only; pass it again on the next command if you want it again.

## Approving: what to type

AEO only accepts an approval that **says "approve" and names what is approved**. This is deliberate: every approval is recorded in the gate ledger and checked later.

| Accepted | Not accepted (it will ask again) |
|---|---|
| `approve scope as presented` | `looks good`, `ok`, `fine`, `sure` |
| `I approve Gate 2: the plan and file scopes as presented` | `yes` (answers a question, never approves a gate) |
| `I approve class 3: commits on feature/x for run 20261112-x` | `go`, `go ahead`, `continue`, `proceed` |
| `I approve go for run 20261112-x` | Silence, a question, or a message from an agent |

What each approval covers is separate; approving one never approves another:

| Class | What | How it is enforced |
|---|---|---|
| 1 | File changes within each ticket's scope | Granted by your Gate 2 approval; the validator detects changes outside scope |
| 2 | Installing a dependency, named | Claude Code asks you |
| 3 | Local commits, per run and branch | Claude Code asks you on every commit |
| 4 | Pushes | **Always refused**; you run the printed command |
| 5 | Merges | Local integration merges ask you; merging into the default branch or a PR is yours |
| 6 | Production deploys | **Always refused**; yours |
| 7 | Global settings | Edits refused; plugin and config commands ask you |

Always refused, whatever you approve: `git reset --hard`, `git clean -f`, `git branch -D`, `git checkout .`, `git restore .`, force pushes.

## The gates

| Gate | Where | Passes when |
|---|---|---|
| 1 | discover | You approve the scope |
| 2 | design | You approve the plan, test seams and file scopes |
| 2a | design (UI only) | You approve a design direction |
| 3, 4, 6 | develop, per ticket | An independent validator passes the ticket (scope, criteria, tests re-run, test-first evidence, complete report) |
| 5 | develop, per ticket | Two reviews (standards, spec) of the final code find no hard violation |
| 7 | quality | Every required reviewer reported, and the validator passed |
| 8 | quality | No open critical or high security finding, and the security auditor really ran on Opus |
| 9 | deliver | The final validation (all 15 checks) passes, including the refreshed debt ledger |
| 10 | deliver | You approve go |

A gate counts only if the gate ledger supports it; each command checks this when it starts and redoes any gate that no longer holds (for example, when an agent changed code after its validation).

## Examples by kind of work

AEO adapts each phase to the kind of work it detects in discover:

| Kind | Example request | What changes |
|---|---|---|
| New feature | `/aeo:discover Add CSV export to the reports page` | Spec, impact analysis, test-first tickets, release review |
| Bug fix | `/aeo:discover Fix: login fails when the email has uppercase letters` | Reproduced first by the debugger agent; root cause confirmed; one ticket with a regression test; no spec |
| Improvement | `/aeo:discover Speed up the search endpoint` | Heavy impact analysis; characterisation tests before changes |
| Refactoring | `/aeo:discover Split the 900-line orders.js into modules` | No behaviour change; tests green before and after each slice |
| New project | `/aeo:discover --guided Build a CLI that converts markdown notes to a static site` | Intent interview, stack choice by cited research, walking-skeleton first ticket |
| UI work | `/aeo:discover Redesign the signup page` | Adds design-system detection, design directions and Gate 2a, UI tickets, browser review with screenshots |

Small releases (2 files or fewer, under 50 changed lines, no auth, payments, data access or configuration) get a lighter release review automatically.

## What AEO writes in your project

| Path | What | Commit it? |
|---|---|---|
| `.aeo/state.json` | Where the current run is, and which gates passed | Yes |
| `.aeo/gates.jsonl` | Gate ledger: every approval you typed and every agent verdict, hash-chained. Written only by AEO's hook; read-only | Yes |
| `.aeo/debt.md` | Every `shortcut:` comment in the code, with when to upgrade it | Yes |
| `.aeo/codebase-map.md`, `.aeo/memory.md` | Project map and memory | Yes |
| `.aeo/runs/<run>/` | Per run: audit log, evidence (test output, screenshots), PR text, cost report | No (ignored) |
| `.scratch/<feature>/` | Spec and tickets (local tracker) | Your choice |
| `CLAUDE.md` or `AGENTS.md`, `docs/agents/` | Tracker and domain-docs setup, written once with your approval | Yes |

## Models and cost

| Work | Model |
|---|---|
| `/aeo:discover`, `/aeo:develop`, `/aeo:quality`, `/aeo:deliver`, implementer, debugger, validator, code reviewer | Sonnet |
| `/aeo:design`, security auditor | Opus (the security auditor is never downgraded; Gate 8 checks the model that actually ran) |
| Code search, researcher, test engineer | Haiku |

Things to know:

- A command chooses the model for **its own turn**. Your replies in between, and turns that start when a background agent reports back, run on the project default: Sonnet with the template.
- The model label in the VS Code panel shows the default, not the model a command chose: during `/aeo:design` it still shows Sonnet while the turn runs on Opus.
- Each phase ends with a cost report (`.aeo/runs/<run>/cost.md`) listing the model and cost of every step. In validation runs, a one-ticket feature cost roughly US$3–8 end to end, most of it in develop and the release review.

## Checking the gate ledger yourself

```bash
node <path-to-aeo>/runtime/claude-code/scripts/verify-gates.js --project .
```

Each line reads `LEDGER <check>: PASS | FAIL | INCONCLUSIVE`, ending with `LEDGER VERDICT`. It checks that no record was removed or changed, that every record matches Claude Code's own session logs, that no agent kept working after a validation, that agent reports are complete, and that every gate in `state.json` is backed by a record. `--report <N>` prints agent report number N in full.

The ledger **detects** tampering; it does not prevent it. What it can and cannot detect: `runtime/claude-code/ledger.md`.

## Troubleshooting

| Problem | Fix |
|---|---|
| No `/aeo:` commands | Check you are in the project folder, the plugins are installed at project scope, and the folder is trusted |
| "Gate N isn't approved yet" after you replied | Use explicit wording: `approve …` naming the gate or class (see above) |
| `LEDGER VERDICT: FAIL` | Read the FAIL lines; commands redo gates that no longer hold. Never edit `.aeo/gates.jsonl` |
| A gate reported as **stale** | An agent changed code after its validation; run the phase again (for tickets: `/aeo:develop`) |
| A permission prompt for a commit or install | Expected: AEO asks; approve only if you mean it |
| The panel shows Sonnet during `/aeo:design` | Expected (see Models); the cost report shows the model that actually ran |
| Quality stops with gates 7–8 failed | Fix what it reports (or run `/aeo:develop` for new tickets), then run `/aeo:quality` again; it redoes the whole review |

## Repository layout

| Path | Contents |
|---|---|
| `skills/` | The five `/aeo:*` commands |
| `agents/` | researcher, implementer, debugger, workflow-validator, ui-reviewer; release reviewers code-reviewer, security-auditor, test-engineer, web-performance-auditor |
| `core/` | The workflow definition: classification, approvals, gates, validation checks, procedures |
| `methods/` | AEO's methods by purpose (`discovery/`, `specification/`, `planning/`, `architecture/`, `testing/`, `debugging/`, `code-review/`, `development/`, `frontend/`, `security/`, `delivery/`, `checklists/`), with provenance (`methods/MANIFEST.json`) and upstream licences |
| `hooks/` | Audit log hook and gate ledger hook |
| `runtime/claude-code/` | Project settings template, model routing, prices, ledger documentation, `verify-gates.js` and `cost-report.js` |
| `evals/` | Validation harness, deterministic ledger tests (`node evals/lib/ledger-tests.js`) and results (`evals/RESULTS.md`) |
| `SOURCES.json`, `ATTRIBUTION.md` | Upstream commits, licences, credits |

## Sources and licence

Matt Pocock's and Addy Osmani's skill plugins are **not** installed: AEO carries its own adapted copies of the methods it uses, each traced to its upstream commit and file hash. UI UX Pro Max is pinned to a reviewed commit in `.claude-plugin/marketplace.json`. Sources change only through a reviewed commit followed by the validation suite (`evals/README.md`).

MIT. Vendored methods keep their upstream MIT licences (`methods/licenses/`, byte-identical copies); all notices in `ATTRIBUTION.md`. Validation status and known limitations: `evals/RESULTS.md`.
