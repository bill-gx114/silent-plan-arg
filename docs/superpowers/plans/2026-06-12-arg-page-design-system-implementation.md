# ARG Page Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved ARG page design system to all 21 first-chapter pages while preserving every puzzle rule, URL, asset, and site identity.

**Architecture:** Expand `src/shared/base.css` into the structural design-system layer containing tokens, containers, five page templates, shared components, responsive behavior, and accessibility states. Keep `blog.css`, `corporate.css`, and `archive.css` as skin layers, then migrate each HTML page to exactly one semantic template with standard page headers, section stacks, form groups, action groups, status regions, and scrollable data containers.

**Tech Stack:** Static HTML, CSS custom properties, browser ES modules, Node.js built-in test runner, in-app browser verification, GitHub Pages.

---

## File Structure

### Shared contract

- Modify: `src/shared/base.css`
  - Own all spacing, width, radius, control-height, layout, template, shared component, focus, and responsive rules.
- Create: `tests/design-system.test.mjs`
  - Validate the shared CSS contract, exact page-template mapping, heading structure, table wrappers, form structure, and responsive/accessibility rules.

### Blog skin and pages

- Modify: `src/blog/blog.css`
- Modify: `src/blog/index.html`
- Modify: `src/blog/blog.html`
- Modify: `src/blog/report.html`
- Modify: `src/blog/revision.html`
- Modify: `src/blog/attachments.html`
- Modify: `src/blog/photo-lab.html`
- Modify: `src/blog/case-notebook.html`
- Modify: `src/blog/dead-switch.html`

### Corporate skin and pages

- Modify: `src/corporate/corporate.css`
- Modify: `src/corporate/index.html`
- Modify: `src/corporate/products.html`
- Modify: `src/corporate/team.html`
- Modify: `src/corporate/archive.html`
- Modify: `src/corporate/diff.html`
- Modify: `src/corporate/directory.html`
- Modify: `src/corporate/request-log.html`

### Archive skin and pages

- Modify: `src/archive/archive.css`
- Modify: `src/archive/index.html`
- Modify: `src/archive/tree.html`
- Modify: `src/archive/package.html`
- Modify: `src/archive/forensics.html`
- Modify: `src/archive/integrity.html`
- Modify: `src/archive/switch-console.html`

No JavaScript or evidence asset changes are planned. Existing DOM ids, form values, data attributes, href values, download attributes, and script blocks must remain behaviorally unchanged.

---

### Task 1: Establish the Shared Design-System Contract

**Files:**
- Create: `tests/design-system.test.mjs`
- Modify: `src/shared/base.css`

- [ ] **Step 1: Write the failing CSS contract tests**

Create `tests/design-system.test.mjs` with the shared stylesheet assertions:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const baseCssUrl = new URL("../src/shared/base.css", import.meta.url);

