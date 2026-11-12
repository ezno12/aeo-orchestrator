# Attribution

AEO contains curated, adapted copies of MIT-licensed skills by Matt Pocock and Addy Osmani (`methods/`, and four reviewer agents in `agents/`). Each copied file starts with its source repository, pinned commit, upstream path and licence, and lists what AEO changed; `methods/MANIFEST.json` records the SHA-256 of every upstream file. UI UX Pro Max is not copied: it is installed unmodified from the commit pinned in `SOURCES.json`. Where AEO's own text adapts an upstream idea, the adapting file carries a provenance header. The upstream notices are reproduced below.

## Copied and adapted (vendored)

| AEO path | Source | What |
|---|---|---|
| `methods/**` (11 methods: see `methods/MANIFEST.json`, `source: matt`) | Matt Pocock skills @ `4ae2317` (`skills/engineering/*`, `skills/productivity/grilling`) | 11 methods; per-file upstream path, hashes and adaptations in the manifest and each header |
| `methods/**` (13 methods and `methods/checklists/`: see `methods/MANIFEST.json`, `source: addy`) | Addy Osmani agent-skills @ `301b02b` (`skills/*`, `references/*`) | 13 methods and 4 checklists; per-file upstream path, hashes and adaptations in the manifest and each header |
| `methods/debugging/systematic-debugging.md` (appendix) | Addy Osmani agent-skills `debugging-and-error-recovery` @ `301b02b` | Stop-the-line, layer localisation, non-reproducible triage, untrusted error output |
| `agents/code-reviewer.md`, `security-auditor.md`, `test-engineer.md`, `web-performance-auditor.md` | Addy Osmani agent-skills `agents/*` @ `301b02b` | Persona bodies; AEO frontmatter (model, read-only tools) and composition section |

The full audit (what was kept, merged or excluded, and why) is `methods/README.md`.

## Adapted in AEO's own text

| AEO file | Adapted from | What |
|---|---|---|
| `core/principles/minimal-change.md` | Ponytail `skills/ponytail/SKILL.md` @ `96608e0` | The smallest-complete-change ladder, the never-cut list (extended with tests), the `shortcut:` comment convention |
| `skills/deliver/SKILL.md` (debt ledger step) | Ponytail `skills/ponytail-debt/SKILL.md` @ `96608e0` | Collecting `shortcut:` comments into a ledger so deferrals cannot silently become permanent |
| `core/procedures/P1-spec-synthesis.md`, `P2-ticket-breakdown.md` | Matt Pocock skills `to-spec`, `to-tickets` @ `4ae2317` | Wrappers that run the vendored to-spec / to-tickets methods with AEO rules (seams, AEO ticket fields, labels, approvals) |
| `core/procedures/P3`, `P4`, `P5` | Matt Pocock skills `implement`, `implement-spec`, `setup-matt-pocock-skills` @ `4ae2317`; P3 slice rules from Addy Osmani `incremental-implementation` @ `301b02b` | Loop, task graph and tracker setup, with AEO approvals |
| `core/procedures/P6-release-review.md` | Addy Osmani agent-skills `.claude/commands/ship.md` @ `301b02b` | Persona fan-out shape and the small-change skip rule |
| `evals/` harness | Addy Osmani agent-skills evals pattern @ `301b02b` | Fires / stays-quiet case structure |

## Upstream notices

### Ponytail
MIT License. Copyright (c) 2026 DietrichGebert. https://github.com/DietrichGebert/ponytail

### Matt Pocock skills
MIT License. Copyright (c) 2026 Matt Pocock. https://github.com/mattpocock/skills

### Addy Osmani agent-skills
MIT License. Copyright (c) 2025 Addy Osmani. https://github.com/addyosmani/agent-skills

### UI UX Pro Max
MIT License. Copyright (c) 2024 Next Level Builder. https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
Bundled fonts: SIL Open Font License 1.1. Note: `ui-styling/LICENSE.txt` upstream is an unfilled Apache-2.0 template while the skill's frontmatter says MIT; treat its licence as unresolved until upstream clarifies.

For each MIT work above, the full permission notice is the standard MIT text reproduced in this repository's `LICENSE` (with the respective copyright line above):

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
