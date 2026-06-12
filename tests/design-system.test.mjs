import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rawCss = await readFile(new URL("../src/shared/base.css", import.meta.url), "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");
const rawBlogCss = await readFile(new URL("../src/blog/blog.css", import.meta.url), "utf8");
const blogCss = rawBlogCss.replace(/\/\*[\s\S]*?\*\//g, "");
const templateMaps = {
  blog: {
    "index.html": "page--reading",
    "blog.html": "page--reading",
    "report.html": "page--reading",
    "revision.html": "page--workspace",
    "attachments.html": "page--records",
    "photo-lab.html": "page--workspace",
    "case-notebook.html": "page--decision",
    "dead-switch.html": "page--decision",
  },
};

async function readBlogPage(file) {
  return readFile(new URL(`../src/blog/${file}`, import.meta.url), "utf8");
}

function classTokens(attributes) {
  const match = attributes.match(/\bclass\s*=\s*["']([^"']*)["']/i);
  return new Set(match?.[1].trim().split(/\s+/).filter(Boolean) ?? []);
}

function isDescendant(ancestor, node) {
  for (let current = node?.parent; current; current = current.parent) {
    if (current === ancestor) return true;
  }
  return false;
}

function parseAttributes(source) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of source.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function parseHtml(source) {
  const root = { tag: "#document", attributes: new Map(), children: [], parent: null };
  const stack = [root];
  const voidTags = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
  ]);
  const sanitized = source
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi, "<$1$2></$1>");
  const tags = /<(\/?)([a-z][\w:-]*)([^>]*)>/gi;

  for (const match of sanitized.matchAll(tags)) {
    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    if (closing) {
      while (stack.length > 1 && stack.at(-1).tag !== tag) stack.pop();
      if (stack.at(-1).tag === tag) stack.pop();
      continue;
    }

    const parent = stack.at(-1);
    const node = {
      tag,
      attributes: parseAttributes(match[3]),
      children: [],
      parent,
    };
    parent.children.push(node);

    const selfClosing = /\/\s*$/.test(match[3]);
    if (!selfClosing && !voidTags.has(tag)) stack.push(node);
  }

  return root;
}

function allElements(root, predicate) {
  const matches = [];
  const visit = (node) => {
    if (node.tag !== "#document" && predicate(node)) matches.push(node);
    for (const child of node.children) visit(child);
  };
  visit(root);
  return matches;
}

function hasClass(node, className) {
  return new Set((node.attributes.get("class") ?? "").split(/\s+/).filter(Boolean)).has(className);
}

function findOne(root, predicate, label) {
  const matches = allElements(root, predicate);
  assert.equal(matches.length, 1, `${label} count`);
  return matches[0];
}

function findById(root, id) {
  return findOne(root, (node) => node.attributes.get("id") === id, `#${id}`);
}

function findByClass(root, className) {
  return findOne(root, (node) => hasClass(node, className), `.${className}`);
}

function nearestAncestor(node, predicate) {
  for (let current = node?.parent; current; current = current.parent) {
    if (predicate(current)) return current;
  }
  return null;
}

function findSubmit(form) {
  return findOne(
    form,
    (node) => isDescendant(form, node) &&
      node.tag === "button" &&
      node.attributes.get("type") === "submit",
    `submit in #${form.attributes.get("id")}`,
  );
}

function assertInClassAncestor(node, className, label) {
  const ancestor = nearestAncestor(node, (candidate) => hasClass(candidate, className));
  assert.ok(ancestor, `${label} is inside .${className}`);
  return ancestor;
}

function collectStyleRules(source) {
  const rules = [];
  let cursor = 0;

  while (cursor < source.length) {
    const openingBrace = source.indexOf("{", cursor);
    if (openingBrace === -1) break;

    const prelude = source.slice(cursor, openingBrace).trim();
    const block = extractBlockRange(source, openingBrace, prelude || "CSS block");
    if (prelude.startsWith("@")) {
      rules.push(...collectStyleRules(block.body));
    } else if (prelude) {
      rules.push({
        selectors: prelude.split(",").map(normalizeSelector),
        body: block.body,
      });
    }
    cursor = block.endIndex;
  }

  return rules;
}

function numericLineHeight(body) {
  const values = declarations(body);
  const explicit = values.get("line-height");
  if (explicit) return Number.parseFloat(explicit);

  const shorthand = values.get("font") ?? "";
  const match = shorthand.match(/\/\s*(\d+(?:\.\d+)?)/);
  assert.ok(match, "font shorthand has a numeric line-height");
  return Number.parseFloat(match[1]);
}

