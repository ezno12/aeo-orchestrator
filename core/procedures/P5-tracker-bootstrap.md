<!-- Provenance: AEO procedure P5 (tracker bootstrap). Runs the vendored method
methods/discovery/tracker-setup.md, adapted from mattpocock/skills `setup-matt-pocock-skills`
@ 4ae2317 (MIT © 2026 Matt Pocock). -->
# P5: tracker bootstrap

Run by `/aeo:discover` when `docs/agents/issue-tracker.md` is missing.

- **Guided**: follow `methods/discovery/tracker-setup.md` with the user (GitHub, GitLab, local markdown or other). `triage` is not part of AEO, so the triage-label section is always skipped. Any remote step (`git remote add`, creating labels or issues with `gh`/`glab`) needs the user's explicit approval for that step.
- **Autonomous**: local markdown only. For any other tracker, stop and ask the user to rerun discover in guided mode.

Steps (both modes):
1. Explore: `CLAUDE.md` / `AGENTS.md`, `GLOSSARY.md` (or legacy `CONTEXT.md`), `docs/adr/`, `docs/agents/`, `.scratch/`.
2. If `docs/agents/issue-tracker.md` already exists, stop: the project is configured.
3. Prepare (do not write yet), from the method's seed templates: `docs/agents/issue-tracker.md`, `docs/agents/domain.md`, and the `## Agent skills` block for the existing `CLAUDE.md` (or `AGENTS.md`). If neither exists, ask which to create; never pick.
4. Show the drafts and write them only with class 1 approval for these paths.
5. First line of each written doc: `> Written by AEO procedure P5 (method tracker-setup, adapted from Matt Pocock's skills).`
