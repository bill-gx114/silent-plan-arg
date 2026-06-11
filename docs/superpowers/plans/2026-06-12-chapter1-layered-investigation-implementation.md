# Chapter 1 Layered Investigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, verify, and publish a three-site static ARG remake of Chapter 1 with five evidence-based puzzles, a shared case notebook, three endings, and GitHub hosting.

**Architecture:** Keep the existing chapters untouched as legacy material. Add a dependency-light static application under `src/` with three independently deployable sites (`blog`, `corporate`, `archive`) and a small shared ES module library. A Node build script copies source and generated evidence assets into `dist/`, while Node's built-in test runner validates puzzle normalization, token generation, state transitions, and output integrity.

**Tech Stack:** HTML5, CSS, ES modules, Web Audio API, File API, Web Crypto API, Node.js built-in test runner, Git, GitHub CLI.

---

### Task 1: Repository and Build Skeleton

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `scripts/build.mjs`
- Create: `scripts/generate-assets.mjs`
- Create: `tests/build.test.mjs`

- [ ] Write a failing test that expects `dist/blog/index.html`, `dist/corporate/index.html`, and `dist/archive/index.html`.
- [ ] Run `npm test` and confirm the build-output test fails because no build exists.
- [ ] Add the build and asset-generation scripts.
- [ ] Run `npm run build && npm test` and confirm the build-output test passes.
- [ ] Initialize Git and commit the skeleton.

### Task 2: Shared Investigation Engine

**Files:**
- Create: `src/shared/state.js`
- Create: `src/shared/evidence.js`
- Create: `src/shared/hints.js`
- Create: `src/shared/config.js`
- Create: `src/shared/base.css`
- Create: `tests/state.test.mjs`
- Create: `tests/evidence.test.mjs`

- [ ] Write failing tests for credential normalization, evidence-fragment validation, hint spending, and ending availability.
- [ ] Run the focused tests and confirm expected failures.
- [ ] Implement the minimal shared modules.
- [ ] Run the focused tests and full suite.
- [ ] Commit shared engine behavior.

### Task 3: Blog Site and Puzzles P1–P2

**Files:**
- Create: `src/blog/index.html`
- Create: `src/blog/blog.html`
- Create: `src/blog/report.html`
- Create: `src/blog/revision.html`
- Create: `src/blog/attachments.html`
- Create: `src/blog/photo-lab.html`
- Create: `src/blog/case-notebook.html`
- Create: `src/blog/dead-switch.html`
- Create: `src/blog/blog.js`
- Create: `src/blog/blog.css`
- Create: `tests/blog-content.test.mjs`

- [ ] Write failing content tests for required pages, P1 conclusion fields, P2 evidence controls, notebook fields, and no permanent Chapter 2 link.
- [ ] Run the focused test and confirm missing-page failures.
- [ ] Implement the private-message entrance, editorial diff puzzle, evidence downloads, image lab, and case notebook.
- [ ] Run focused and full tests.
- [ ] Commit the blog site.

### Task 4: Corporate Site and Puzzles P3–P4

**Files:**
- Create: `src/corporate/index.html`
- Create: `src/corporate/products.html`
- Create: `src/corporate/team.html`
- Create: `src/corporate/archive.html`
- Create: `src/corporate/diff.html`
- Create: `src/corporate/directory.html`
- Create: `src/corporate/request-log.html`
- Create: `src/corporate/corporate.js`
- Create: `src/corporate/corporate.css`
- Create: `tests/corporate-content.test.mjs`

- [ ] Write failing tests for the three snapshots, employee record, deletion batch, log reconstruction UI, and redundant bridge clues.
- [ ] Run the focused test and confirm expected failures.
- [ ] Implement the public site, archive comparison, employee directory, and request-log reconstruction puzzle.
- [ ] Run focused and full tests.
- [ ] Commit the corporate site.

### Task 5: Archive Site and Puzzle P5

**Files:**
- Create: `src/archive/index.html`
- Create: `src/archive/tree.html`
- Create: `src/archive/package.html`
- Create: `src/archive/forensics.html`
- Create: `src/archive/integrity.html`
- Create: `src/archive/switch-console.html`
- Create: `src/archive/archive.js`
- Create: `src/archive/archive.css`
- Create: `tests/archive-content.test.mjs`

- [ ] Write failing tests for path access, evidence package, channel controls, integrity records, and switch token generation.
- [ ] Run the focused test and confirm expected failures.
- [ ] Implement the directory mirror, package workflow, Web Audio channel controls, integrity comparison, and return token.
- [ ] Run focused and full tests.
- [ ] Commit the archive site.

### Task 6: Evidence Assets and Fallbacks

**Files:**
- Create: `assets-source/interview-timeline.csv`
- Create: `assets-source/published-report.txt`
- Create: `assets-source/autosave-draft.txt`
- Create: `assets-source/city-outage-notice.txt`
- Create: generated evidence under `src/blog/assets/` and `src/archive/assets/`
- Modify: `scripts/generate-assets.mjs`
- Create: `tests/assets.test.mjs`

- [ ] Write failing tests for required evidence files, deterministic hashes, WAV stereo channels, and fallback transcripts.
- [ ] Run the focused test and confirm expected failures.
- [ ] Generate the evidence bundle, stereo WAV, metadata exports, and transcripts.
- [ ] Run focused and full tests.
- [ ] Commit evidence assets.

### Task 7: Endings, Accessibility, and Deployment Configuration

**Files:**
- Modify: `src/blog/dead-switch.html`
- Modify: `src/blog/case-notebook.html`
- Modify: `src/shared/config.js`
- Create: `README.md`
- Create: `docs/DEPLOYMENT.md`
- Create: `tests/endings.test.mjs`
- Create: `tests/accessibility.test.mjs`

- [ ] Write failing tests for three endings, hidden-ending gating, desktop guidance, labels, and configured cross-site URLs.
- [ ] Run the focused tests and confirm expected failures.
- [ ] Implement ending consequences, compatibility messaging, configuration docs, and deployment instructions.
- [ ] Run focused and full tests.
- [ ] Commit endings and documentation.

### Task 8: Browser Verification

**Files:**
- Create: `scripts/serve.mjs`
- Create: `tests/smoke.test.mjs`

- [ ] Write a failing HTTP smoke test for all entry points and key assets.
- [ ] Run it and confirm failure with no server/build.
- [ ] Implement the local static server and smoke checks.
- [ ] Build and run the test suite.
- [ ] Use the in-app browser to complete P1–P5, submit four hidden fragments, and verify all endings and responsive fallbacks.
- [ ] Commit verification support and any fixes.

### Task 9: GitHub Publication

**Files:**
- Modify: `README.md`
- Create: `.github/workflows/pages.yml`

- [ ] Add and validate a GitHub Pages workflow that publishes `dist/`.
- [ ] Run final build, tests, link scan, and Git status review.
- [ ] Create the GitHub repository `silent-plan-arg`.
- [ ] Push the default branch and enable Pages through GitHub Actions.
- [ ] Verify the remote repository and deployed Pages URL.

