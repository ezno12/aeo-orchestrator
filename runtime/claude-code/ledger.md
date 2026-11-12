# Gate ledger: what it detects, what it depends on, what it cannot do

The ledger (`.aeo/gates.jsonl`) is written only by `hooks/ledger.js` and checked by `scripts/verify-gates.js` (validation check 15). It is **evidence that detects tampering, not protection against it.** An agent with shell access runs as the same operating-system user as the hook, so it can, with effort, change both the ledger and Claude Code's logs. The checks below make that hard and detectable in the common cases, never impossible.

## What the verifier checks

| Check | Detects | Verdict when it cannot tell |
|---|---|---|
| Hash chain | an edited record, a removed or reordered record in the middle | n/a (always decidable) |
| Anchors | a record with no matching user message or agent call in the session log | INCONCLUSIVE |
| Session-log references | records removed from the end, records rewritten or removed with the chain rebuilt, records swapped between sessions | INCONCLUSIVE for a record with no reference or an incomplete reference |
| Continuations | an implementer or debugger that kept editing files or running commands after its recorded result (for example after `SendMessage`); the gates whose validation predates that work fail until a fresh validation is cited | INCONCLUSIVE (never PASS) when the agent's log is missing or not in the expected format |
| Report completeness (check 5) | a missing, empty, truncated or changed implementer/debugger report, or one without every response-contract label | INCONCLUSIVE when the session log is missing |

Session-log references: each hook note ("record #N [h:<first 12 hex of the record hash>]") is stored by Claude Code in the session log. A reference to a record number the ledger no longer has, or whose hash differs, fails. Notes written before this change carry no hash; they are still bound to their session and agent call. Removing or emptying the ledger to start over is therefore reported as tampering; that is intended.

Report completeness: the hook stores the sha256 and length of each agent report and a 300-character `response_head` used only to anchor the record. The full report is taken from the agent's tool result in the session log and must match that sha256 and length exactly. `verify-gates.js --report <seq>` prints it for the validator.

## Claude Code log-format dependency

These checks read Claude Code's internal logs, which are not a documented interface:

| Used | Where |
|---|---|
| Hook notes | `~/.claude/projects/<project path with every non-alphanumeric character as "-">/<session>.jsonl`, entries `type: "attachment"`, `attachment.type: "hook_additional_context"`, `attachment.content[]`, `attachment.toolUseID`, `sessionId` |
| Agent call and result | entries with `message.content[]` items `tool_use` (`id`, `input.subagent_type`) and `tool_result` (`tool_use_id`); the entry that carries `toolUseResult` (`content[]`, `agentId`). Claude Code also writes `api-request-blob` copies without `toolUseResult`; they are ignored |
| Agent's own log | `<session>/subagents/agent-<agentId>.jsonl`, `type: "assistant"` entries with `timestamp` and `message.content[]` `tool_use` items (`name`, `input.command` / `input.file_path`); `version` |

**Tested:** Claude Code 2.1.322 (Windows, VS Code extension binary, headless and panel sessions), against 140 live records and the synthetic tests in `evals/lib/ledger-tests.js`. The verifier prints the versions it read; an untested version is named in its `log format` line. After a Claude Code update, run `node evals/lib/ledger-tests.js` and one live chain before relying on the results, then add the version to `TESTED_VERSIONS` in `verify-gates.js`.

## After a Claude Code update

1. `node evals/lib/ledger-tests.js` (no model calls, seconds). Every test must pass.
2. One short live run in a throwaway fixture (`evals/README.md`): a gate approval typed by the user, one agent result, `verify-gates.js` PASS, and the `log format` line naming the new version.
3. Only then add the version to `TESTED_VERSIONS` in `scripts/verify-gates.js`.

To control when this happens, turn off auto-update for the Claude Code extension in VS Code and update deliberately.

**Strict mode (opt-in).** By default an untested version is named in the `log format` line and the check still passes. With `"AEO_LEDGER_STRICT_VERSION": "1"` in the project settings' `env` (or `--strict-version`), logs from an untested version make the ledger check INCONCLUSIVE, so validation check 15 stops the workflow until the re-test above is done. Safer, but every Claude Code update blocks AEO until then.

## Pinning the ledger outside this machine

`verify-gates.js` prints `LEDGER head: #N <hash>`, the newest record. `/aeo:deliver` writes it into the pull-request body after Gate 9. Once the pull request is opened, that hash lives on the forge: rewriting the ledger up to record N afterwards no longer reproduces it. This protects what was delivered, not the work in progress before the pull request exists, and only when the pull request is actually opened.

## Remaining limits

- **Not prevention.** Anything the hook can write, a shell command run by an agent can write too. The read-only file and the deny rules stop the obvious routes; a disguised command can still clear the read-only flag.
- **Logs can be edited too.** Someone who edits the ledger and the matching session-log entries consistently is not detected. The project deny rules cover `~/.claude/**` only for the Edit and Write tools, not for shell commands.
- **The newest records.** A record whose note never reached the session log (a crashed session, a hook killed mid-run) shows as INCONCLUSIVE, not as tampering.
- **Main-thread edits.** Continuation detection covers implementer and debugger agents. Files the orchestrator itself edits after a validation are not attributed; the validator's re-run of the verification commands and the diff checks remain the guard there.
- **Activity, not effect.** A continuation is judged by its tool calls (edits and shell commands) after the recorded result, not by whether it changed the diff; a read-only shell command after a validation also makes the gate stale.
- **Report pairing.** The ledger does not record which report a validator was given, so check 5 is applied to the ticket's latest implementer or debugger report before the cited validation.
- **Conservative staleness.** Release gates (7–9) become stale when any implementer or debugger of the same run works after the release review, even in an unrelated worktree; the verifier cannot tell which work reaches the release. Re-run the review.
- **Timestamps.** Ordering uses the hook's and the logs' wall-clock timestamps from the same machine; a clock change during a run can misorder events.
- **Stronger guarantees** need a store the agent's user cannot write (a separate OS account, a protected remote branch or a remote append-only log); not implemented, by decision. The pull-request pin above is the partial step. Claude Code's Bash sandbox, which could keep shell commands away from these files, is not available on native Windows.
