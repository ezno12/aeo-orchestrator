# Step 0: classification

Run at the start of `/aeo:discover` when `.aeo/state.json` has no active work item. Show the result with its evidence; the user may override it.

| Class | Signals | Evidence to show |
|---|---|---|
| `new-project` | No source files, or empty git history; the request is to create a product | File count, last commit (or none) |
| `full-project` | A new project plus intent to take several features to release in this effort | The request text; ask once if unclear, as one question with a recommended answer |
| `new-feature` | Existing code; adds a capability that does not exist | A grep for the domain concept showing it is absent |
| `improvement` | Changes behaviour of an existing capability | The existing code location; impact analysis is mandatory |
| `bug-fix` | Broken, failing, regressed, slow; a pasted error or failing test | The error or failing test. Becomes `new-feature` if reproduction shows the behaviour was never built |
| `refactoring` | Structural change with no behaviour change | Becomes `improvement` if the user expects behaviour to change |

## UI flag

Independent of the class. Record:

- `ui: none | new | existing | redesign`
- `surface: web | mobile | desktop`
- `design_system: <path or "none found">` (tokens, Tailwind config, component library, `design-system/` folder)

`ui != none` adds the frontend steps in `frontend.md` and Gate 2a.

## Rules

- A mixed request (for example a bug fix plus a refactor) is split into separate work items, each classified.
- Reclassifying later sends the work item back to `/aeo:design`.
- Record class, UI flag, evidence and any user override in `state.json` and the audit log.
