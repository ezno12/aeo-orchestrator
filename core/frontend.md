# Frontend design integration

Applies when Step 0 records `ui != none`.

## Roles

| Concern | Owner |
|---|---|
| What options exist (styles, palettes, typography, landing patterns, charts, stack rules) | `ui-ux-pro-max:ui-ux-pro-max` (local search) |
| Distinctive aesthetic direction; avoiding templated "AI look" | `frontend-design:frontend-design`, checked against the anti-patterns in `methods/frontend/ui-engineering.md` |
| How to build it (components, state, accessibility, responsive, loading/empty/error states, adherence to an existing design system) | `methods/frontend/ui-engineering.md` (adapted to the rules below) |
| Which visual variant | `methods/architecture/prototyping.md` UI branch (guided) |
| Runtime verification | `methods/frontend/browser-verification.md`, followed by `aeo:ui-reviewer` |
| shadcn / Tailwind recipes | `ui-ux-pro-max:ui-styling` (only on those stacks) |
| Tests | `methods/testing/test-driven-development.md` |

## Canonical rules (override any method or plugin default)

- Test widths: **320, 375, 768, 1024, 1440**.
- Accessibility target: **WCAG 2.2 AA**.
- Focus is always visible with at least **3:1** contrast. Generated CSS that removes outlines (`outline: none`) without an equivalent visible indicator is a defect.
- Respect `prefers-reduced-motion`; motion durations are review items, not fixed rules.
- **An existing design system always wins.** Generate a new one only for new UI or an approved redesign.
- Upstream style suggestions (for example glassmorphism as a SaaS default) are options, never auto-accepted.
- Fonts: suggest self-hosting by default (privacy, offline); third-party font CDNs only if the user chooses them per project.

## Steps by phase

| Phase | Step | Output | Checkpoint |
|---|---|---|---|
| discover | Detect existing tokens, Tailwind config, component library, `design-system/` | `ui` section of the codebase map | — |
| design | Design direction (new UI or approved redesign only): run `ui-ux-pro-max` searches (`--design-system`, plus domain searches for typography, colour, landing, chart as relevant); shape 2–3 distinct directions with `frontend-design`; write the design contract per `frontend-ui-engineering`; build variants with `prototype` in guided mode | Design contract; `design-system/<slug>/MASTER.md` only with file approval | **Gate 2a** |
| develop | UI tickets: tdd for component behaviour; `frontend-ui-engineering`; UUPM stack guidelines; `ui-styling` if relevant; automated accessibility checks if the project already has a tool, otherwise an install request | Components and tests | Each package is an install request |
| quality | UI review by `aeo:ui-reviewer` | Report and screenshots | Disputed findings go to the user |
| deliver | Before/after screenshots in the PR body | PR | — |

## UI review checklist

At each test width: renders without horizontal scroll; keyboard path through primary flows; accessibility tree has names and roles; text contrast ≥ 4.5:1 (3:1 large text); focus visible ≥ 3:1; loading, empty, error and success states present; console free of errors; matches the design contract; UUPM pre-delivery checklist items pass; reduced-motion respected.