test("shared CSS exposes the approved spacing and width tokens", async () => {
  const css = await readFile(baseCssUrl, "utf8");
  for (const declaration of [
    "--space-1: 4px",
    "--space-2: 8px",
    "--space-3: 12px",
    "--space-4: 16px",
    "--space-5: 24px",
    "--space-6: 32px",
    "--space-7: 40px",
    "--space-8: 48px",
    "--space-9: 64px",
    "--width-reading: 720px",
    "--width-standard: 1040px",
    "--width-data: 1120px",
    "--width-verify: 640px",
    "--control-height: 44px"
  ]) {
    assert.match(css, new RegExp(declaration.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("shared CSS defines all templates and structural components", async () => {
  const css = await readFile(baseCssUrl, "utf8");
  for (const selector of [
    ".page--reading",
    ".page--workspace",
    ".page--records",
    ".page--verify",
    ".page--decision",
    ".page-header",
    ".page-intro",
    ".section-stack",
    ".workspace-grid",
    ".field-group",
    ".form-stack",
    ".form-grid",
    ".form-actions",
    ".data-scroll",
    ".status",
    ".evidence"
  ]) {
    assert.match(css, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
```

- [ ] **Step 2: Run the new tests and verify RED**

Run:

```bash
node --test tests/design-system.test.mjs
```

Expected: both tests fail because the approved tokens and template selectors do not yet exist.

- [ ] **Step 3: Replace the shared token and primitive section**

Refactor the top of `src/shared/base.css` so `:root` contains the existing semantic colors plus this contract:

```css
:root {
  color-scheme: dark;
  --bg: #07090c;
  --panel: #11161d;
  --panel-2: #171e27;
  --line: #28313d;
  --ink: #e5e9ef;
  --muted: #8a95a3;
  --accent: #77d7c8;
  --danger: #d76d6d;
  --warn: #d9a45f;
  --success: #69c98a;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;
  --space-9: 64px;

  --width-reading: 720px;
  --width-standard: 1040px;
  --width-data: 1120px;
  --width-verify: 640px;
  --control-height: 44px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --shadow-panel: 0 18px 48px rgba(0, 0, 0, .18);
}
```

Preserve the existing global color values so the initial migration does not alter site identity before the skin tasks.

- [ ] **Step 4: Implement the shared containers and five templates**

Add the following structural rules to `src/shared/base.css`, replacing the old `.shell`, `.panel`, `.grid`, `.actions`, form, and mobile rules rather than duplicating them:

```css
.page {
  width: min(var(--page-width, var(--width-standard)), calc(100% - 64px));
  margin-inline: auto;
  padding-block: var(--space-6) var(--space-9);
}

.page--reading { --page-width: var(--width-reading); }
.page--workspace,
.page--records { --page-width: var(--width-data); }
.page--verify { --page-width: var(--width-verify); }
.page--decision { --page-width: var(--width-reading); }
.page.page--marketing {
  width: 100%;
  max-width: none;
  padding: 0 0 var(--space-9);
}

.marketing-content {
  width: min(var(--width-standard), calc(100% - 64px));
  margin-inline: auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--line);
}

.page-intro {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-7);
  max-width: 65ch;
}

.page-intro > * { margin: 0; }
.page-intro h1,
.page-title {
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  line-height: 1.08;
  letter-spacing: -.035em;
}

.section-stack {
  display: grid;
  gap: var(--space-6);
  margin-top: var(--space-6);
}

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr);
  gap: var(--space-5);
  align-items: start;
}

.panel {
  margin: 0;
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(17, 22, 29, .92);
  box-shadow: var(--shadow-panel);
}

.card {
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
}

.field-group {
  display: grid;
  gap: var(--space-2);
}

form,
.form-stack {
  display: grid;
  gap: var(--space-5);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-5);
}

.form-actions,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
}

.data-scroll {
  width: 100%;
  overflow-x: auto;
  border-radius: var(--radius-sm);
}

.status {
  min-height: 3.4em;
  margin: 0;
  color: var(--warn);
}

.evidence {
  border-left: 3px solid var(--accent);
  padding-left: var(--space-4);
}
```

- [ ] **Step 5: Normalize controls, headings, tables, and focus**

Add or replace shared component rules:

```css
h1, h2, h3, p { margin-top: 0; }
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }

button,
input,
select,
textarea {
  min-height: var(--control-height);
  font: inherit;
}

button,
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  text-decoration: none;
}

button.primary,
.button.primary {
  background: var(--accent);
  color: #07110f;
  font-weight: 700;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  background: #090d12;
  color: var(--ink);
}

a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

table { width: 100%; border-collapse: collapse; }
th, td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--line);
  text-align: left;
  vertical-align: top;
}
th { color: var(--muted); font-weight: 700; }
```

- [ ] **Step 6: Add the base responsive rules**

Add:

```css
@media (max-width: 760px) {
  .page {
    width: min(100% - 36px, var(--page-width, var(--width-standard)));
    padding-top: var(--space-5);
  }

  .page.page--marketing { width: 100%; padding-top: 0; }
  .marketing-content { width: calc(100% - 36px); }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .workspace-grid,
  .form-grid,
  .grid,
  .cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .page { width: min(100% - 32px, var(--page-width)); }
  .panel { padding: var(--space-4); }
  .form-actions,
  .actions { align-items: stretch; flex-direction: column; }
  .form-actions > *,
  .actions > * { width: 100%; }
}
```

- [ ] **Step 7: Run the contract tests and full suite**

Run:

```bash
node --test tests/design-system.test.mjs
npm run build
npm test
```

Expected: design-system CSS tests pass; the existing 56 tests still pass.

- [ ] **Step 8: Commit the shared foundation**

```bash
git add src/shared/base.css tests/design-system.test.mjs
git commit -m "feat: add shared ARG layout system"
```

---

### Task 2: Migrate the Eight Blog Pages

**Files:**
- Modify: `tests/design-system.test.mjs`
- Modify: `src/blog/blog.css`
- Modify: `src/blog/index.html`
- Modify: `src/blog/blog.html`
- Modify: `src/blog/report.html`
- Modify: `src/blog/revision.html`
- Modify: `src/blog/attachments.html`
- Modify: `src/blog/photo-lab.html`
- Modify: `src/blog/case-notebook.html`
- Modify: `src/blog/dead-switch.html`

- [ ] **Step 1: Add failing blog template tests**

Append to `tests/design-system.test.mjs`:

```js
const templateMaps = {
  blog: {
    "index.html": "page--reading",
    "blog.html": "page--reading",
    "report.html": "page--reading",
    "revision.html": "page--workspace",
    "attachments.html": "page--records",
    "photo-lab.html": "page--workspace",
    "case-notebook.html": "page--decision",
    "dead-switch.html": "page--decision"
  }
};

