# Player Journey Continuity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make evidence progress, ending eligibility, next actions, and chapter transitions form one continuous journey from Chapter 1 through the locally hosted Chapter 3.

**Architecture:** Extend the existing `silent-plan-case-v2` state rather than introducing a second progress system. Keep puzzle-specific success handling in each page, expose shared progress helpers from `src/shared/state.js`, and use static contract tests for navigation/build requirements. Chapter 2 and 3 receive a small shared series navigation layer without replacing their individual themes.

**Tech Stack:** Static HTML/CSS, browser JavaScript modules, Node.js built-in test runner, localStorage, GitHub Pages build scripts.

---

### Task 1: Ending eligibility and evidence progress

- [x] Add failing state tests for ending gates and puzzle-to-fragment recording.
- [x] Verify the failures.
- [x] Implement the state helpers and ending rules.
- [x] Verify focused state tests pass.

### Task 2: Automatic evidence capture and notebook guidance

- [x] Add failing content tests for automatic capture, progress UI, next actions and archive return behavior.
- [x] Verify the failures.
- [x] Implement evidence capture and notebook guidance.
- [x] Verify focused content tests pass.

### Task 3: Chapter 2 pacing controls

- [x] Add a failing continuity test for an immediate reveal control and reduced-motion behavior.
- [x] Verify the failure.
- [x] Implement deterministic timed and immediate conversation rendering.
- [x] Verify the focused test passes.

### Task 4: Shared chapter orientation

- [x] Extend the failing continuity test to require a shared series bar on Chapters 2 and 3.
- [x] Verify the failure.
- [x] Add `series/series.css` and `series/series.js` and load them on all Chapter 2 and 3 pages.
- [x] Verify the focused test passes.

### Task 5: Local Chapter 3 publication

- [x] Add failing build, smoke and continuity assertions for local Chapter 3.
- [x] Verify the failures.
- [x] Copy Chapter 3 and shared series assets during build and replace the external URL.
- [x] Verify focused build and route tests pass.

### Task 6: Full verification and publication

- [x] Run a clean build, full tests and `git diff --check`.
- [x] Verify the main journey in the in-app browser.
- [x] Commit scoped files, push the branch and verify GitHub Pages deployment.
