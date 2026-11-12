# Method precedence: one owner per responsibility

AEO's methodology is its own: `core/` plus the curated methods in `methods/` (adapted from Matt Pocock's and Addy Osmani's MIT-licensed skills; audit and name map in `methods/README.md`). Methods are **read by path** under `AEO_ROOT` and followed; they are not skills and are never invoked with the Skill tool. No upstream skill plugin is required or used.

## Owners

| Responsibility | Owner (under `AEO_ROOT`) | Notes |
|---|---|---|
| Orchestration and routing | AEO commands `/aeo:*` | The only router in AEO projects |
| Intent gate | `methods/discovery/intent-interview.md` | Only when who / why / success is unknown; guided only |
| Requirements interview | `methods/discovery/requirements-interview.md` + `methods/architecture/domain-modeling.md` | After the intent gate, never on the same question |
| Tracker and domain-doc setup | `methods/discovery/tracker-setup.md` (P5) | Autonomous: local markdown only |
| Spec | `methods/specification/specification-writing.md` (P1) | Both modes; guided confirms seams with the user |
| Tickets | `methods/planning/ticket-breakdown.md` (P2) | Both modes; plus AEO fields |
| Research | `aeo:researcher` + `methods/discovery/source-verified-research.md` | Cited facts |
| Architecture | `methods/architecture/module-design.md`; `methods/architecture/public-interface-design.md` for public/external interfaces; `methods/architecture/adversarial-decision-review.md` for one-way doors (orchestrator only); `methods/architecture/deprecation-and-migration.md` when consumers are affected | |
| ADRs and glossary | `methods/architecture/domain-modeling.md` (`ADR-FORMAT.md`, `GLOSSARY-FORMAT.md`) | The only ADR format |
| Testing | **`methods/testing/test-driven-development.md` (authoritative)** | Red before green; refactoring is not part of the loop |
| Minimal change | `core/principles/minimal-change.md` | Defers to tdd, spec, repo standards, never-cut list |
| Slice discipline | P3 | Tracer bullets; commits only through approval class 3 |
| Per-slice review | `methods/code-review/code-review.md` (Standards + Spec) | Standards sources include `minimal-change.md` |
| Debugging | **`methods/debugging/systematic-debugging.md`** (with its AEO appendix) | The only debugging workflow |
| Release review | `aeo:code-reviewer`, `aeo:security-auditor`, `aeo:test-engineer`, `aeo:web-performance-auditor` (web), `aeo:ui-reviewer` (UI) | Once per release (P6); skip rule |
| Security build-time | `methods/security/security-hardening.md` | Trust-boundary tickets; skip-path checklist |
| Performance | `methods/development/performance-optimization.md` | Only with a measured problem |
| UI design data | `ui-ux-pro-max:ui-ux-pro-max` (external pinned plugin) | Local search; suggestions, not decisions |
| UI aesthetic direction | `frontend-design:frontend-design` (user-installed) | |
| UI engineering rules | `methods/frontend/ui-engineering.md` | Adapted to `core/frontend.md` canonical rules |
| UI component recipes | `ui-ux-pro-max:ui-styling` | shadcn / Tailwind projects only |
| UI variants | `methods/architecture/prototyping.md` | Guided only |
| UI runtime verification | `methods/frontend/browser-verification.md` via `aeo:ui-reviewer` | |
| Docs | `methods/delivery/documentation.md` | README, changelog, API docs; ADRs per domain-modeling |
| PR | `methods/delivery/pull-request-writing.md` | Screenshots for UI work |
| Launch decision | `methods/delivery/release-readiness.md` | |
| CI | `methods/development/ci-cd-automation.md` | Only when CI is in scope |
| Refactoring after review | `methods/development/code-simplification.md` | Separate change |

## Other plugins in AEO projects

| Item | Setting | Reason |
|---|---|---|
| `ui-ux-pro-max:design` | model invocation denied (enforced: `Skill(ui-ux-pro-max:design)` deny rule); you can still run `/ui-ux-pro-max:design` yourself | Router; needs API keys |
| `ui-ux-pro-max:design-system`, `brand`, `banner-design`, `slides` | user-invocable-only (intended) | On request only |
| Personal copies of UI UX Pro Max skills in the user's global skills folder | off (project override, enforced) | Avoid duplicate copies |
| Plugins `superpowers`, `vercel-plugin`, `ponytail` | disabled per project (enforced) | Competing session-start instructions / routers |
| Any installed copy of Matt Pocock's or Addy Osmani's skill plugins | disabled per project (preflight proposes it) | Duplicates of AEO methods |

> **Enforcement status (Claude Code 2.1.322, eval test 7):** `skillOverrides` is not applied to plugin skills, so the `skillOverrides` entries for `ui-ux-pro-max:*` are intended visibility only: the model can still see those skills. Never route work to them. For the router, the permission deny rule `Skill(ui-ux-pro-max:design)` enforces it: the model's Skill call is refused, while the user's own slash command still runs (round 4, experiment 4C). Overrides for non-plugin skills and `enabledPlugins: false` are enforced (tests 34, 45, 46, 54).