async function readSitePage(site, page) {
  return readFile(new URL(`../src/${site}/${page}`, import.meta.url), "utf8");
}

test("all blog pages use their approved semantic template", async () => {
  for (const [page, template] of Object.entries(templateMaps.blog)) {
    const html = await readSitePage("blog", page);
    assert.match(html, new RegExp(`<main[^>]+class="[^"]*\\bpage\\b[^"]*\\b${template}\\b`), page);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, page);
  }
});

test("blog tables and forms use shared structural wrappers", async () => {
  const attachments = await readSitePage("blog", "attachments.html");
  assert.match(attachments, /class="data-scroll"/);

  for (const page of ["revision.html", "photo-lab.html", "case-notebook.html"]) {
    const html = await readSitePage("blog", page);
    assert.match(html, /class="field-group"/, page);
    assert.match(html, /class="form-actions"/, page);
    assert.match(html, /class="status"/, page);
  }
});
```

- [ ] **Step 2: Run the blog tests and verify RED**

Run:

```bash
node --test --test-name-pattern="blog" tests/design-system.test.mjs
```

Expected: failures show the old `.shell`, `.phone`, `.grid`, and unwrapped form/table structures.

- [ ] **Step 3: Refactor the blog skin to theme variables**

In `src/blog/blog.css`:

1. Keep the current paper palette.
2. Move page width and generic panel spacing out of this file.
3. Define paper theme variables on `.paper`:

```css
.paper {
  --bg: var(--paper);
  --ink: var(--paper-ink);
  --muted: var(--paper-muted);
  --panel: #f6f0e7;
  --panel-2: #fffaf2;
  --line: #cfc2b3;
  --accent: #7d332a;
  background: var(--paper);
  color: var(--paper-ink);
}
```

4. Keep `.phone`, `.chat`, `.bubble`, `.revision-row`, `.lab-photo`, `.notebook-grid`, and `.fragment-chip` as blog-only components.
5. Replace hardcoded layout gaps with `var(--space-*)`.
6. Ensure `.article` keeps at least `1.8` line height and paragraphs use `1.2em` spacing.

- [ ] **Step 4: Migrate narrative blog pages**

Apply these main classes without changing links or scripts:

```html
<!-- src/blog/index.html -->
<main class="page page--reading message-layout">

<!-- src/blog/blog.html -->
<main class="page page--reading">

<!-- src/blog/report.html -->
<main class="page page--reading article">
```

For `blog.html` and `report.html`, wrap their introductory title material in:

```html
<header class="page-intro">
  <!-- existing eyebrow/time, h1, and lead content -->
</header>
```

Keep the message-page phone presentation as a site-specific component, but place it inside the shared reading page rather than letting the `<body>` own page padding.

- [ ] **Step 5: Migrate revision and photo workspaces**

Apply these exact wrapper classes while retaining the existing child content:

```html
<main class="page page--workspace">
  <div class="section-stack">
  </div>
</main>
```

For `revision.html`:

- Give the version comparison `class="revision-row workspace-material"`.
- Change the submit form opening tag to `<form id="revision-form" class="form-grid">`.
- Keep the submit form id and all input ids unchanged.
- Wrap each label/control pair with `class="field-group"`.
- Wrap the button and status paragraph in `class="form-actions"`, while the status retains `class="status"`.

For `photo-lab.html`:

- Replace the outer `section.grid` with `section.workspace-grid`.
- Keep the photo/material panel first and the analysis panel second.
- Change the form opening tag to `<form id="photo-form" class="form-stack">`.
- Add `field-group` to both range labels and the evidence select label.
- Wrap submit button and `#status` in `form-actions`.
- Place the memo button and hint in a separate secondary action group below the form.

