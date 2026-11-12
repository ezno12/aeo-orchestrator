# Contracts

## Delegation contract

Sent as the prompt header of every delegated task. Pointers, not pasted text.

```
TASK        <id> · mode <guided|autonomous> · agent <type> · tier <economy|balanced|premium> · reason <one line>
AEO_ROOT    <absolute path of the AEO plugin; agents read core/ files from here>
METHODS     <method paths under AEO_ROOT to follow, e.g. methods/testing/test-driven-development.md>
OBJECTIVE   <one sentence>
CONTEXT     spec <path> · ticket <path> · codebase map <path> · notes <paths>
SCOPE       may modify: <globs> · must not modify: <globs> · worktree/branch: <name>
CRITERIA    <acceptance criteria, verbatim from the ticket>
VERIFY      <commands that prove the criteria>
LIMITS      maxTurns <n> (enforced) · token budget <n> (advisory, not enforced)
APPROVALS   <granted classes, normally none> · never push, merge or deploy
STOP IF     scope insufficient · criteria ambiguous · dependency needed · same failure twice
OUTPUT      response contract below
```

## Response contract

The last block of every agent reply. A missing or malformed block is a validator `FAIL`.

```
TASK            <id>
STATUS          done | partial | blocked | failed
FAILURE CLASS   <from failure-recovery.md, if not done>
WORK DONE       <bullets>
FILES INSPECTED <paths>
FILES MODIFIED  <paths>
METHODS USED    <method paths actually read>
TESTS RUN       <command> · exit <code> · <summary>   (one line each)
EVIDENCE        <paths>
SHORTCUTS       <file:line · shortcut text>   (or none)
NOT VERIFIED    <what was skipped or not checked, and why>   (or none)
PROBLEMS        <or none>
REMAINING       <or none>
```

## Completion evidence

Every gate and every "done" claim stores, under `.aeo/runs/<id>/evidence/`:

- `command`, `exit_code`, `output_excerpt` for each verification command;
- `not_verified[]`: required field; lists anything skipped or unverifiable with the reason (empty list only if truly nothing);
- the approval record where the gate requires one.

No evidence, no pass.
