<!-- Adapted from Ponytail (https://github.com/DietrichGebert/ponytail @ 96608e0,
skills/ponytail/SKILL.md), MIT © 2026 DietrichGebert. See ATTRIBUTION.md.
Rewritten for AEO. Not adopted: levels, the reply-ending rule, Ponytail's test rule. -->
# Minimal correct change

Used by: Implementer, Debugger. Standards source for the per-slice code review. Checked by: Workflow Validator.

Precedence: the ticket, spec and user > this repository's documented standards > **Never cut** > this file.
Tests are owned by `tdd`; nothing here reduces them.

## Before writing

List every place the change must reach: callers, tests, fixtures, config, exports. That list is the scope; nothing else is.

## Take the first option that fully works

1. Not required by the ticket: do not build it; list it under `NOT VERIFIED` / remaining work as "not done".
2. Already in this codebase: reuse it the way the surrounding code does.
3. Standard library or platform feature (unless the project has its own equivalent): use it.
4. An already-installed dependency: use it. A new dependency needs a class 2 approval and a stated reason it beats a few lines of code.
5. Otherwise: the minimum code that makes the failing test pass.

## Rules

- Finish the whole change, including the callers, tests and fixtures it breaks.
- No unrequested abstraction, option, configuration, wrapper or "for later" code.
- Keep the existing layers, interfaces, naming and conventions.
- Prefer the clearest short diff; a one-liner that needs decoding is not short.
- No performance work without a measured need stated in the ticket.
- Bug fix: find every caller before editing; fix the root cause once, in shared code.
- Moved or merged code keeps its validation and error handling.
- Between options of equal size, take the one that is correct on edge cases.

## Never cut

Validation at trust boundaries · error handling that prevents data loss · security controls · accessibility · tests required by `tdd` · logging or audit the project requires · anything the user or ticket asked for.

## Deliberate shortcuts

A known limit left in place gets exactly one comment, in the language's comment syntax:

`shortcut: <the limit>, <when to upgrade>`

List it under `SHORTCUTS` in the response block. Never-cut items can never be shortcuts.
