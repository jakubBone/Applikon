---
description: Propose a Conventional Commit message for the current changes
argument-hint: "[optional hint about scope or intent]"
---

Propose a Conventional Commit message for the current staged + unstaged changes. **Never run `git add` or `git commit` yourself** — only output the proposed message.

## Workflow

1. Run `git status` and `git diff` (staged + unstaged) to see what actually changed.
2. Read the modified files when the diff alone is not enough to judge intent.
3. Pick the type, scope, and description.
4. Output the proposed message. Wait for user approval before doing anything else.

## Format

```
type(scope): description
```

**Types:** `feat` · `fix` · `refactor` · `test` · `docs` · `chore`
**Scopes:** `backend` · `frontend` · `spec` · `db` · `infra`

## Rules

- Imperative mood, lowercase, no trailing period, ≤72 chars on the subject line.
- One commit = one logical change. If the diff spans multiple unrelated changes, propose splitting and list each suggested commit.
- No `Co-Authored-By` trailers (per CLAUDE.md).
- Pick the type by *intent*, not by which files changed:
  - `feat` = new user-visible capability
  - `fix` = bug fix
  - `refactor` = behavior unchanged, structure changed
  - `test` = only tests touched
  - `docs` = only docs/comments touched
  - `chore` = build, deps, infra, version bumps
- Pick the scope by where the *primary* change lives. If genuinely cross-cutting, omit the scope.

## Output

A single fenced code block with the proposed message. If the type or scope was a judgment call, add one short line of rationale below the block. Nothing else.