- [ ] **Step 6: Migrate attachments, notebook, and ending pages**

For `attachments.html`, apply these exact classes to the existing structural elements:

```html
<main class="page page--records">
  <div class="section-stack">
    <section class="panel">
      <div class="data-scroll">
      </div>
    </section>
  </div>
</main>
```

For `case-notebook.html`:

- Use `main.page.page--decision`.
- Keep `.notebook-grid` but increase its gap via tokens.
- Change both form opening tags to `class="form-stack"`.
- Add `field-group` around both inputs.
- Add `form-actions` around each submit button/status relationship.
- Preserve all ids used by the inline script.

For `dead-switch.html`:

- Use `main.page.page--decision`.
- Wrap eyebrow, `h1`, and dynamic content in a section stack.
- Keep `#title`, `#content`, `ending` query handling, and all generated HTML unchanged.

- [ ] **Step 7: Run blog and regression tests**

Run:

```bash
node --test --test-name-pattern="blog" tests/design-system.test.mjs
node --test tests/blog-content.test.mjs tests/endings.test.mjs
npm run build
```

Expected: all commands pass.

- [ ] **Step 8: Commit the blog migration**

```bash
git add tests/design-system.test.mjs src/blog
git commit -m "feat: migrate blog pages to shared templates"
```

---

### Task 3: Migrate the Seven Corporate Pages

**Files:**
- Modify: `tests/design-system.test.mjs`
- Modify: `src/corporate/corporate.css`
- Modify: `src/corporate/index.html`
- Modify: `src/corporate/products.html`
- Modify: `src/corporate/team.html`
- Modify: `src/corporate/archive.html`
- Modify: `src/corporate/diff.html`
- Modify: `src/corporate/directory.html`
- Modify: `src/corporate/request-log.html`

- [ ] **Step 1: Add failing corporate template tests**

Extend `templateMaps`:

```js
templateMaps.corporate = {
  "index.html": "page--marketing",
  "products.html": "page--records",
  "team.html": "page--records",
  "archive.html": "page--workspace",
  "diff.html": "page--workspace",
  "directory.html": "page--records",
  "request-log.html": "page--records"
};

test("all corporate pages use their approved semantic template", async () => {
  for (const [page, template] of Object.entries(templateMaps.corporate)) {
    const html = await readSitePage("corporate", page);
    assert.match(html, new RegExp(`<main[^>]+class="[^"]*\\bpage\\b[^"]*\\b${template}\\b`), page);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, page);
  }
});

