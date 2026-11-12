# AEO methods (curated upstream methodology)

AEO ships its own copies of the upstream skills it actually uses. They live here as **reference documents read by path** (`${AEO_ROOT}/methods/...`), not as skills, so none of them appears in the model's skill list, none can fire on its own, and no upstream plugin needs to be installed.

- **Authoritative.** In an AEO project, these files and `core/` are the only methodology. If an upstream plugin is also installed on the machine, AEO ignores it (and the project template disables it).
- **Provenance.** Every file starts with its source repository, pinned commit, upstream path and licence. `MANIFEST.json` records the SHA-256 of each upstream file, so drift against a newer upstream commit can be measured before any update.
- **Adaptations** are listed in each file's header. Upstream text is otherwise unchanged, except these global edits: files carry AEO names and live in AEO categories (old → new paths in `MIGRATION-MAP.json`), so none can be discovered as a skill; relative links are updated to the new locations; the YAML frontmatter of each main file is replaced by the AEO header, which names the upstream skill it was adapted from. AEO core wins on any conflict (approvals, canonical frontend rules, TDD authority, model routing).
- **Updating** a method: diff the upstream file at the new commit against the hash in `MANIFEST.json`, re-apply the header adaptations, update `SOURCES.json` and `MANIFEST.json` in one reviewed commit, then re-run `evals/`.

