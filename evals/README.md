# AEO evals

Headless validation of AEO against a real Claude Code installation. Run the suite again after any change to a pinned commit, a vendored method, the settings template, the agents or the hooks.

## Harness

- `lib/run.sh <fixture> <out-prefix> <model> <max-turns> <prompt> [claude args…]`: one headless session (`CC` = path to the claude binary).
- `lib/analyze.js <stream.jsonl> [--json]`: plugins, model-visible skills, agents, hooks, Skill and Agent calls, permission denials, the **actual** model of each subagent (from its messages), and cost.
- `../runtime/claude-code/scripts/cost-report.js --project <dir> [--session <id>]`: per-agent model and cost from transcripts.
- `lib/selfcontained.js [cache-root]`: static check that AEO is self-contained: no route to upstream skill plugins, every `methods/` path exists, links inside `methods/` resolve, no discoverable `SKILL.md` under `methods/`, every agent file is listed in `plugin.json`, and (with the plugin cache root) every vendored file still matches its upstream hash in `methods/MANIFEST.json`. Run it first; it costs nothing.
- Headless runs that spawn agents must ask for them **in the foreground**; a background agent is abandoned when a `-p` session ends.
- `lib/reads.js <stream.jsonl> <main|agent-type> <path>... [--before Write]`: method adherence. Passes only if the thread or agent opened each file with a successful Read (a denied Read does not count), optionally before its first call to the named tool. Use it for every agent or command that must read a method file.
- `lib/ledger-tests.js`: deterministic gate-ledger tests (no model calls): the real hook writes records, the script writes session logs in the Claude Code 2.1.322 structure, the real verifier judges truncation, rewriting, missing or incomplete session-log references, `SendMessage` continuations, unreadable agent logs, report completeness (short, long, truncated, missing, changed) and report pairing. Run it after any change to `hooks/ledger.js` or `verify-gates.js`, and after every Claude Code update (`runtime/claude-code/ledger.md`).
- Put `SendMessage` and `ToolSearch` in `--allowedTools` **before** any `--disallowedTools` list: arguments after `--disallowedTools` are disallowed. `SendMessage` reaches only agents spawned in the same process, so a continuation test cannot resume an earlier session.
- In this harness, write scripts with a file tool, not a shell heredoc: the Bash tool collapses `\` inside heredocs, which silently breaks regular expressions.
- Grant agents write access to the fixture but deny the AEO repo under test (`--disallowedTools "Edit(//d/<repo>/**)" "Write(//d/<repo>/**)"`) and compare a hash of the repo before and after each run.
- `../runtime/claude-code/scripts/verify-gates.js --project <fixture>`: checks the gate ledger (chain, transcript anchors, every gate claimed in `state.json`). Run it after any phase test.
- Gate approvals in headless tests are typed as a resumed prompt (`--resume <session>`), so the ledger hook records them like a real user message. Allow `Bash(git -C * diff*)` style patterns too: agents address worktrees with `git -C`.

## Fixture rules

- Create every fixture as a fresh git repository in a scratch directory, never inside a real project.
- Apply the AEO project settings, including `enabledPlugins: false` for `ponytail@ponytail`, `superpowers@claude-plugins-official` and `vercel-plugin@vercel`, **before the first session** in the fixture. Otherwise globally installed plugins run there and write their own global state.
- Never give a test a remote; destructive-command probes must be harmless if a rule fails (dry-run flags, non-existent paths).
- Use Haiku for orchestration-only probes; let agents use their configured models.
- Pass `--allowedTools` for every tool the test needs (see the round-3 recipes in `RESULTS.md`); fixtures are not trusted workspaces, so project `allow` rules are ignored headless.
- Keep fixture run logs small: `.aeo/runs/**` grows with every run and inflates the cost of any session that reads it.
- On Windows Git Bash, `lib/run.sh` sets `MSYS_NO_PATHCONV=1`; without it a prompt such as `/design` is rewritten into a Windows path before Claude Code sees it.
- Sessions started from a shell inside VS Code inherit `CLAUDE_CODE_ENTRYPOINT`, so the transcript `entrypoint` field cannot tell headless runs from panel sessions; identify panel sessions by session id.
- Playwright MCP refuses `file:` URLs; serve UI fixtures over `http://` when testing the Playwright fallback.

## Test catalogue

The numbered tests (1–56) and routing tests (R1–R7) are defined in the Stage 1 proposal (revision 4) and the model-routing requirement. The latest results and the tests not yet run are in `RESULTS.md`.
