<!-- Provenance: AEO procedure P1 (spec). Runs the vendored method methods/specification/specification-writing.md,
adapted from mattpocock/skills `to-spec` @ 4ae2317 (MIT © 2026 Matt Pocock). -->
# P1: spec (both modes)

Run by the `/aeo:design` orchestrator. Follow `methods/specification/specification-writing.md` (template and process), with these AEO rules:

Precondition: a confirmed intent and requirements exist (Gate 1 passed). If anything material is ambiguous, stop and ask; do not invent requirements.

1. Context comes from the codebase map, the glossary and the ADRs for the touched area (gathered by `Explore` on the Economy tier, not read by the orchestrator file by file). Use the glossary vocabulary.
2. Test seams: prefer existing and highest seams. **Guided**: confirm them with the user before writing. **Autonomous**: list them under Testing Decisions and as a Gate 2 item.
3. Write the spec with the method's headings: `## Problem Statement`, `## Solution`, `## User Stories`, `## Implementation Decisions`, `## Testing Decisions`, `## Out of Scope`, `## Further Notes`.
4. First line of the file: `> Produced by AEO procedure P1 (method to-spec, adapted from Matt Pocock's skills).`
5. Save to the configured tracker. Local tracker: `.scratch/<feature-slug>/spec.md`, status `ready-for-agent`. A remote tracker (GitHub/GitLab issue) is published only after the user's explicit approval for that publish.
6. Record the path in `state.json` and the audit log (`procedure: P1`).

Gate 2 still requires the user's approval of the spec and plan.