test("corporate data pages wrap tables and forms", async () => {
  for (const page of ["diff.html", "directory.html", "request-log.html"]) {
    const html = await readSitePage("corporate", page);
    assert.match(html, /class="data-scroll"/, page);
  }
  for (const page of ["diff.html", "request-log.html"]) {
    const html = await readSitePage("corporate", page);
    assert.match(html, /class="form-actions"/, page);
    assert.match(html, /class="status"/, page);
  }
});
```

- [ ] **Step 2: Run corporate tests and verify RED**

Run:

```bash
node --test --test-name-pattern="corporate" tests/design-system.test.mjs
```

Expected: all corporate page-template checks fail on `.corp-section`, `.archive-shell`, and the old raw table/form structures.

- [ ] **Step 3: Refactor the corporate skin**

In `src/corporate/corporate.css`:

- Preserve `--corp-blue`, dark blue background, `.corp-nav`, `.corp-hero`, `.snapshot`, `.diff-table`, and `.terminal`.
- Remove `.archive-shell` width/margin ownership and `.corp-section` width ownership.
- Convert `.corp-section` into a spacing/content helper only.
- Set shared semantic variables on `body`:

```css
body {
  --bg: #07111b;
  --panel: #0c1721;
  --panel-2: #101f2c;
  --line: #254056;
  --ink: #e5eef5;
  --muted: #9bb0bf;
  --accent: var(--corp-blue);
  background: linear-gradient(145deg, #07111b, #0b1824 55%, #061018);
}
```

- Replace arbitrary gaps and padding with approved tokens.
- Keep the sticky navigation outside the standard page container.

- [ ] **Step 4: Migrate the marketing and record pages**

For `corporate/index.html`:

- Keep `.corp-nav` and `.corp-hero`.
- Change the existing main opening tag to `<main class="page page--marketing">`.
- Keep `.corp-hero` as the first child so it remains full width.
- Wrap the existing cards and archive invitation in `<div class="marketing-content section-stack">`.
- Keep the existing `h1` inside Hero as the page's only `h1`.

For `products.html` and `team.html`, apply these exact classes to the existing main and card container elements:

```html
<main class="page page--records">
  <section class="cards">
  </section>
</main>
```

Add an `h1` if the current page only has card-level `h2` headings. The new `h1` must describe the existing content without changing story facts:

- Products: `技术与产品档案`
- Team: `当前团队`

- [ ] **Step 5: Migrate archive and diff workspaces**

For `archive.html`:

- Use `main.page.page--workspace`.
- Add `page-header`, `page-intro`, and `section-stack`.
- Keep snapshot button data attributes and snapshot section data attributes unchanged.

For `diff.html`:

- Use `main.page.page--workspace`.
- Wrap `.diff-table` with `.data-scroll`.
- Change the form opening tag to `<form id="diff-form" class="form-stack">`.
- Wrap each radio label in a `.field-group choice-field`.
- Wrap submit button and `#status` in `.form-actions`.
- Preserve radio names and values.

- [ ] **Step 6: Migrate directory and request-log records**

For `directory.html`:

- Use `main.page.page--records`.
- Add standard header and intro.
- Wrap the table in `.data-scroll`.
- Keep the evidence panel in the following section-stack item.

For `request-log.html`:

- Use `main.page.page--records`.
- Put filter buttons in `.actions record-filters`.
- Keep the terminal wrapper but place `.data-scroll` around its table.
- Change the form opening tag to `<form id="path-form" class="form-stack">`.
- Add `field-group` around the path input.
- Wrap submit button and `#status` in `.form-actions`.
- Preserve `data-filter`, row classes, ids, and module script.

- [ ] **Step 7: Run corporate and regression tests**

Run:

```bash
node --test --test-name-pattern="corporate" tests/design-system.test.mjs
node --test tests/corporate-content.test.mjs
npm run build
```

Expected: all commands pass.

- [ ] **Step 8: Commit the corporate migration**

```bash
git add tests/design-system.test.mjs src/corporate
git commit -m "feat: migrate corporate pages to shared templates"
```

---

### Task 4: Migrate the Six Archive Pages

**Files:**
- Modify: `tests/design-system.test.mjs`
- Modify: `src/archive/archive.css`
- Modify: `src/archive/index.html`
- Modify: `src/archive/tree.html`
- Modify: `src/archive/package.html`
- Modify: `src/archive/forensics.html`
- Modify: `src/archive/integrity.html`
- Modify: `src/archive/switch-console.html`

- [ ] **Step 1: Add failing archive template tests**

Extend `templateMaps`:

```js
templateMaps.archive = {
  "index.html": "page--verify",
  "tree.html": "page--records",
  "package.html": "page--records",
  "forensics.html": "page--workspace",
  "integrity.html": "page--verify",
  "switch-console.html": "page--decision"
};

test("all archive pages use their approved semantic template", async () => {
  for (const [page, template] of Object.entries(templateMaps.archive)) {
    const html = await readSitePage("archive", page);
    assert.match(html, new RegExp(`<main[^>]+class="[^"]*\\bpage\\b[^"]*\\b${template}\\b`), page);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, page);
  }
});

