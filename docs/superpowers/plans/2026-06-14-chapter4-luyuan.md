# Chapter Four Luyuan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish Chapter 4, “Luyuan · For Your Own Good,” as a complete three-act investigation with persistent progress, two partial endings, and one coordinated stage-finale ending.

**Architecture:** Add a self-contained `chapter4/` static site that reuses the shared series orientation assets but owns its chapter state and visual skin. Keep state transitions and ending resolution in a tested ES module, while individual pages render evidence, validate player conclusions, persist completed steps, and expose one deterministic next action.

**Tech Stack:** Static HTML/CSS, browser JavaScript modules, localStorage, Node.js built-in test runner, existing build and GitHub Pages scripts.

---

## File Map

- Create `chapter4/chapter4.js`: chapter state, prerequisite checks, progress helpers, and ending resolution.
- Create `chapter4/chapter4.css`: shared Chapter 4 government, archive, and operations visual primitives.
- Create `chapter4/index.html`: delayed-message introduction with immediate reveal.
- Create `chapter4/portal.html`: volunteer-list evidence puzzle.
- Create `chapter4/notices.html`: approval-batch reconstruction puzzle.
- Create `chapter4/hearing.html`: hearing reconstruction puzzle.
- Create `chapter4/operation.html`: evidence-mirror and rescue-route preparation.
- Create `chapter4/execute.html`: synchronized execution form and ending routing.
- Create `chapter4/end.html`: complete and partial stage-ending renderer.
- Create `tests/chapter4-state.test.mjs`: pure state and ending tests.
- Create `tests/chapter4-content.test.mjs`: page content, evidence, accessibility, and prerequisite contracts.
- Modify `tests/chapter-continuity.test.mjs`: Chapter 3 to Chapter 4 transition and orientation coverage.
- Modify `tests/build.test.mjs`: Chapter 4 artifact coverage.
- Modify `tests/smoke.test.mjs`: Chapter 4 served-route coverage.
- Modify `scripts/build.mjs`: copy Chapter 4 into `dist`.
- Modify `chapter3/end.html`: replace “to be continued” with the local Chapter 4 entry.

### Task 1: Chapter State and Ending Resolver

**Files:**
- Create: `tests/chapter4-state.test.mjs`
- Create: `chapter4/chapter4.js`

- [ ] **Step 1: Write failing state tests**

Test the exact public API:

```js
import {
  availableChapter4Actions,
  completeChapter4Step,
  createChapter4State,
  resolveChapter4Ending
} from "../chapter4/chapter4.js";

test("chapter four starts with no completed investigation steps", () => {
  assert.deepEqual(createChapter4State(), {
    volunteersVerified: false,
    batchRecovered: false,
    hearingExposed: false,
    mirrorReady: false,
    rescueReady: false,
    executionTime: "",
    ending: ""
  });
});

test("completing a step is immutable and only accepts known steps", () => {
  const initial = createChapter4State();
  const completed = completeChapter4Step(initial, "volunteersVerified");
  assert.equal(initial.volunteersVerified, false);
  assert.equal(completed.volunteersVerified, true);
  assert.deepEqual(completeChapter4Step(initial, "unknown"), initial);
});

test("actions unlock in investigation order", () => {
  let state = createChapter4State();
  assert.deepEqual(availableChapter4Actions(state), ["portal"]);
  state = completeChapter4Step(state, "volunteersVerified");
  assert.deepEqual(availableChapter4Actions(state), ["notices"]);
  state = completeChapter4Step(state, "batchRecovered");
  assert.deepEqual(availableChapter4Actions(state), ["hearing"]);
});

test("coordinated ending requires both preparations and 04:17", () => {
  const ready = {
    ...createChapter4State(),
    mirrorReady: true,
    rescueReady: true
  };
  assert.equal(resolveChapter4Ending(ready, "04:16"), null);
  assert.equal(resolveChapter4Ending(ready, "04:17"), "coordinated");
});

test("one prepared line resolves to its partial ending", () => {
  assert.equal(resolveChapter4Ending({
    ...createChapter4State(),
    mirrorReady: true
  }, "04:17"), "exposure");
  assert.equal(resolveChapter4Ending({
    ...createChapter4State(),
    rescueReady: true
  }, "04:17"), "rescue");
});
```

- [ ] **Step 2: Run the state tests and verify RED**

Run:

```bash
node --test tests/chapter4-state.test.mjs
```

Expected: failure because `chapter4/chapter4.js` does not exist.

- [ ] **Step 3: Implement the minimal state module**

Implement:

```js
export const CHAPTER4_STORAGE_KEY = "silent-plan-chapter4-v1";

const steps = new Set([
  "volunteersVerified",
  "batchRecovered",
  "hearingExposed",
  "mirrorReady",
  "rescueReady"
]);

export function createChapter4State() {
  return {
    volunteersVerified: false,
    batchRecovered: false,
    hearingExposed: false,
    mirrorReady: false,
    rescueReady: false,
    executionTime: "",
    ending: ""
  };
}

export function loadChapter4State(storage = globalThis.localStorage) {
  if (!storage) return createChapter4State();
  try {
    return {
      ...createChapter4State(),
      ...JSON.parse(storage.getItem(CHAPTER4_STORAGE_KEY) || "{}")
    };
  } catch {
    return createChapter4State();
  }
}

export function saveChapter4State(state, storage = globalThis.localStorage) {
  storage?.setItem(CHAPTER4_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function completeChapter4Step(state, step) {
  return steps.has(step) ? { ...state, [step]: true } : state;
}
```

Implement ordered action selection and normalize execution time by removing non-digits and formatting four digits as `HH:MM`. Return `null` when neither preparation exists or when the time is not `04:17`.

- [ ] **Step 4: Run the state tests and verify GREEN**

Run:

```bash
node --test tests/chapter4-state.test.mjs
```

Expected: all Chapter 4 state tests pass.

- [ ] **Step 5: Commit the state model**

```bash
git add chapter4/chapter4.js tests/chapter4-state.test.mjs
git commit -m "feat: add chapter four investigation state"
```

### Task 2: Shared Chapter Skin and Delayed-Message Entry

**Files:**
- Create: `chapter4/chapter4.css`
- Create: `chapter4/index.html`
- Create: `tests/chapter4-content.test.mjs`

- [ ] **Step 1: Write failing entry-page contracts**

Require:

```js
const pages = [
  "index.html",
  "portal.html",
  "notices.html",
  "hearing.html",
  "operation.html",
  "execute.html",
  "end.html"
];

test("chapter four entry supports immediate reveal and reduced motion", async () => {
  const html = await read("index.html");
  assert.match(html, /id="reveal-all"/);
  assert.match(html, /立即显示全部/);
  assert.match(html, /function finishConversation\(\)/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /href="portal\.html"/);
});

test("chapter four pages load shared chapter assets and expose one objective", async () => {
  for (const page of pages) {
    const html = await read(page);
    assert.match(html, /href="\.\.\/series\/series\.css"/);
    assert.match(html, /src="\.\.\/series\/series\.js"/);
    assert.match(html, /href="chapter4\.css"/);
    assert.match(html, /data-chapter="4"/);
    assert.match(html, /data-objective="[^"]+"/);
  }
});
```

Initially limit the first test to `index.html`; add all-page assertions after later pages exist.

- [ ] **Step 2: Run the content test and verify RED**

Run:

```bash
node --test tests/chapter4-content.test.mjs
```

Expected: failure because the entry page and stylesheet do not exist.

- [ ] **Step 3: Implement the shared skin**

Create semantic primitives for:

- `.chapter-shell` with max width `1120px` and responsive `16px` gutters.
- `.reading-column` capped near `720px`.
- `.evidence-grid`, `.evidence-card`, `.data-scroll`, `.form-stack`.
- `.action`, `.action.primary`, `.status[data-state="success"]`, `.status[data-state="error"]`.
- Light government, paper archive, and dark operations themes selected through body classes.
- `min-height: 44px` for interactive controls.
- Reduced-motion rules that remove nonessential animation.

- [ ] **Step 4: Implement the entry page**

Use the existing Chapter 2/3 deterministic conversation renderer:

- Store `timer`, `typing`, and `pending`.
- `finishConversation()` clears timers and renders the pending plus remaining messages exactly once.
- Add the local link to `portal.html`.
- Use `data-objective="核验鹿原记忆健康试点的自愿者名单"`.

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run:

```bash
node --test tests/chapter4-content.test.mjs
```

Expected: entry contracts pass.

- [ ] **Step 6: Commit the entry experience**

```bash
git add chapter4/index.html chapter4/chapter4.css tests/chapter4-content.test.mjs
git commit -m "feat: add luyuan chapter entry"
```

### Task 3: Act One Government Portal Puzzles

**Files:**
- Create: `chapter4/portal.html`
- Create: `chapter4/notices.html`
- Modify: `tests/chapter4-content.test.mjs`

- [ ] **Step 1: Add failing portal and notice contracts**

Require portal evidence and behavior:

```js
assert.match(portal, /平台开放时间：2024-04-03/);
assert.match(portal, /东七码头/);
assert.match(portal, /预约编号前缀/);
assert.match(portal, /volunteersVerified/);
assert.match(portal, /所谓自愿并不成立/);
assert.match(portal, /提示 1|第一层提示/);
assert.match(portal, /href="notices\.html"/);
```

Require notice reconstruction:

```js
assert.match(notices, /网页版公示/);
assert.match(notices, /打印版/);
assert.match(notices, /无障碍朗读文本/);
assert.match(notices, /LY-MH-04/);
assert.match(notices, /batchRecovered/);
assert.match(notices, /href="hearing\.html"/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/chapter4-content.test.mjs
```

Expected: failures for missing portal and notice pages.

- [ ] **Step 3: Implement `portal.html`**

Render:

- A public list with enough normal rows and three representative abnormal rows.
- A street-code reference showing that East Seventh Wharf does not use `07`.
- A platform opening date of April 3 while abnormal receipts predate it.
- A conclusion form with three radio choices.
- A three-level hint control that reveals one method hint at a time.

On the correct conclusion:

```js
let state = loadChapter4State();
state = completeChapter4Step(state, "volunteersVerified");
saveChapter4State(state);
```

Show one primary link to `notices.html`. On direct access after completion, preserve the success result.

- [ ] **Step 4: Implement `notices.html`**

If `volunteersVerified` is missing, show a prerequisite panel linking to `portal.html`.

Present three visibly distinct representations of the notice. Normalize the submitted batch using uppercase and hyphens. Accept only `LY-MH-04`, persist `batchRecovered`, and show one primary link to `hearing.html`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/chapter4-content.test.mjs tests/chapter4-state.test.mjs
```

Expected: all focused tests pass.

- [ ] **Step 6: Commit Act One**

```bash
git add chapter4/portal.html chapter4/notices.html tests/chapter4-content.test.mjs
git commit -m "feat: add luyuan government evidence puzzles"
```

### Task 4: Hearing Reconstruction

**Files:**
- Create: `chapter4/hearing.html`
- Modify: `tests/chapter4-content.test.mjs`

- [ ] **Step 1: Add failing hearing contracts**

Require:

```js
assert.match(html, /座次图/);
assert.match(html, /麦克风编号/);
assert.match(html, /门禁记录/);
assert.match(html, /新闻稿发布时间/);
assert.match(html, /data-scroll/);
assert.match(html, /hearingExposed/);
assert.match(html, /WHITE-TOWER/);
assert.match(html, /B2 声纹室/);
assert.match(html, /href="operation\.html"/);
```

Also require the three contradictions:

- Representative 2 enters after their recorded statement.
- Representatives 1 and 3 share the same unusual typo.
- The official release predates the hearing conclusion.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/chapter4-content.test.mjs
```

Expected: hearing contracts fail because the page is missing.

- [ ] **Step 3: Implement the hearing page**

Guard access on `batchRecovered`. Use:

- A visible 2x2 seating diagram with microphone IDs.
- A horizontally scrollable event table.
- Three testimony cards.
- A conclusion form that asks both the actual seat mapping and causal conclusion.

