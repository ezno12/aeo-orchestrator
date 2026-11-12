# Development rules (every ticket)

- Tests follow `methods/testing/test-driven-development.md` (the only testing workflow): one failing test, then the minimum code to pass it, one slice at a time. Refactoring happens after review, as its own change.
- Implementation choices follow `principles/minimal-change.md`.
- Work only inside the contract's file scope and worktree. Shared files (lockfiles, migrations) belong to one ticket only.
- A needed dependency is a stop-and-ask (class 2 install request), never a silent install.
- Commits go through the class 3 prompt; never push, merge or deploy.
- Bug fixes: reproduce with a failing regression test first; find every caller of the code you touch; fix the root cause once.
- Trust-boundary tickets also follow `methods/security/security-hardening.md`.
- UI tickets also follow `frontend.md`.
- Finish with the response contract, including `SHORTCUTS` and `NOT VERIFIED`.
