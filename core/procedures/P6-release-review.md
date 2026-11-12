<!-- Provenance: AEO procedure P6 (release review). Persona fan-out shape and small-change
skip rule adapted from addyosmani/agent-skills `/ship` @ 301b02b (MIT © 2025 Addy Osmani);
the personas are vendored as AEO agents (agents/*.md). -->
# P6: release review (both modes)

1. Decide the path with the skip rule (`core/workflows.md`). Record the decision and the numbers (files, lines, sensitive areas).
2. **Skip path**: the checklist in `methods/security/security-hardening.md` (and `methods/checklists/security.md`) plus the full validator run.
3. **Fan-out path**: delegate in parallel, each once, read-only, with the models in `runtime/claude-code/routing.md`:
   - `aeo:code-reviewer`: the release diff.
   - `aeo:security-auditor`: the release diff plus `.aeo/debt.md` (every shortcut is a candidate finding). Premium tier; never downgraded.
   - `aeo:test-engineer`: coverage gaps against the spec.
   - `aeo:web-performance-auditor`: only for web UI with a performance-relevant change.
   - `aeo:ui-reviewer`: only when the UI flag is set.
4. Collect the reports verbatim; do not merge or rerank across reviewers.
5. Critical or high findings block Gate 8. The orchestrator proposes fixes as new tickets; it never edits a finding away.
6. Confirm from the cost report that each reviewer ran on its assigned model; the security auditor on Premium.
