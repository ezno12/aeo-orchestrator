# Validation results: Stage 2, 2026-11-11

> **Historical paths.** Rounds 1–3 below were recorded before the 2026-11-11 methods rename and name the old locations (`methods/matt/…`, `methods/addy/…`, `METHOD.md`). They are kept as written; `methods/MIGRATION-MAP.json` maps every old path to its current AEO path.

Runtime: Claude Code 2.1.322 (VS Code bundled binary), Windows 11, Node 16.20.2, Python 3.13.14.
Method: headless `claude -p --output-format stream-json --verbose` in throwaway fixtures; verdicts from the stream, the session and subagent transcripts, and the files on disk. Raw evidence was kept in the validating session's scratchpad (not committed).
Validation spend (Claude Code reported): round 1 **USD 1.34** (Haiku 0.18 · Sonnet 0.71 · Opus 0.45); round 2 **USD 5.21** (Haiku 0.09 · Sonnet 1.92 · Opus 3.20, mostly the five `/aeo:design` runs); round 3 **USD 3.78** (Haiku 0.09 · Sonnet 2.11 · Opus 1.59); round 4 **USD 8.56** (Haiku 0.09 · Sonnet 5.48 · Opus 2.98).

## Passed

| # | Test | Evidence |
|---|---|---|
| G0 / 45 | Ponytail disabled per project: no plugin, no skills, no session context (3 runs + resume) | control 6 skills + ruleset each run; disabled 0 |
| G0 / 46 | No Ponytail ruleset in subagents | control subagent ruleset present; disabled 0/3 |
| G0 ledger | No Ponytail ledger row or mode file for the disabled project | control produced both; disabled none |
| 1 | Five `/aeo:*` commands registered | init `slash_commands` |
| 2 | Commands are user-only (not in the model's skill listing); upstream user-invoked skills (e.g. `to-spec`) also hidden | `skill_listing` names |
| 9 | Nesting depth 1: a subagent has no Agent tool | general-purpose subagent report |
| 10 / R1–R4 | Model per agent: frontmatter (researcher haiku, validator sonnet), per-call override (researcher→sonnet), explicit persona models (security-auditor opus, test-engineer haiku), env default for unassigned subagents (general-purpose → sonnet), built-in Explore → haiku | actual model read from each subagent's messages |
| R5 | A command skill's `model:` switches the main loop for that command (session `--model haiku`, `/aeo:discover` ran entirely on Sonnet) | message models. Verified headless only |
| R6 / 25 | Cost script matches Claude Code's reported cost: Sonnet 0.156415 vs 0.1564145, Opus 0.184033 vs 0.184033; totals are a lower bound (≈ USD 0.00013/session missing: auxiliary requests not in transcripts) | `runtime/claude-code/prices.json` basis |
| 15 | Approvals: 14 dangerous probes blocked under a broad `Bash` allow (commit, `-C` commit, push, `-C` push, reset --hard, npm/pnpm install **despite the user's global pnpm allow**, npx, vercel --prod, clean variants, branch -D, checkout ., merge); `.env.local` write denied; reads ran | after fix, see below |
| 17, 18, 8–11 | Validator caught scope breach, false "tests pass" claim (re-ran: exit 1), unapproved dependency, unlisted shortcut, never-cut violation, scope creep | per-check report |
| 19 | Validator read-only (refused a write; `git status` identical) | two runs |
| 21 | Security auditor on **Opus (actual)** found seeded SQL injection and live secret, both critical, with file:line | report + message models |
| 26 | Audit hook: every Bash attempt (PreToolUse) and outcome (ok / failed), subagent start/stop with requested model | `.aeo/runs/<run>/audit.jsonl` |
| 27a | Installed commits equal `SOURCES.json` (A 4ae2317, B 301b02b, D 6ae86f6) | `installed_plugins.json` |
| 28 / 56 | User `settings.json` byte-identical; Ponytail install, state and ledger, and personal skills identical to the pre-Stage-2 fingerprint | fingerprint diff |
| 33 | UI UX Pro Max search works on Windows from the pinned install, fully offline (sockets blocked; output identical) | `--design-system` and domain/stack searches |
| 34 | Personal UUPM copies hidden in AEO projects; plugin copies still visible | `skill_listing` names |
| 40, 41 | UI reviewer (chrome-devtools from a subagent) found the seeded focus-outline removal (critical), 320/375 overflow (high), helper-text contrast 2.1:1 (high), plus missing form states; 6 screenshots; changed nothing | report + screenshots |
| 47–50, 53 | Implementer (Sonnet, own worktree): red → green per criterion, reused the existing helper, ignored the npm-package hint, kept the TypeError validation, stayed in scope | tool sequence + `node test/slug.test.js` exit 0 |
| 52 | Ponytail still active in projects that do not disable it | G0 control |
| 54 | No `superpowers` / Vercel session-start context in AEO projects (8 sessions, 8 subagents) | transcript scan |

## Round 2 (F1, remaining headless validation)

| # | Test | Result |
|---|---|---|
| F1 | Marketplace-entry allowlists hide skills | **FAIL, both forms.** `strict: true`: lists are added to the upstream `plugin.json` components (all 6 + 5 excluded skills still model-visible). `strict: false`: Claude Code drops both plugins entirely (0 skills loaded; "conflicting manifests"). Reverted to the validated pre-F1 manifest and pins |
| 3 | Step 0 | PASS: feature → new-feature, refactor → refactoring (characterisation test first), "bug" → improvement with evidence that the expected output contradicts the approved ticket (asked for a spec decision) |
| 4, 5 | Guided stops at user-invoked upstream skills; no Skill-tool call to them | PASS (discover asked the user to type `setup-matt-pocock-skills`; design asked the user to type `/mattpocock-skills:to-spec`) after fixing defect D-2 below |
| 6 | Autonomous labels | PASS: spec headed "Produced by AEO procedure P1 … Not the upstream to-spec skill", ticket headed P2; stopped at Gate 2 |
| 11 | Diagnosis before escalation (policy) | PASS: environment failure → no model change, ask user; reasoning failure → Sonnet → Opus once, diagnosis logged first |
| 13 | Two implementers in parallel | PASS: separate worktrees, each only its files, both test suites exit 0 |
| 14 | Concurrency limit | PASS: 5 parallel spawns → 4 ran, 5th refused ("Concurrent subagent limit reached… 4") |
| 22 | Resume | PASS: resumed at ticket 02, did not redo 01, asked for class 3/5 approvals |
| 30 | Bare `/design` | PASS (informational): resolves to the user's personal `design`, which the project override disables; the UUPM router is reachable only as `/ui-ux-pro-max:design` |
| 31, 55 | Preflight install card | PASS after fixing defect D-1 below |
| 32 | Unavailable MCP | PASS: chrome-devtools removed → fell back to Playwright, which refused `file:` URLs → stopped `blocked / environment` instead of a source-only "review" |
| 37, 38, 39 | Existing design system wins; no UI before approval; no MASTER.md | PASS: used `tailwind.config.js` tokens, no new palette, no `design-system/` written, stopped before any UI work |
| 51 | Debt ledger | PASS: `.aeo/debt.md` row and a "Deferred (shortcuts)" PR section for the seeded shortcut |
| R5 (Opus) | `/aeo:design` switches the main loop to Opus | PASS (sessions started on Sonnet; all design messages on Opus) |

Defects found and fixed in round 2:
- **D-1** Install card said "not pinned / licence not checked" and proposed removing the bare `ui-ux-pro-max: off` override (which would re-enable the user's personal duplicate). Fixed in `core/install-protocol.md`; re-test passed.
- **D-2** The design orchestrator treated user-invoked upstream skills (`to-spec`, `to-tickets`), which are hidden from the model by design, as *missing* and offered the agent-skills duplicates instead (a consequence of test 7). Fixed with an explicit rule in `core/skill-precedence.md` and the discover/design/develop commands; re-test passed.
- **D-3** `/aeo:design` (Opus) read code and docs itself and ran out of turns. Fixed with a context budget: codebase reading goes to `Explore` on Haiku. Re-tests show Haiku doing the reading for about USD 0.005–0.012 per run.
- **D-4** Orchestrator writes to `.aeo/` would prompt every time. The template now allows `Edit`/`Write` on `.aeo/**` only.
- Harness: Git Bash rewrote the prompt `/design` into a Windows path; `lib/run.sh` now sets `MSYS_NO_PATHCONV=1`.

## Round 6 (ledger hardening: truncation detection, continuation detection, check 5, INCONCLUSIVE quality path)

Spend: **USD 8.04** (Sonnet 6.73 · Opus 1.24 · Haiku 0.07), of which about 1.27 was my harness mistake (two continuation attempts ran with `SendMessage` disallowed). Evidence: session scratchpad `stage6/t/`. Live work item: run `20261112-is-blank` (discover → deliver) in the acceptance fixture. Design and limits: `runtime/claude-code/ledger.md`.

**Passed**

| # | Check | Result |
|---|---|---|
| L1 | Session-log references (hook note "record #N [h:<12 hex>]") | Synthetic: final record removed, last three removed, hash modified, record rewritten with the chain rebuilt, referenced record removed with the chain rebuilt: all FAIL as expected; missing reference, short hash, reference without a number: INCONCLUSIVE. Real ledger copy (185 records): unmodified PASS; final record removed, last 5 removed, hash modified, #170 removed with chain rebuilt: all FAIL. Removing the final record passes the chain and anchors alone; only the new check catches it |
| L2 | Continuation detection | Synthetic: edits after validation make ticket gates stale (FAIL); fresh validation and reviews clear them; unrecognised log (no agentId, missing agent log, entry without timestamp): INCONCLUSIVE. Live: a `SendMessage` continuation edited and ran tests 5 s after its validator finished; the verifier flagged #156 and failed gates 3–6 as stale; `/aeo:develop` withdrew them, re-reviewed and re-validated, and they passed again. Live incidental: a debugger run after the release review made gates 7–9 stale |
| L3 | Check 5 (report completeness) | The 300-character `response_head` is only the anchor excerpt. The full report is in the session log (`toolUseResult`); 68/68 earlier reports matched the ledger's sha256 and length exactly. Synthetic: complete short, complete long (23,531 chars, returned in full by `--report`), truncated, ended early, missing, empty, changed after review: PASS/PASS/FAIL/FAIL/FAIL/FAIL/FAIL. Live: implementer #146 (4,010 chars) and debugger #197 (3,860 chars) complete under the new report instruction |
| L4 | Quality INCONCLUSIVE path (live) | Validator denied the test run (fault injection): verdict INCONCLUSIVE (#177); gates 7–8 written as failed with reasons; verifier PASS with no gate claimed passed; the user was told what blocked and what would clear it. A new `/aeo:quality` redid the whole review (#180–183, PASS) and recorded gates 7–8 |
| L5 | Quality → deliver | Gate 9 ran all 15 checks, PASS (#185); deliver read its three methods before writing; every gate 1–9 verified |
| A | Nine agents and routing | 9 loaded; actual models: security-auditor Opus; test-engineer, researcher Haiku; code-reviewer, validator, web-performance-auditor, ui-reviewer, implementer, debugger Sonnet |
| S | Static and regression | `ledger-tests.js` 28/28; `selfcontained.js` PASS (105 files, 50 manifest entries re-hashed, 46 migrations, 9 agents); `plugin validate --strict` PASS; pre-rename snapshot 105/105; debugger method reads PASS; tamper probe: 7 attempts refused; AEO repo unchanged by every agent run; global settings and personal skills unchanged |

**Defects found and fixed during the round:** check 5 as written was failing real reports (ticket 01 of the earlier run, report #30, lacks 8 labels): implementer and debugger now end with the block verbatim; report checked was the newest worker instead of the one the validation judged; ticket ids repeat across runs (scoped to the current run); task notifications delivered mid-turn (`queued_command`) did not anchor; a validator result without a `TASK` line satisfied any ticket's gates (pre-existing hole; now FAIL); re-validation deadlocked while `state.json` still claimed the stale gates (develop now withdraws them first); a new `/aeo:quality` did not redo a failed review; the validator was not given the worker's ledger number.

**Inconclusive / open:** check 4 (test-first) cannot be shown for a single-commit release without a red-run log (validator INCONCLUSIVE once, PASS once on the report's red run); the verifier pairs a validation with the latest worker report before it, because the ledger does not record which report the validator was given; release-gate staleness also fires for unrelated work in another worktree of the same run (conservative false positive); the implementer did not read its TDD method file in one run (same class as M12, not in this round's scope).

**Untested:** a Claude Code version other than 2.1.322; the VS Code panel (kit ready, A1–A9).

### VS Code panel acceptance (round 6, run by the user, 2026-11-12)

A1–A9 all PASS against the session log, ledger (#199–#212) and git: Sonnet for the discover command turn; "looks good" refused twice (#202, #204); Gate 1 cites #205; design asked for the seams, research on Haiku (A4 model switch not distinguishable: the panel default was also Opus); "stop here" left no spec; commit prompt denied by the user, no commit; push and the router refused by deny rules without a prompt; the user's own `/ui-ux-pro-max:design` loaded.

Defects found and fixed after the test (user-approved):
- **D1 (security)**: panel sessions deliver subagent hand-backs as `<agent-message …>` messages; the hook recorded them as `user_prompt` (#200, #207) and, because Claude Code's own preamble contains "approval claims", the verifier accepted such a record as a gate approval (reproduced: citing #207 for Gate 1 gave PASS). Fixed in the hook and, independently, in the verifier (which also catches the two records already stored); now FAIL.
- **D2**: with a file open, the panel prefixes `<ide_opened_file>` to the hook's copy of a message but not to the session log's copy of a slash command, so #206 could not be anchored and the whole ledger verified FAIL. Fixed: IDE notes are ignored when comparing. The panel ledger now verifies PASS (212/212).
- **D3 (cost)**: after the command's first turn, every turn ran on the panel default (Opus). Documented: set the panel default to Sonnet (README, `runtime/claude-code/routing.md`).
- Tests added to `lib/ledger-tests.js` (36/36): hand-back recorded as injected and refused as approval, also after an IDE note and as an older `user_prompt` record; slash command with an IDE note anchors; an approval with an IDE note still counts; a hedged reply with an IDE note is still refused.

Re-run in the panel after the fixes: A1–A5 PASS (continuation of the same conversation); a background agent's hand-back recorded as `injected` (#220), ledger PASS 220/220. The panel attached no open-file note in the re-run, so D2 is proven on the original record #206 only.

Follow-up (user-approved): the template sets `"model": "sonnet"` (headless check: new session and resumed follow-up turn both on Sonnet; panel check pending); `verify-gates.js` prints `LEDGER head` and `/aeo:deliver` pins it in the PR body after Gate 9; opt-in strict mode for untested Claude Code versions (`AEO_LEDGER_STRICT_VERSION=1` or `--strict-version`); re-test procedure in `runtime/claude-code/ledger.md`. `ledger-tests.js` 38/38.

## Round 5 (approved fixes: method reading, W-1 ordering, router deny rule; ledger review)

Spend: **USD 7.69** (Haiku 0.22 · Sonnet 6.45 · Opus 1.01; quality → deliver runs 6.86, my harness mistakes 0.53). Evidence: session scratchpad `stage5/t/`. New check: `lib/reads.js` proves from a run's stream which files an agent actually opened (a denied or failed Read does not count) and, with `--before Write`, that it opened them before its first write.

| # | Check | Result |
|---|---|---|
| M12 | Debugger reads and follows its method | **PASS** (was FAIL): all five method and core files read before any write (`reads.js` exit 0, round-4 stream still FAIL); `WORK DONE` reported per method phase; red run captured (`7 !== 2`, exit 1), root cause fixed, 4/4 green re-run independently in its worktree |
| M13 | Deliver reads its methods and runs the final validator itself | **PASS** in three runs: `documentation`, `pull-request-writing`, `release-readiness` read before the first write; the final validator ran before go / no-go every time; PR body uses the method's sections |
| W-1 | Quality → deliver sequence with a debt ledger that needs refreshing | **PASS**: quality's validator runs checks 1–13 and 15 (14 not run) and passes; deliver refreshes `.aeo/debt.md`; Gate 9 runs all 15 checks, 14 against the refreshed ledger (ledger #124). Negative test: a stale open row makes Gate 9 fail check 14 (#126) |
| W-1a | Regression found and fixed during the W-1 test | My first stage rule limited Gate 9 to checks 12–15 and dropped check 6 (approvals) (#108). Restored: a "Which checks run when" table in `core/validation.md` (ticket 1–11+15; quality all but 14; Gate 9 all 15) |
| W-2 | Check 13 "each persona exactly once" after a legitimate quality rerun | Defect (FAIL #116 after a second review of the same run). Fixed: counted over the latest release review only |
| W-3 | Quality reported a pass without writing gates 7–8; spawned the validator in the same batch as the reviewers (spurious FAIL #121); recorded gates 7–8 after an INCONCLUSIVE validator | Fixed in `skills/quality`: write gates to `state.json` before reporting; validator only after all reports; gates 7–8 need `VERDICT: PASS`. Positive path re-tested (#140, no spurious FAIL, gates recorded); the INCONCLUSIVE → gates-failed path is **untested live** |
| W-4 | Check 5 (response block) at release scope | **Open (pre-existing)**: the release validator has no ticket response blocks, only ledger heads, so it varies between PASS (#122) and INCONCLUSIVE (#132, #135); round 4 varied too (#25, #33) |
| U | Router deny rule `Skill(ui-ux-pro-max:design)` in the template | **PASS**: model call refused ("blocked by permission rules"); `ui-ux-pro-max` loads and its data answers (`glassmorphism` 1 result, `saas` products 2); `ui-styling` loads; `/ui-ux-pro-max:design` typed by the user loads with no denial; fixture deny list equals the template's |
| L | Ledger hook | Fixed: the injected-message test had lost a backslash (`^s*<`), so a notification preceded by whitespace was recorded as `user_prompt`. Gate approvals were not exposed (the verifier normalises whitespace first). Unit-checked. Tamper probe re-run: Edit, Write, `>>`, `rm`, `mv` refused; disguised node append stopped by the read-only file; chain and 127/127 anchors PASS |
| A | Nine agents and routing | PASS: 9 `aeo:` agents load; actual models security-auditor Opus, test-engineer and researcher Haiku, code-reviewer, validator, debugger, web-performance-auditor, ui-reviewer Sonnet (implementer Sonnet in round 4); no Matt, Addy or social-media skill visible |
| S | Static | `selfcontained.js` PASS (103 files, 63 refs, 50 manifest entries re-hashed, 46 migrations, 9 agents); `plugin validate --strict` PASS; pre-rename snapshot 105/105 intact; AEO repo unchanged by every agent run (hash before and after each) |

Harness mistakes (mine, no AEO impact): the round-5 helper file did not source `al.sh`, so early runs had no allowed tools and their denials were meaningless (debugger runs 1–5, read probes); a wrong cache root for `selfcontained.js` on the first try.

Ledger review (no change made; proposals in the round-5 report): a cut of the last 6 records (56 → 50) passes the current verifier's chain and anchor checks; the hook's "record #N" notes in the transcripts reveal it. Work done after a `SendMessage` continuation is in the subagent transcripts (3 continued agents in the round-4 chain, 20 unrecorded Edit/Write/Bash calls).

## Round 4 (methods rename, gate ledger, UI UX Pro Max router experiment)

Spend: **USD 8.56** (Haiku 0.09 · Sonnet 5.48 · Opus 2.98). Paths below are the current (post-rename) paths.

### 4A. Methods rename (reported on its own)

| # | Check | Result |
|---|---|---|
| M1 | Pre-migration snapshot (105 files, hashed) and full old → new map (`methods/MIGRATION-MAP.json`, 46 entries) | PASS |
| M2 | Content preserved: every changed line in the 46 moved files is a header, path or link change (89 lines, 0 other) | PASS |
| M3 | Provenance: `MANIFEST.json` has 50 entries with repository, commit, upstream path, licence, licence file, upstream SHA-256 (re-verified against the pinned cache) and current AEO SHA-256, plus modifications | PASS |
| M4 | Licence files byte-identical to upstream | PASS (both) |
| M5 | Relative references from new locations (63, including tracker-setup, module-design, prototyping, test-driven-development, security and performance supporting files, with anchors) | PASS after fixing 3 anchored references the migration pattern missed and 2 link labels |
| M6 | Hidden references (all file types, hooks, scripts, JSON, test prompts, fixture) | PASS: old paths only in historical/provenance records (marked) |
| M7 | Scope frozen: agent models/tools/limits, routing, settings template, ledger files unchanged by the rename | PASS |
| M8 | `lib/selfcontained.js` (extended) and `plugin validate --strict` | PASS |
| M9 | No upstream plugin needed: no Matt Pocock / Addy Osmani skill, command or agent visible; 9 `aeo:*` agents | PASS |
| M10 | Routing unchanged (frontmatter only): security-auditor **Opus**, test-engineer Haiku, researcher Haiku, code-reviewer Sonnet, validator Sonnet | PASS |
| M11 | Workflows on the new paths: discover, design (guided spec/tickets, module design), develop (implementer TDD, two-axis review, validator), quality fan-out, deliver, UI reviewer | PASS (methods read at new paths), except the two method-reading failures below |
| M12 | Debugger | **FAIL (method adherence)**: fixed the seeded bug correctly (red test first, root cause), but read none of its method or core files. Not caused by the rename (it read no AEO file at any path) |
| M13 | Deliver | **FAIL (method adherence)**: wrote the PR body and rollback but did not read its method files, and skipped the final validator until asked |

### 4B. Gate ledger (option 3, reported separately)

| # | Check | Result |
|---|---|---|
| L-a | Hook records user prompts and `aeo:*` results; hash chain; read-only file | PASS (56 live records, chain intact, 56/56 anchored in transcripts) |
| L-b | Tamper probes with broad Edit/Write/Bash allowed: Edit, Write, Bash append, `rm`, `mv` on the ledger | PASS: all denied by rules; a disguised `node` append passed the rule layer and was stopped by the read-only file |
| L-c | Orchestrator never treats a request as approval; cites `approval_seq` for gates 1, 2 | PASS |
| L-d | End-to-end chain discover → deliver with verification on every resume | PASS: gates 1–8 verified; validator refused gate 9 because the stand-in commit had no class 3 approval record (correct) |
| L-e | Offline: edited/deleted records and unsupported claims fail | PASS |

Ledger defects found and fixed during testing: **L-1** verifier ignored a `work_item` (singular) schema and would have passed silently → claims are now found anywhere in `state.json`; **L-2** anchor false negatives (transcript inserts a hand-back preamble) → compare the report body; **L-3** develop spawned agents in the background → foreground rule; **L-4 (security)** background task notifications arrive as user messages and could carry an agent-written "approval" → recorded as `injected`, never an approval; **L-5** auto-backgrounded launches marked foreground → detected from `isAsync`, resolved model recorded; **L-6** hook took the first `VERDICT` line (a quoted one) → last line-anchored verdict, verifier prints `LEDGER VERDICT`; **L-7** ticket gates outside a ticket and gate 5 without both review axes on the final code → fail; **L-8** commands trusted gate claims on resume → each command runs the verifier first.

Residual: rules match command text, so a disguised command that also clears the read-only attribute can append (breaks the chain or anchors) or truncate the newest uncited records (not detected). Implementer continuations via `SendMessage` are not recorded.

### 4C. UI UX Pro Max router (experiment only; applied to the template in round 5)

A project deny rule `Skill(ui-ux-pro-max:design)`: model invocation blocked ("Skill execution blocked by permission rules"); `ui-ux-pro-max` (search script, data verified) and `ui-styling` still load; the user can still run `/ui-ux-pro-max:design`; the skill stays listed. Fixture restored; template unchanged.

### 4D. Other checks

| # | Check | Result |
|---|---|---|
| 35 | Router/marketing skills stay quiet on a UI redesign request | PASS (no Skill calls in discover) |
| 36 | Frontend role layering in design | PASS: AEO ui-engineering method, `ui-ux-pro-max` data (4 searches), `frontend-design` directions; router not used; AEO rules beat data suggestions (third-party fonts dropped). USD 1.94 on Opus |
| S | `social-media-skills@synced` disabled per project | PASS (0 of its skills visible; global install untouched) |
| W-1 | Quality release check 14 (debt ledger current) runs before deliver refreshes the ledger | Workflow-order defect (pre-existing); **fixed in round 5** |


## Round 3 (vendored methods: Matt Pocock and Addy Osmani plugins no longer installed)

Architecture change: the curated subset of Repos A and B is copied into `methods/` and `agents/` (audit in `methods/README.md`); the fixture keeps the two upstream plugins installed from round 2 but disabled at project scope (no install or uninstall was run). Spend: **USD 3.78** (Haiku 0.09 · Sonnet 2.11 · Opus 1.59), including USD 0.85 of reruns caused by test-harness mistakes or fixture state (noted below).

| # | Test | Result |
|---|---|---|
| S1 | Static self-containment (`lib/selfcontained.js`) | PASS: no route to upstream plugins in AEO files; 48 vendored files present and byte-identical to their pinned upstream hashes before adaptation; all `methods/` paths and links resolve; no `SKILL.md` under `methods/`; 9 agents listed |
| S2 | `claude plugin validate . --strict` | PASS |
| I1 | Inventory | PASS: no `mattpocock-skills:*` or `agent-skills:*` skill, command or agent is model-visible; 9 `aeo:*` agents; 5 `/aeo:*` commands; no load errors after removing the two marketplace entries |
| R7 | Vendored reviewers route by frontmatter (no `model` passed) | PASS: security-auditor **Opus**, test-engineer Haiku, code-reviewer Sonnet, web-performance-auditor Sonnet (actual) |
| R8 | Reviewers are read-only by tools | PASS: test-engineer has no Write tool; no file created. (Bash stays available, read-only by instruction, as for the validator) |
| 21 | Security audit by `aeo:security-auditor` (no `model` passed) | PASS: actual **Opus**; seeded SQL injection and live secret both critical with `file:line` (USD 0.077 Opus) |
| 47–50 | Implementer with `methods/matt/tdd` | PASS: read `methods/matt/tdd/METHOD.md` first; red (module missing) then red → green per criterion; `TypeError` kept; no npm package; scope kept; `node test/slug.test.js` → `ok`. Note: did not reuse `normalizeWhitespace` (round 1 did): judgement, not a method defect |
| 4, 5, 6 | Design: spec and tickets without upstream commands | PASS: guided confirms seams with the user before writing (vendored to-spec), no "type the command" step; autonomous writes the spec with the method's 7 headings and the ticket in the method's template plus `Files in scope` / `Verify` / `UI`, provenance lines "AEO procedure P1/P2 (method …, adapted from Matt Pocock's skills)" |
| R5 | `/aeo:design` on Opus, reading on Haiku | PASS (both runs; Explore actual Haiku) |
| 3 | Discover, new feature | PASS after two fixes (below): Explore (Haiku) in the foreground; read `interview-me`, `grilling`, `domain-modeling` method files before asking; one numbered grilling round with recommended answers; tracker bootstrap (P5) queued as a question; stops before Gate 1 |
| 31 | Preflight card | PASS: UUPM pinned commit and licence from `SOURCES.json`, project scope, rollback, alternatives. Minor wording error (said the plugin comes from the local directory) fixed in `core/install-protocol.md` |
| 20 (partial), Q1 | Full `/aeo:quality --autonomous` fan-out (first end-to-end run) | PASS: skip rule computed (11 files, 159 lines, config) → fan-out; spawned in the foreground with explicit models: `aeo:code-reviewer` sonnet, `aeo:security-auditor` **opus**, `aeo:test-engineer` haiku, then `aeo:workflow-validator`; actual models match; Gate 8 confirmed Opus from the cost report; reports kept verbatim, not reranked; Gate 7 correctly FAILED on a real fixture defect (`npm test` points at a missing file); findings turned into proposed tickets, nothing edited |
| Q0 | Quality refuses a release whose state does not match the diff | PASS (unplanned): with tickets claimed done that were only in unmerged worktrees, the orchestrator stopped before spawning reviewers |

Fixes made during round 3:
- **Discover** launched the codebase-map agent in the background and ended the turn before using it (headless). Step 2 now says to wait for it in the foreground.
- **Discover** asked its interview questions without opening the method files. Step 3 now says to read the method file before the first question; the re-run read all three and used the grilling format.
- **Design** read the fixture's whole `audit.jsonl` (107 KB, about 27k tokens) on Opus, which explains most of the autonomous run's cost rising from USD 0.63 to 0.97. Design's context budget and `core/state-memory-audit.md` now forbid reading run logs whole.
- Harness mistakes (mine, not AEO defects): one implementer run without `--allowedTools` (the agent correctly stopped `blocked` instead of working around denials); one where the agent was started in the background and the headless session ended; one quality run with a test state that did not match the diff.

Finding to decide on (from the security auditor's review of the fixture, about AEO itself): the `Edit/Write(.aeo/**)` allow added for D-4 means an orchestrator or agent can write gate statuses into `state.json` without a prompt. The validator re-runs verification rather than trusting `state.json`, so a forged status cannot pass Gates 3–8 on its own, but the record itself is not tamper-evident.

## Failed

| # | Test | Finding | Status |
|---|---|---|---|
| **7** | `skillOverrides` hides plugin skills | **Not supported on 2.1.322.** The resolver returns no override for ordinary plugin skills (only synced-skill plugins). Overrides do work for non-plugin skills (test 34). | **Resolved for Repos A and B by round 3** (their skills are vendored as non-skill method files; the plugins are not installed). **Still applies to UI UX Pro Max**: `ui-ux-pro-max:design` and its four on-request skills remain model-visible; AEO never routes to them. |
| 15 (run 1) | Deny rules | `Bash(git -C * push:*)` and `Bash(git clean -f:*)` did not match `git -C . push origin main` / `git clean -fdn` | **Fixed**: rules rewritten with `*` wildcards; re-run passed (all variants denied, reads allowed) |
| 26 (run 1) | Audit completeness | Failed and denied commands were not recorded | **Fixed**: PreToolUse attempt + PostToolUseFailure outcome records; re-run passed |

## Formerly blocked by test 7

- 8 (one TDD workflow): PASS by inventory in round 3: the only TDD guidance an AEO session can reach is `methods/matt/tdd`; no TDD skill is model-visible (superpowers is disabled per project).
- 35: PASS in round 4. Note: a user-scope `social-media-skills` plugin (about 100 skills) is now installed on this machine and model-visible in AEO projects; AEO does not disable plugins it did not configure.
- 36: PASS in round 4.

## Not run

- **Needs the VS Code panel (kit prepared; user runs it):** R5 in the panel, follow-up-turn model, 15 permission prompt shown in the UI, 16 hedged approval refused.
- **Needs a full multi-phase interactive run:** 20 no duplicate reviews end to end, 29 end-to-end per class, 23 map freshness, 24 impact-analysis completeness.
- **maxTurns enforcement** (part of 14): not run; would need a deliberately long task.
- **27b** `plugin update` leaves pins unchanged: not run, because if the pin failed it would install unreviewed code.

12 (fallback model) is deliberately not configured: an availability fallback could silently move the security auditor off Opus. Gate 8 instead checks the actual model.

## Observations

- `claude plugin details` shows `Agents (0)` for AEO although all five agents load at runtime (it does not count an explicit `agents` list).
- `.meta.json` `pickedEffortModel` is not the subagent's model; actual models come from the subagent's messages.
- At `SubagentStop` the agent transcript is often not flushed; per-agent tokens and cost come from the cost report.
- A directory-source marketplace runs the plugin from the source folder; pin AEO to a git commit for adoption.
- Fixed per-spawn context cost observed for trivial tasks: about USD 0.003 (Haiku), 0.02–0.09 (Sonnet), 0.18 (Opus).