Only the fully supported combination records `hearingExposed`. The success panel explains B2, `WHITE-TOWER`, and links only to `operation.html`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/chapter4-content.test.mjs tests/chapter4-state.test.mjs
```

Expected: all focused tests pass.

- [ ] **Step 5: Commit the hearing reconstruction**

```bash
git add chapter4/hearing.html tests/chapter4-content.test.mjs
git commit -m "feat: add forged hearing reconstruction"
```

### Task 5: Dual Preparation and Ending Execution

**Files:**
- Create: `chapter4/operation.html`
- Create: `chapter4/execute.html`
- Create: `chapter4/end.html`
- Modify: `tests/chapter4-content.test.mjs`
- Modify: `tests/chapter4-state.test.mjs`

- [ ] **Step 1: Add failing operation and ending contracts**

Require the evidence options and correct set:

```js
assert.match(operation, /异常自愿者名单/);
assert.match(operation, /伪造听证证明/);
assert.match(operation, /WHITE-TOWER 上级授权记录/);
assert.match(operation, /mirrorReady/);
```

Require route evidence:

```js
assert.match(operation, /西侧档案通道/);
assert.match(operation, /04:10/);
assert.match(operation, /04:17/);
assert.match(operation, /rescueReady/);
```

Require execution and endings:

```js
assert.match(execute, /resolveChapter4Ending/);
assert.match(execute, /04:17/);
assert.match(execute, /缺失的准备/);
assert.match(end, /鹿原篇完成/);
assert.match(end, /WHITE-TOWER/);
assert.match(end, /林知秋/);
assert.doesNotMatch(end, /chapter5|第五章入口/);
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/chapter4-content.test.mjs tests/chapter4-state.test.mjs
```

Expected: missing operation, execution, and ending pages.

- [ ] **Step 3: Implement `operation.html`**

Guard access on `hearingExposed`.

Mirror form:

- Use six checkboxes.
- Compare the selected values as a set against `volunteers`, `hearing`, and `white-tower`.
- Record `mirrorReady` only for the exact sufficient set.

Rescue form:

- Use explicit selects or radios for entry route, avoided event, and entry time.
- Accept only west archive passage, avoiding 04:10 transfer, entering at 04:17.
- Record `rescueReady`.

Render both statuses after every submit. Show the execution link when at least one line is ready so partial endings remain intentionally reachable; visually mark that both are needed for the coordinated result.

- [ ] **Step 4: Implement `execute.html`**

Guard access when neither line is ready and link back to `operation.html`.

On submit:

```js
const ending = resolveChapter4Ending(state, input.value);
if (!ending) {
  status.dataset.state = "error";
  status.textContent = "这个时间无法形成同步窗口。重新核对供电与转运记录。";
  return;
}
saveChapter4State({
  ...state,
  executionTime: "04:17",
  ending
});
location.href = `end.html?ending=${ending}`;
```

- [ ] **Step 5: Implement `end.html`**

Read the stored ending and query parameter, but trust only known endings that match available state.

- `exposure`: evidence survives; Lin is transferred.
- `rescue`: Lin is rescued; approval archive is destroyed.
- `coordinated`: Lin is rescued, the Luyuan pilot stops, the complete evidence mirror survives, and White Tower is revealed.

All variants provide a “重新布置行动” link to `operation.html`. Only the coordinated variant displays “鹿原篇完成”. No fifth-chapter link is present.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run:

```bash
node --test tests/chapter4-state.test.mjs tests/chapter4-content.test.mjs
```

Expected: all Chapter 4 tests pass.

- [ ] **Step 7: Commit the finale**

```bash
git add chapter4/operation.html chapter4/execute.html chapter4/end.html tests/chapter4-state.test.mjs tests/chapter4-content.test.mjs
git commit -m "feat: add luyuan coordinated finale"
```

### Task 6: Chapter Continuity, Build, and Publication

**Files:**
- Modify: `chapter3/end.html`
- Modify: `scripts/build.mjs`
- Modify: `tests/chapter-continuity.test.mjs`
- Modify: `tests/build.test.mjs`
- Modify: `tests/smoke.test.mjs`

- [ ] **Step 1: Add failing continuity and build tests**

Extend orientation coverage to all seven Chapter 4 pages. Require:

```js
assert.match(chapter3End, /href="\.\.\/chapter4\/index\.html"/);
assert.doesNotMatch(chapter3End, /第四章《鹿原 · 为你好》，待续/);
```

Require all Chapter 4 pages plus `chapter4.js` and `chapter4.css` in `dist`. Add their URLs to smoke tests.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
node --test tests/chapter-continuity.test.mjs tests/build.test.mjs tests/smoke.test.mjs
```

Expected: failures for the missing build copy and old Chapter 3 ending.

- [ ] **Step 3: Connect and build Chapter 4**

Change the build copy loop to:

```js
for (const directory of ["chapter2", "chapter3", "chapter4", "series"]) {
```

Update the build log to mention Chapters 2-4. Replace the Chapter 3 ending’s “to be continued” text with a local entry button to `../chapter4/index.html`.

- [ ] **Step 4: Run a clean full verification**

Run:

```bash
rm -rf dist
npm run build
npm test
git diff --check
```

Expected: zero failures and a clean whitespace check.

- [ ] **Step 5: Verify the full journey in the in-app browser**

Serve `dist`, then verify:

1. Chapter 3 ending opens Chapter 4.
2. Entry conversation can reveal immediately.
3. Correct portal conclusion persists after reload.
4. Batch, hearing, mirror, and rescue progress persist.
5. `04:17` with both lines reaches the coordinated ending.
6. Partial preparation reaches the matching partial ending.
7. Mobile viewport has no main-content horizontal overflow.
8. Browser console has no application errors.

- [ ] **Step 6: Commit, push, and publish**

Commit all remaining scoped files:

```bash
git add chapter3/end.html chapter4 scripts/build.mjs tests
git commit -m "feat: publish luyuan stage finale"
git push -u origin codex/chapter4-luyuan
```

Publish through the repository’s history-preserving GitHub API script, wait for the GitHub Pages workflow, and verify the deployment status references the new `main` snapshot.