Sources: A = [mattpocock/skills](https://github.com/mattpocock/skills) @ `4ae2317` (MIT © 2026 Matt Pocock). B = [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) @ `301b02b` (MIT © 2025 Addy Osmani).

## Index

| AEO method | Path | Adapted from | Used by |
|---|---|---|---|
| test-driven-development **(the only testing workflow)** | `testing/test-driven-development.md` | A `tdd` | implementer, debugger, P3 |
| specification-writing | `specification/specification-writing.md` | A `to-spec` | /aeo:design (P1) |
| ticket-breakdown | `planning/ticket-breakdown.md` | A `to-tickets` | /aeo:design (P2) |
| requirements-interview | `discovery/requirements-interview.md` | A `grilling` | /aeo:discover (guided) |
| domain-modeling (glossary + **the only ADR format**) | `architecture/domain-modeling.md` | A `domain-modeling` | discover, design |
| module-design | `architecture/module-design.md` | A `codebase-design` | design, refactoring |
| code-review (per-slice) | `code-review/code-review.md` | A `code-review` | /aeo:develop |
| systematic-debugging **(the only debugging workflow)** | `debugging/systematic-debugging.md` | A `diagnosing-bugs` | debugger, bug-fix class |
| prototyping | `architecture/prototyping.md` | A `prototype` | design (guided) |
| pull-request-writing | `architecture/prototyping.md` | A `pr` | design (guided) |
| tracker-setup | `discovery/tracker-setup.md` | A `setup-matt-pocock-skills` | /aeo:discover (P5) |
| intent-interview (intent gate) | `discovery/intent-interview.md` | B `interview-me` | /aeo:discover (guided) |
| source-verified-research | `discovery/source-verified-research.md` | B `source-driven-development` | researcher |
| public-interface-design (public/external interfaces) | `architecture/public-interface-design.md` | B `api-and-interface-design` | design |
| adversarial-decision-review | `architecture/adversarial-decision-review.md` | B `doubt-driven-development` | design (one-way doors) |
| deprecation-and-migration | `architecture/deprecation-and-migration.md` | B `deprecation-and-migration` | design (consumers affected) |
| ui-engineering | `frontend/ui-engineering.md` | B `frontend-ui-engineering` | design, develop (UI) |
| browser-verification | `frontend/browser-verification.md` | B `browser-testing-with-devtools` | ui-reviewer |
| security-hardening | `security/security-hardening.md` | B `security-and-hardening` | implementer (trust boundary), quality skip path |
| performance-optimization | `development/performance-optimization.md` | B `performance-optimization` | develop (measured problem), web-performance-auditor |
| code-simplification | `development/code-simplification.md` | B `code-simplification` | optional follow-up after quality |
| documentation (docs; ADRs use domain-modeling's format) | `delivery/documentation.md` | B `documentation-and-adrs` | deliver |
| release-readiness | `delivery/release-readiness.md` | B `shipping-and-launch` | deliver |
| ci-cd-automation | `development/ci-cd-automation.md` | B `ci-cd-and-automation` | develop (CI in scope only) |
| Checklists: accessibility, definition-of-done, performance, security | `checklists/` | B `references/*` | the methods above |
| Agents: code-reviewer, security-auditor, test-engineer, web-performance-auditor | `../agents/` | B `agents/*` | /aeo:quality (P6) |
| Upstream licences (byte-identical) | `licenses/` | A and B `LICENSE` | — |

## Name map

Vendored text still mentions upstream names. Resolve them like this:

| Upstream name in the text | In AEO |
|---|---|
| `tdd`, `test-driven-development`, `/test`, "Prove-It pattern" | `testing/test-driven-development.md` |
| `to-spec`, `spec-driven-development`, `/spec` | `specification/specification-writing.md` (P1) |
| `to-tickets`, `planning-and-task-breakdown`, `/plan`, `incremental-implementation` | `planning/ticket-breakdown.md` (P2), slice rules in P3 |
| `implement`, `implement-spec`, `/build` | P3 / P4 run by `aeo:implementer` |
| `code-review`, `code-review-and-quality`, `/review` | `code-review/code-review.md` (per slice); release review is `/aeo:quality` |
| `/ship`, `/webperf` | `/aeo:quality` (P6) |
| `diagnosing-bugs`, `debugging-and-error-recovery` | `debugging/systematic-debugging.md` (with its AEO appendix) |
| `research` | `aeo:researcher` + `discovery/source-verified-research.md` |
| `setup-matt-pocock-skills`, `/setup-matt-pocock-skills` | `discovery/tracker-setup.md` (P5) |
| `grill-me`, `grill-with-docs`, `idea-refine` | `discovery/requirements-interview.md` + `architecture/domain-modeling.md` |
| `git-workflow-and-versioning`, any "commit" step | `core/approvals.md` class 3 (commits only through the approval prompt) |
| `observability-and-instrumentation`, `orchestration-patterns.md` | not shipped; AEO orchestration rules are `core/` |
| `triage`, `wayfinder`, `retro`, `handoff` | not shipped |

## Audit of every upstream item

Decision key: **V** vendored (adapted) · **M** merged into another AEO method or procedure · **X** excluded.

### A: Matt Pocock skills (39 skills)

| Skill | Decision | Reason |
|---|---|---|
| engineering/tdd | V | Authoritative testing workflow (user requirement). |
| engineering/to-spec | V | Spec format and process for the design phase (P1). |
| engineering/to-tickets | V | Tracer-bullet tickets with blocking edges (P2). |
| engineering/code-review | V | Per-slice Standards + Spec review. Distinct from the release personas (scope: one ticket's diff). |
| engineering/codebase-design | V | Module/seam vocabulary used by tdd and design. |
| engineering/domain-modeling | V | Glossary and the single ADR format. |
| engineering/diagnosing-bugs | V | Single debugging workflow; tighter (feedback-loop first) than Repo B's. |
| engineering/prototype | V | UI variants and logic demos in guided design. |
| engineering/pr | V | PR body with evidence. |
| engineering/setup-matt-pocock-skills | V (as `tracker-setup`) | Tracker and domain-doc layout that to-spec/to-tickets/code-review read. |
| productivity/grilling | V | Requirements interview. |
| engineering/implement | M → P3 | Its loop (tdd at agreed seams, typecheck often, full suite at the end, then review) is P3. Its "commit to the current branch" conflicts with approval class 3. |
| engineering/implement-spec | M → P4 | Task graph / frontier / worktree per ticket / integration branch is P4, with AEO's depth-1 nesting, max 3 implementers and approval-gated merges. |
| engineering/research | M → researcher | The researcher agent *is* that skill's background agent; primary-source rule kept. |
| engineering/grill-with-docs | X | User-invoked wrapper of grilling + domain-modeling, both vendored. |
| productivity/grill-me | X | User-invoked wrapper of grilling. |
| engineering/ask-matt | X | A router; AEO commands are the only router. |
| engineering/triage | X | Issue-queue triage state machine; not part of a build workflow. |
| engineering/wayfinder | X | Multi-session decision maps; overlaps to-tickets and AEO state/resume. |
| engineering/improve-codebase-architecture | X | User-invoked repo scan with an HTML report; codebase-design covers the design vocabulary AEO needs. |
| engineering/retro | X | Session retrospective; outside the delivery workflow. |
| engineering/wizard | X | Generates bash wizards for human-only setup; not used. |
| productivity/handoff, teach, to-questionnaire, wait-what, writing-for-agents | X | Conversation/productivity aids, not engineering workflow steps. |
| in-progress/* (8: chief-of-staff, claude-handoff, loop-me, setup-ts-deep-modules, software-factory, writing-beats, writing-fragments, writing-shape) | X | Marked unfinished upstream; chief-of-staff would be a second orchestrator. |
| misc/git-guardrails-claude-code | X | AEO's permission rules cover it, and it has a documented `git -C` bypass. |
| misc/migrate-to-shoehorn, scaffold-exercises, setup-pre-commit | X | Project-specific tooling; installs packages. |

### B: Addy Osmani agent-skills (24 skills, 4 agents, 9 commands, 7 references)

| Item | Decision | Reason |
|---|---|---|
| frontend-ui-engineering | V | UI build rules (user requirement). Adapted to WCAG 2.2 AA and the 5 AEO widths. |
| browser-testing-with-devtools | V | Runtime UI verification (user requirement). |
| security-and-hardening | V | Build-time security and skip-path checklist. |
| performance-optimization | V | Measured performance work; auditor remediation. |
| shipping-and-launch | V | Launch decision and rollback plan. |
| documentation-and-adrs | V | README/changelog/API docs; its ADR template defers to domain-modeling (no duplicate ADR format). |
| code-simplification | V | Post-review simplification as a separate change. |
| doubt-driven-development | V | Fresh-context challenge of one-way-door decisions. |
| deprecation-and-migration | V | Consumer-safe migrations (improvement/refactoring). |
| ci-cd-and-automation | V | CI tickets when CI is in scope. |
| api-and-interface-design | V | Public/external API contracts; module interfaces stay with codebase-design. |
| source-driven-development | V | Cited, version-aware research. |
| interview-me | V | Intent gate before grilling (different question: *why*, not *what*). |
| debugging-and-error-recovery | M → diagnosing-bugs appendix | **Duplicate debugging workflow.** Only stop-the-line, layer localisation, non-reproducible triage and untrusted-error-output rules were kept. |
| incremental-implementation | M → P3 | Duplicates tracer-bullet slicing; its commit-per-increment step conflicts with approval class 3. |
| test-driven-development | X | **Duplicate TDD**; Matt's tdd is authoritative. |
| spec-driven-development | X | **Duplicate spec workflow**; to-spec is used. |
| planning-and-task-breakdown | X | **Duplicate planning**; to-tickets is used. |
| code-review-and-quality | X | **Duplicate review**: per-slice is Matt's code-review, release is the personas. Its severity labels are inlined in `aeo:code-reviewer`. |
| idea-refine | X | Duplicates grilling/interview-me for AEO's purposes. |
| using-agent-skills | X | A second router. |
| git-workflow-and-versioning | X | Commit/branch behaviour is governed by AEO approvals; its auto-commit guidance conflicts. |
| context-engineering | X | Session/context setup is AEO's own state and contract design. |
| constraint-driven-development | X | Optional quality-bar contract; not in the workflow. Can be added later as a method if wanted. |
| observability-and-instrumentation | X | Production instrumentation is out of AEO's scope (no deploys). |
| agents/code-reviewer, security-auditor, test-engineer, web-performance-auditor | V (as AEO agents) | Release review (user requirement). Given explicit models (security-auditor **opus**) and read-only tools; upstream had neither. |
| commands /spec, /plan, /build, /test, /review, /code-simplify, /constraints | X | Duplicate AEO phases or excluded skills. |
| commands /ship, /webperf | M → P6 | Persona fan-out and skip rule live in P6 / `/aeo:quality`. |
| commands/*.toml | X | Gemini CLI copies of the commands. |
| references: accessibility-checklist, definition-of-done, performance-checklist, security-checklist | V | Linked from the vendored methods. |
| references: testing-patterns | X | Duplicates tdd's tests.md / mocking.md. |
| references: orchestration-patterns, observability-checklist | X | AEO's orchestration rules are `core/`; observability is excluded. |
| hooks/* (SDD cache, simplify-ignore, session-start scripts) | X | Not registered by the upstream plugin (no hooks.json); session-start injection is what AEO avoids. |
| docs/*, evals/, scripts/ | X | Host setup guides and upstream test harness. |

### D: UI UX Pro Max (unchanged; still an external pinned plugin)

Not vendored: it is a Python search engine plus data files rather than prose, its `ui-styling` licence is unresolved upstream (see ATTRIBUTION.md), and the requirement was to keep its capabilities, which the pinned plugin provides. Its `design` router remains visible to the model (skill overrides do not apply to plugin skills on Claude Code 2.1.322); AEO's commands never route to it.