function extractBlockRange(source, startIndex, label) {
  const openingBrace = source.indexOf("{", startIndex);
  assert.notEqual(openingBrace, -1, `${label} opening brace`);

  let depth = 1;
  for (let index = openingBrace + 1; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) {
      return {
        body: source.slice(openingBrace + 1, index),
        endIndex: index + 1,
      };
    }
  }

  assert.fail(`${label} closing brace`);
}

function extractBlock(source, startIndex, label) {
  return extractBlockRange(source, startIndex, label).body;
}

function normalizeSelector(selector) {
  return selector.trim().replace(/\s+/g, " ");
}

function extractRuleBody(source, selector) {
  const target = normalizeSelector(selector);
  const matches = [];
  let cursor = 0;

  while (cursor < source.length) {
    const openingBrace = source.indexOf("{", cursor);
    if (openingBrace === -1) break;

    const prelude = source.slice(cursor, openingBrace).trim();
    const block = extractBlockRange(source, openingBrace, prelude || selector);
    if (!prelude.startsWith("@") && normalizeSelector(prelude) === target) {
      matches.push(block.body);
    }
    cursor = block.endIndex;
  }

  assert.ok(matches.length, `${selector} rule`);
  return matches.at(-1);
}

function extractMediaBody(maxWidth) {
  const label = `@media (max-width: ${maxWidth}px)`;
  const matches = [
    ...css.matchAll(new RegExp(`@media\\s*\\(max-width:\\s*${maxWidth}px\\)\\s*\\{`, "g")),
  ];
  assert.ok(matches.length, `${label} rule`);
  return extractBlock(css, matches.at(-1).index, label);
}

function declarations(body) {
  return new Map(
    body
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf(":");
        assert.notEqual(separator, -1, `valid declaration: ${entry}`);
        return [entry.slice(0, separator).trim(), entry.slice(separator + 1).trim()];
      }),
  );
}

function assertDeclaration(body, property, value, label = property) {
  assert.equal(declarations(body).get(property), value, label);
}

function pxValue(body, property, variablesBody) {
  let value = declarations(body).get(property);
  const variable = /^var\((--[^)]+)\)$/.exec(value ?? "");
  if (variable) {
    assert.ok(variablesBody, `${property} variable source`);
    value = declarations(variablesBody).get(variable[1]);
  }
  assert.match(value ?? "", /^\d+(?:\.\d+)?px$/, `${property} pixel value`);
  return Number.parseFloat(value);
}

