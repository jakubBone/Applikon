# EasyApply — Spec Documentation

This directory contains all specification artifacts for the EasyApply project,
organized chronologically by development phase. All implementation was done using
**Claude Code** (Anthropic's AI CLI) with a spec-first approach: specifications
were written before code, not after.

## V1 — MVP Monolith

| Phase | Directory | Status |
|-------|-----------|--------|
| Vision | `v1/01-vision/` | Complete |
| Implementation | `v1/02-implementation/` | Complete |
| Code Review | `v1/03-review/` | Complete (2026-03-01) |
| Refactoring & Learning | `v1/04-refactoring-learning/` | Frontend: done / Backend: pending |
| Feature: i18n | `v1/05-additional-features/i18n/` | Complete |

## V2 — Microservices

| Phase | Directory | Status |
|-------|-----------|--------|
| Vision | `v2/vision.md` | Complete |
| Brief & Implementation | `v2/` | Pending |
| Code Review | `v2/review/` | Pending |
| Learning & Improvement | `v2/learning/` | Pending |

## AI-Assisted Development

All implementation used Claude Code, but the approach was spec-first — Claude received
specifications and built to them. The refactoring plans in `v1/04-refactoring-learning/` document an
additional pattern: **Claude as mentor**. After the code review, Claude created structured
learning plans paired with refactoring implementation — teaching concepts while improving code. The notes
files record what was understood at each stage.

## Code Review Note

`v1/03-review/` contains a **code quality review** (best practices, security vulnerabilities,
design patterns) — not a verification that the implementation plan was completed.
Completion verification is tracked within each plan's own Definition of Done.