test("archive verification pages use shared form and status structure", async () => {
  const index = await readSitePage("archive", "index.html");
  assert.match(index, /class="field-group"/);
  assert.match(index, /class="form-actions"/);
  assert.match(index, /class="status"/);

  const integrity = await readSitePage("archive", "integrity.html");
  assert.match(integrity, /class="form-actions"/);
  assert.match(integrity, /class="status"/);
});
```

- [ ] **Step 2: Run archive tests and verify RED**

Run:

```bash
node --test --test-name-pattern="archive" tests/design-system.test.mjs
```

Expected: failures identify `.terminal-shell` and missing shared form/action structure.

- [ ] **Step 3: Refactor the archive skin**

In `src/archive/archive.css`:

- Preserve the near-black background, term colors, `.tree`, `.hex`, `.wave`, `.channel-grid`, `.record`, `.hash`, and `.console-line`.
- Remove `.terminal-shell` width and padding ownership.
- Set semantic variables:

```css
body {
  --bg: #020504;
  --panel: #050b08;
  --panel-2: #07110b;
  --line: #173823;
  --ink: #cde8d5;
  --muted: #6e9c7b;
  --accent: var(--term);
  --success: var(--term);
  background: #020504;
  color: var(--ink);
}
```

- Use system sans-serif for explanatory paragraphs and labels, while retaining monospace for headings, paths, hashes, logs, `.hex`, and `.tree`.
- Replace component gaps with spacing tokens.

- [ ] **Step 4: Migrate path entry and tree pages**

For `archive/index.html`, replace the current `<main>` and form opening tags and retain the existing label text, input, button, status id, and script:

```html
<main class="page page--verify">
  <div class="section-stack">
    <form id="path-form" class="panel form-stack">
      <div class="form-actions">
        <button class="primary" type="submit">挂载路径</button>
        <p id="status" class="status"></p>
      </div>
    </form>
  </div>
</main>
```

For `tree.html`:

- Use `main.page.page--records`.
- Add `page-intro` around eyebrow, crumb, and `h1`.
- Place denied and tree panels in `section-stack`.
- Preserve `#denied`, `#tree-panel`, query parsing, and links.

- [ ] **Step 5: Migrate package and forensics pages**

For `package.html`:

- Use `main.page.page--records`.
- Put breadcrumb and heading in `page-intro`.
- Place metadata/file-header panel and download panel in `section-stack`.
- Keep both `.pkg` and `.wav` download attributes unchanged.

For `forensics.html`:

- Use `main.page.page--workspace`.
- Add standard page header and intro.
- Place the waveform in a material panel.
- Keep `.channel-grid` as a site component inside the shared section stack.
- Put transcript and integrity links in an `.actions` group.
- Keep play button ids and inline script unchanged.

- [ ] **Step 6: Migrate integrity and switch-console pages**

For `integrity.html`:

- Use `main.page.page--verify`.
- Keep the upload chain as the first panel.
- Treat the verify button, current hash, `#status`, and `#next` as one verification panel.
- Wrap the button in `.form-actions`; keep `#status.status` outside the action row but within the same panel to preserve two-line feedback height.

For `switch-console.html`:

- Use `main.page.page--decision`.
- Add `page-intro`.
- Place log and evidence panels in `section-stack`.
- Keep all log text, evidence fragment, token, ids, and module script unchanged.

- [ ] **Step 7: Run archive and regression tests**

Run:

```bash
node --test --test-name-pattern="archive" tests/design-system.test.mjs
node --test tests/archive-content.test.mjs tests/assets.test.mjs
npm run build
```

Expected: all commands pass.

- [ ] **Step 8: Commit the archive migration**

```bash
git add tests/design-system.test.mjs src/archive
git commit -m "feat: migrate archive pages to shared templates"
```

---

### Task 5: Enforce Cross-Site Structure and Accessibility

**Files:**
- Modify: `tests/design-system.test.mjs`
- Modify: `tests/accessibility.test.mjs`
- Modify: `src/shared/base.css`
- Modify: `src/blog/blog.css`
- Modify: `src/corporate/corporate.css`
- Modify: `src/archive/archive.css`

- [ ] **Step 1: Add failing all-page structural tests**

Append:

```js
const validTemplates = [
  "page--reading",
  "page--workspace",
  "page--records",
  "page--verify",
  "page--decision",
  "page--marketing"
];

test("all 21 pages declare exactly one semantic template", async () => {
  let total = 0;
  for (const [site, pages] of Object.entries(templateMaps)) {
    for (const page of Object.keys(pages)) {
      total += 1;
      const html = await readSitePage(site, page);
      const matches = validTemplates.filter((template) => html.includes(template));
      assert.deepEqual(matches, [pages[page]], `${site}/${page}`);
    }
  }
  assert.equal(total, 21);
});

test("all source tables are inside data-scroll containers", async () => {
  for (const [site, pages] of Object.entries(templateMaps)) {
    for (const page of Object.keys(pages)) {
      const html = await readSitePage(site, page);
      if (!/<table\b/i.test(html)) continue;
      const tables = [...html.matchAll(/<table\b/gi)].length;
      const wrappers = [...html.matchAll(/class="[^"]*\bdata-scroll\b[^"]*"/gi)].length;
      assert.ok(wrappers >= tables, `${site}/${page}`);
    }
  }
});

test("all source forms use standard fields and action groups", async () => {
  for (const [site, pages] of Object.entries(templateMaps)) {
    for (const page of Object.keys(pages)) {
      const html = await readSitePage(site, page);
      const forms = [...html.matchAll(/<form\b[\s\S]*?<\/form>/gi)].map((match) => match[0]);
      for (const form of forms) {
        assert.match(form, /<form[^>]+class="[^"]*\bform-(?:stack|grid)\b[^"]*"/i, `${site}/${page}`);
        assert.match(form, /class="[^"]*\bfield-group\b[^"]*"/i, `${site}/${page}`);
        assert.match(form, /class="[^"]*\bform-actions\b[^"]*"/i, `${site}/${page}`);
      }
      if (forms.length > 0) assert.match(html, /class="[^"]*\bstatus\b[^"]*"/i, `${site}/${page}`);
    }
  }
});

test("shared CSS includes reduced motion and mobile action rules", async () => {
  const css = await readFile(baseCssUrl, "utf8");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@media\s*\(max-width:\s*760px\)/);
  assert.match(css, /@media\s*\(max-width:\s*560px\)/);
  assert.match(css, /outline:\s*2px solid var\(--accent\)/);
});
```

Update `tests/accessibility.test.mjs`:

```js
test("every first-chapter page has exactly one h1", async () => {
  for (const site of ["blog", "corporate", "archive"]) {
    const directory = new URL(`../src/${site}/`, import.meta.url);
    const pages = (await readdir(directory)).filter((name) => name.endsWith(".html"));
    for (const page of pages) {
      const html = await readFile(new URL(page, directory), "utf8");
      assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${site}/${page}`);
    }
  }
});
```

- [ ] **Step 2: Run structural tests and verify RED**

Run:

```bash
node --test tests/design-system.test.mjs tests/accessibility.test.mjs
```

Expected: any missing wrapper, extra template string, missing `h1`, or absent reduced-motion rule fails explicitly.

- [ ] **Step 3: Add reduced-motion and robust mobile rules**

In `src/shared/base.css` add:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}

@media (max-width: 760px) {
  .data-scroll {
    margin-inline: calc(var(--space-4) * -1);
    width: calc(100% + var(--space-6));
    padding-inline: var(--space-4);
  }

  .page-intro h1,
  .page-title {
    font-size: clamp(1.875rem, 10vw, 2.75rem);
  }
}
```

Verify that site skin media queries only change site-specific elements and do not override shared control heights or page margins.

- [ ] **Step 4: Fix all failures found by the all-page contract**

Make only structural corrections indicated by the tests:

- Add missing `h1` headings.
- Remove accidental multiple template-class names.
- Add missing `.data-scroll` wrappers.
- Ensure every migrated form keeps a `.status` region.
- Keep all JavaScript selectors and puzzle values unchanged.

- [ ] **Step 5: Run complete automated verification**

Run:

```bash
npm run build
npm test
git diff --check
```

Expected:

- Build exits `0`.
- All previous 56 tests plus new design-system tests pass.
- `git diff --check` prints no errors.

- [ ] **Step 6: Commit cross-site enforcement**

```bash
git add src tests/design-system.test.mjs tests/accessibility.test.mjs
git commit -m "test: enforce ARG layout and accessibility rules"
```

---

### Task 6: Perform Browser Visual and Interaction Verification

**Files:**
- No planned source changes.
- Corrective changes, if proven necessary by a failed visual or interaction check, are limited to `src/shared/base.css`, the relevant site skin CSS, the relevant HTML page, and `tests/design-system.test.mjs`.

- [ ] **Step 1: Start the production-style static server**

Run:

```bash
npm run build
npm run serve
```

Expected:

```text
ARG server: http://127.0.0.1:4173/
```

- [ ] **Step 2: Verify the six representative desktop pages**

Using the in-app browser at `1280×720`, open:

```text
http://127.0.0.1:4173/blog/report.html
http://127.0.0.1:4173/blog/photo-lab.html
http://127.0.0.1:4173/corporate/request-log.html
http://127.0.0.1:4173/archive/integrity.html
http://127.0.0.1:4173/blog/case-notebook.html
http://127.0.0.1:4173/corporate/index.html
```