test("rule extraction ignores comments and resolves the final matching rule", () => {
  const sample = `
    /* .sample { width: 999px; } */
    .sample { width: 12px; }
    .sample { width: 24px; }
  `;

  assertDeclaration(extractRuleBody(sample.replace(/\/\*[\s\S]*?\*\//g, ""), ".sample"), "width", "24px");
});

test("shared design-system tokens live in :root", () => {
  const root = extractRuleBody(css, ":root");
  const tokens = {
    "--bg": "#07090c",
    "--panel": "#11161d",
    "--panel-2": "#171e27",
    "--success": "#69c98a",
    "--space-1": "4px",
    "--space-2": "8px",
    "--space-3": "12px",
    "--space-4": "16px",
    "--space-5": "24px",
    "--space-6": "32px",
    "--space-7": "40px",
    "--space-8": "48px",
    "--space-9": "64px",
    "--width-reading": "720px",
    "--width-standard": "1040px",
    "--width-data": "1120px",
    "--width-verify": "640px",
    "--control-height": "44px",
    "--radius-sm": "8px",
    "--radius-md": "12px",
    "--radius-lg": "18px",
    "--shadow-panel": "0 18px 48px rgba(0, 0, 0, .18)",
  };

  for (const [token, value] of Object.entries(tokens)) {
    assertDeclaration(root, token, value, token);
  }
  assert.doesNotMatch(root, /--color-/, "duplicate color aliases");
});

test("shared layouts use the reviewed dimensions", () => {
  const page = extractRuleBody(css, ".page");
  assertDeclaration(
    page,
    "width",
    "min(var(--page-width, var(--width-standard)), calc(100% - 64px))",
    ".page desktop gutter",
  );
  assertDeclaration(page, "padding-block", "var(--space-6) var(--space-9)");

  const dataPages = extractRuleBody(css, ".page--workspace,\n.page--records");
  assertDeclaration(dataPages, "--page-width", "var(--width-data)");

  const panel = extractRuleBody(css, ".panel");
  assertDeclaration(panel, "margin", "0");
  assertDeclaration(panel, "padding", "var(--space-5)");

  const status = extractRuleBody(css, ".status");
  assertDeclaration(status, "min-height", "3.4em");
  assertDeclaration(status, "margin", "0");
});

test("theme-aware surfaces consume semantic theme tokens", () => {
  assertDeclaration(extractRuleBody(css, ".panel"), "background", "var(--panel)");

  const textFields = extractRuleBody(
    css,
    'input:not([type="radio"]):not([type="checkbox"]):not([type="range"]),\ntextarea,\nselect',
  );
  assert.match(declarations(textFields).get("background"), /^var\(--(?:panel-2|field)\)$/);

  const evidence = extractRuleBody(css, ".evidence");
  assert.match(
    evidence,
    /background:\s*var\(--panel-2\);[\s\S]*background:\s*color-mix\(/,
    "evidence fallback precedes color-mix enhancement",
  );
});

test("special inputs keep intrinsic sizing and accessible targets", () => {
  assert.doesNotMatch(
    css,
    /(?:^|})\s*input\s*,\s*textarea\s*,\s*select\s*\{/m,
    "generic input selector must not style special inputs as text fields",
  );

  const binaryInputs = extractRuleBody(css, 'input[type="radio"],\ninput[type="checkbox"]');
  assertDeclaration(binaryInputs, "width", "auto");
  assertDeclaration(binaryInputs, "min-height", "0");
  assertDeclaration(binaryInputs, "padding", "0");

  const range = extractRuleBody(css, 'input[type="range"]');
  const root = extractRuleBody(css, ":root");
  assertDeclaration(range, "width", "100%");
  assert.ok(pxValue(range, "min-height", root) >= 44, "range minimum hit area");
  assertDeclaration(range, "padding", "0");

  const webkitTrack = extractRuleBody(css, 'input[type="range"]::-webkit-slider-runnable-track');
  assert.equal(pxValue(webkitTrack, "height"), 6, "WebKit visual track height");

  const mozTrack = extractRuleBody(css, 'input[type="range"]::-moz-range-track');
  assert.equal(pxValue(mozTrack, "height"), 6, "Firefox visual track height");

  const webkitThumb = extractRuleBody(css, 'input[type="range"]::-webkit-slider-thumb');
  assert.ok(pxValue(webkitThumb, "width") >= 24, "WebKit thumb width");
  assert.ok(pxValue(webkitThumb, "height") >= 24, "WebKit thumb height");
  assertDeclaration(webkitThumb, "margin-top", "-9px", "WebKit thumb track centering");

  const mozThumb = extractRuleBody(css, 'input[type="range"]::-moz-range-thumb');
  assert.ok(pxValue(mozThumb, "width") >= 24, "Firefox thumb width");
  assert.ok(pxValue(mozThumb, "height") >= 24, "Firefox thumb height");

  const choiceField = extractRuleBody(css, ".choice-field");
  assertDeclaration(choiceField, "display", "inline-flex");
  assertDeclaration(choiceField, "min-height", "var(--control-height)");
  assertDeclaration(choiceField, "align-items", "center");

  const fieldControls = extractRuleBody(css, ".field-group input,\n.field-group select,\n.field-group textarea");
  assertDeclaration(fieldControls, "font-weight", "400");
});

test("legacy layouts retain temporary panel separation", () => {
  const legacyPanels = extractRuleBody(
    css,
    ".shell > .panel,\n.archive-shell > .panel,\n.terminal-shell > .panel",
  );
  assertDeclaration(legacyPanels, "margin-top", "18px");

  const nestedPanels = extractRuleBody(
    css,
    ".grid > .panel,\n.channel-grid > .panel,\n.notebook-grid > .panel",
  );
  assertDeclaration(nestedPanels, "margin-top", "0");

  assert.doesNotMatch(
    css,
    /\.shell\s*>\s*\.panel\s*\+\s*\.panel/,
    "direct legacy panels do not need a redundant adjacent override",
  );
});

test("responsive rules preserve gutters and action targets", () => {
  const tablet = extractMediaBody(760);
  const tabletPage = extractRuleBody(tablet, ".page");
  assert.match(declarations(tabletPage).get("width"), /calc\(100% - 36px\)/);
  assertDeclaration(extractRuleBody(tablet, ".marketing-content"), "width", "calc(100% - 36px)");

  const mobile = extractMediaBody(560);
  const mobilePage = extractRuleBody(mobile, ".page");
  assertDeclaration(
    mobilePage,
    "width",
    "min(calc(100% - 32px), var(--page-width, var(--width-standard)))",
  );

  const mobileActions = extractRuleBody(mobile, ".form-actions,\n.actions");
  assertDeclaration(mobileActions, "align-items", "stretch");
  assertDeclaration(mobileActions, "flex-direction", "column");
});

test("shared design-system exposes page, layout, form, and feedback selectors", () => {
  const selectors = [
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
    ".choice-field",
    ".form-stack",
    ".form-grid",
    ".form-actions",
    ".data-scroll",
    ".status",
    ".evidence",
  ];

  for (const selector of selectors) {
    assert.match(css, new RegExp(`\\${selector}(?=[\\s,{.:#>+~\\[])`), selector);
  }
});

test("blog pages use their assigned shared page templates and one h1", async () => {
  for (const [file, template] of Object.entries(templateMaps.blog)) {
    const html = await readBlogPage(file);
    const mains = [...html.matchAll(/<main\b([^>]*)>/gi)];
    assert.equal(mains.length, 1, `${file} has one main`);

    const classes = classTokens(mains[0][1]);
    assert.ok(classes.has("page"), `${file} main uses page`);
    assert.ok(classes.has(template), `${file} main uses ${template}`);

    const headings = html.match(/<h1\b/gi) ?? [];
    assert.equal(headings.length, 1, `${file} has exactly one h1`);
  }
});

test("HTML structure helper rejects sibling elements", () => {
  const root = parseHtml('<div class="data-scroll"></div><table></table>');
  const scroll = findByClass(root, "data-scroll");
  const table = findOne(root, (node) => node.tag === "table", "table");

  assert.equal(isDescendant(scroll, table), false);
});

test("attachments table is contained by its horizontal data viewport", async () => {
  const root = parseHtml(await readBlogPage("attachments.html"));
  const scroll = findByClass(root, "data-scroll");
  const table = findOne(root, (node) => node.tag === "table", "attachments table");

  assert.ok(isDescendant(scroll, table), "attachments table is inside .data-scroll");
});

test("revision workspace preserves comparison and form grouping", async () => {
  const root = parseHtml(await readBlogPage("revision.html"));
  const revisionRow = findByClass(root, "revision-row");
  assert.ok(hasClass(revisionRow, "workspace-material"), "revision row is workspace material");

  const form = findById(root, "revision-form");
  assert.ok(hasClass(form, "form-grid"), "revision form uses form-grid");
  for (const id of ["place", "date", "case-id", "intent"]) {
    const control = findById(root, id);
    assert.ok(isDescendant(form, control), `#${id} belongs to revision form`);
    assertInClassAncestor(control, "field-group", `#${id}`);
  }

  const submit = findSubmit(form);
  const status = findById(root, "status");
  const submitActions = assertInClassAncestor(submit, "form-actions", "revision submit");
  const statusActions = assertInClassAncestor(status, "form-actions", "revision status");
  assert.equal(statusActions, submitActions, "revision submit and status share form-actions");
});

test("photo lab separates material, analysis, evidence form, and memo actions", async () => {
  const root = parseHtml(await readBlogPage("photo-lab.html"));
  const workspace = findByClass(root, "workspace-grid");
  const photo = findById(root, "photo");
  const material = nearestAncestor(photo, (node) => node.parent === workspace);
  const analysis = findOne(
    workspace,
    (node) => node.parent === workspace && node.tag === "aside",
    "photo analysis aside",
  );
  assert.ok(material, "photo material is a direct workspace child");
  assert.ok(hasClass(material, "panel"), "photo material uses panel");
  assert.ok(hasClass(analysis, "panel"), "photo analysis uses panel");
  assert.ok(
    workspace.children.indexOf(material) < workspace.children.indexOf(analysis),
    "photo material precedes analysis",
  );

  const form = findById(root, "photo-form");
  assert.ok(hasClass(form, "form-stack"), "photo form uses form-stack");
  for (const id of ["brightness", "contrast", "proof"]) {
    assertInClassAncestor(findById(root, id), "field-group", `#${id}`);
  }

  const submit = findSubmit(form);
  const status = findById(root, "status");
  const submitActions = assertInClassAncestor(submit, "form-actions", "photo submit");
  const statusActions = assertInClassAncestor(status, "form-actions", "photo status");
  assert.equal(statusActions, submitActions, "photo submit and status share form-actions");

  const memo = findById(root, "memo");
  const hint = findById(root, "hint");
  const memoActions = assertInClassAncestor(memo, "secondary-actions", "memo button");
  const hintActions = assertInClassAncestor(hint, "secondary-actions", "memo hint");
  assert.equal(hintActions, memoActions, "memo and hint share secondary actions");
  assert.notEqual(memoActions, submitActions, "memo actions are separate from submit actions");
  assert.equal(
    nearestAncestor(memoActions, (node) => node.tag === "form"),
    null,
    "memo actions are outside the photo form",
  );
});

test("case notebook keeps both evidence forms structurally independent", async () => {
  const root = parseHtml(await readBlogPage("case-notebook.html"));
  const fragmentForm = findById(root, "fragment-form");
  const tokenForm = findById(root, "token-form");

  for (const form of [fragmentForm, tokenForm]) {
    assert.ok(hasClass(form, "form-stack"), `#${form.attributes.get("id")} uses form-stack`);
    assertInClassAncestor(findSubmit(form), "form-actions", `#${form.attributes.get("id")} submit`);
  }

  const fragmentInput = findById(root, "fragment-input");
  const tokenInput = findById(root, "token-input");
  assert.ok(isDescendant(fragmentForm, fragmentInput), "fragment input belongs to fragment form");
  assert.ok(isDescendant(tokenForm, tokenInput), "token input belongs to token form");
  assertInClassAncestor(fragmentInput, "field-group", "fragment input");
  assertInClassAncestor(tokenInput, "field-group", "token input");

  const status = findById(root, "status");
  assert.ok(hasClass(status, "status"), "notebook status keeps status class");
  assert.ok(isDescendant(fragmentForm, status), "notebook status remains associated with fragment form");
  assertInClassAncestor(status, "form-actions", "notebook status");
});

test("blog entry, reading, and decision pages nest their shared structures", async () => {
  const indexRoot = parseHtml(await readBlogPage("index.html"));
  const indexMain = findOne(indexRoot, (node) => node.tag === "main", "index main");
  assert.ok(isDescendant(indexMain, findByClass(indexRoot, "phone")), "phone is nested in shared main");

  for (const file of ["blog.html", "report.html"]) {
    const root = parseHtml(await readBlogPage(file));
    const main = findOne(root, (node) => node.tag === "main", `${file} main`);
    assert.ok(isDescendant(main, findByClass(root, "page-intro")), `${file} has nested page-intro`);
  }

  const deadSwitchRoot = parseHtml(await readBlogPage("dead-switch.html"));
  const deadSwitchMain = findOne(deadSwitchRoot, (node) => node.tag === "main", "dead-switch main");
  const sectionStack = findByClass(deadSwitchRoot, "section-stack");
  assert.ok(isDescendant(deadSwitchMain, sectionStack), "dead-switch uses a nested section-stack");
  assert.ok(isDescendant(sectionStack, findById(deadSwitchRoot, "title")), "decision title is in stack");
  assert.ok(isDescendant(sectionStack, findById(deadSwitchRoot, "content")), "decision content is in stack");
});

test("blog skin owns semantic theme values without reclaiming shared layout", () => {
  const paper = extractRuleBody(blogCss, ".paper");
  const theme = {
    "--bg": "var(--paper)",
    "--ink": "var(--paper-ink)",
    "--muted": "var(--paper-muted)",
    "--panel": "#f6f0e7",
    "--panel-2": "#fffaf2",
    "--line": "#cfc2b3",
    "--accent": "#7d332a",
  };
  for (const [property, value] of Object.entries(theme)) {
    assertDeclaration(paper, property, value, `.paper ${property}`);
  }

  assert.ok(numericLineHeight(extractRuleBody(blogCss, ".article")) >= 1.8, "article line-height");
  assertDeclaration(extractRuleBody(blogCss, ".article p"), "margin-block", "1.2em");

  for (const selector of [
    ".phone",
    ".chat",
    ".bubble",
    ".revision-row",
    ".lab-photo",
    ".notebook-grid",
    ".fragment-chip",
  ]) {
    assert.ok(extractRuleBody(blogCss, selector).trim(), `${selector} keeps a blog-only rule`);
  }

  const rules = collectStyleRules(blogCss);
  for (const rule of rules) {
    const values = declarations(rule.body);
    if (rule.selectors.includes(".shell") || rule.selectors.includes(".page")) {
      assert.equal(values.has("width"), false, `${rule.selectors.join(", ")} does not own width`);
      assert.equal(values.has("max-width"), false, `${rule.selectors.join(", ")} does not own max-width`);
    }
    if (rule.selectors.includes(".panel")) {
      assert.equal(values.has("padding"), false, ".panel padding remains shared");
      assert.equal(values.has("margin"), false, ".panel margin remains shared");
    }
  }

  for (const selector of [".chat", ".revision-row", ".notebook-grid"]) {
    assert.match(
      declarations(extractRuleBody(blogCss, selector)).get("gap") ?? "",
      /^var\(--space-\d+\)$/,
      `${selector} gap uses spacing token`,
    );
  }
});
