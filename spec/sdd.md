# SDD Reorganization Checklist

**Status:** IN PROGRESS
**Date started:** 2026-03-29

This file tracks the reorganization of the `spec/` directory to clearly communicate
spec-driven development methodology for portfolio/CV purposes.

---

## Step 1: Create README.md
- [x] Create `spec/README.md` with methodology index

## Step 2: Create directory structure
- [x] `spec/01-vision/`
- [x] `spec/02-implementation/`
- [x] `spec/03-review/`
- [x] `spec/04-refactoring-learning/`
- [x] `spec/05-features/`
- [x] `spec/06-v2/`

## Step 3: Move and rename files (git mv to preserve history)
- [x] `Brief.md` → `01-vision/brief.md`
- [x] `Plan_Implementacji_MVP.md` → `02-implementation/mvp-implementation-plan.md`
- [x] `CR.md` → `03-review/code-review-2026-03-01.md`
- [x] `Plan_Nauki_Backend.md` → `04-refactoring-learning/refactor-plan-backend.md`
- [x] `Plan_Nauki_Frontend.md` → `04-refactoring-learning/refactor-plan-frontend.md`
- [x] `Nauka_Notatki_Backend.md` → `04-refactoring-learning/learning-notes-backend.md`
- [x] `Nauka_Notatki_Frontend.md` → `04-refactoring-learning/learning-notes-frontend.md`
- [x] `Nauka_Notatki_i18n.md` → `04-refactoring-learning/learning-notes-i18n.md`
- [x] `i18n/backend-plan.md` → `05-features/i18n/backend-plan.md`
- [x] `i18n/frontend-plan.md` → `05-features/i18n/frontend-plan.md`
- [x] `i18n/enum-rename-plan.md` → `05-features/i18n/enum-rename-plan.md`
- [x] `next/Wizja_Mikrouslugi_v2.md` → `06-v2/vision.md`
- [x] `linkedin/linkedin_posty.md` → `linkedin/posts.md`

## Step 4: Update file contents
- [x] `01-vision/brief.md` — add "Current State" section at end
- [x] `06-v2/vision.md` — add status note at top
- [x] `linkedin/posts.md` — add comment at top

## Step 5: Update internal references
- [x] Grep spec/ for old filenames
- [x] Update references in `04-refactoring-learning/refactor-plan-backend.md`
- [x] Update references in `04-refactoring-learning/refactor-plan-frontend.md`
- [x] Update references in i18n plans (if any)

## Step 6: Verify
- [x] `git log --follow` on moved files — N/A (spec files were untracked by git)
- [x] Browse spec/ directory — numbered order 01→06 visible
- [x] All internal links in `04-refactoring-learning/` work correctly (verified by grep)
- [x] `spec/README.md` tells the story without opening other files

---

**Status: COMPLETE** (2026-03-29)