For each page verify:

- Header and title are separated by visible breathing room.
- Major sections are separated by `24–32px`.
- Primary action is visually identifiable.
- No table or path breaks the viewport.
- Blog, corporate, and archive skins remain visually distinct.
- Browser warning/error log is empty.

- [ ] **Step 3: Verify tablet and phone layouts**

Set viewport to `768×1024`, then `390×844`, and repeat the six pages.

Verify:

- Workspaces stack material before controls.
- Page side margins remain visible.
- Buttons and inputs are at least `44px` high.
- Action groups stack at phone width.
- Data tables scroll horizontally inside their container.
- No document-level horizontal overflow exists.

- [ ] **Step 4: Verify the affected interactions**

Complete these interaction checks:

1. `blog/photo-lab.html`
   - Set brightness above `75`.
   - Choose the exit-light answer.
   - Submit and verify `BLACKOUT` result appears.
2. `corporate/request-log.html`
   - Click both filters.
   - Submit `/legacy/CYM-071/DEL-1109/testimony.pkg`.
   - Verify mirror link appears.
3. `archive/integrity.html`
   - Calculate SHA-256.
   - Verify success status and switch-console link appear.
4. `blog/case-notebook.html`
   - Verify both forms accept input without layout jump.

- [ ] **Step 5: Fix only observed defects and rerun tests**

For each concrete visual defect:

1. Add a narrow regression assertion to `tests/design-system.test.mjs` when the defect is structurally testable.
2. Run that test and verify it fails.
3. Apply the smallest CSS/HTML correction.
4. Rerun:

```bash
npm run build
npm test
```

Expected: all tests pass after every correction.

- [ ] **Step 6: Stop the local server and commit verified polish**

Stop the foreground server with `Ctrl+C`, then:

```bash
git add src tests
git commit -m "fix: polish responsive ARG page layouts"
```

If verification required no corrections, do not create an empty commit.

---

### Task 7: Final Regression and GitHub Pages Publication

**Files:**
- Modify: `README.md`
- Use existing: `.github/workflows/pages.yml`
- Use existing: `scripts/publish-github-api.mjs`

- [ ] **Step 1: Add the design-system documentation link**

Add this section after the existing directory bullet list and before `## 游玩提示`:

```markdown
## Design documentation

- [ARG page design system](docs/superpowers/specs/2026-06-12-arg-page-design-system.md)
```

Do not link `docs/WALKTHROUGH.zh-CN.md` from the public README because it is a spoiler document.

- [ ] **Step 2: Run final local verification from a clean build**

Run:

```bash
rm -rf dist
npm run build
npm test
git diff --check
git status --short
```

Expected:

- Build succeeds.
- Every test passes.
- No whitespace errors.
- Only intentional tracked changes and the existing untracked local walkthrough are shown.

- [ ] **Step 3: Commit the documentation change**

```bash
git add README.md
git commit -m "docs: link ARG page design system"
```

- [ ] **Step 4: Publish tracked project files to GitHub**

Because direct Git transport is unreliable in this environment, use the existing Git Data API publisher:

```bash
node scripts/publish-github-api.mjs bill-gx114/silent-plan-arg
```

Expected: output reports all tracked files uploaded and returns a new remote commit SHA.

- [ ] **Step 5: Wait for GitHub Pages deployment**

Run:

```bash
run_id=$(gh run list \
  --repo bill-gx114/silent-plan-arg \
  --workflow pages.yml \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')
gh run watch "$run_id" \
  --repo bill-gx114/silent-plan-arg \
  --exit-status
```

Expected: both `build` and `deploy` jobs complete successfully.

- [ ] **Step 6: Verify the public representative pages**

Open the six representative URLs under:

```text
https://bill-gx114.github.io/silent-plan-arg/
```

Confirm:

- New spacing and templates are visible.
- The Pages deployment serves the latest remote commit.
- Core interactions still work.
- Browser error/warning logs are empty.

- [ ] **Step 7: Report completion**

Report:

- Shared design-system implementation.
- All 21 migrated pages.
- Automated test count and result.
- Desktop/tablet/mobile browser verification.
- GitHub repository URL.
- GitHub Pages URL.
- Any residual visual risks that require real player feedback.
