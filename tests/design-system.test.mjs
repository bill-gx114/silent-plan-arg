import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rawCss = await readFile(new URL("../src/shared/base.css", import.meta.url), "utf8");
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");
const rawBlogCss = await readFile(new URL("../src/blog/blog.css", import.meta.url), "utf8");
const blogCss = rawBlogCss.replace(/\/\*[\s\S]*?\*\//g, "");
const rawCorporateCss = await readFile(new URL("../src/corporate/corporate.css", import.meta.url), "utf8");
const corporateCss = rawCorporateCss.replace(/\/\*[\s\S]*?\*\//g, "");
const rawArchiveCss = await readFile(new URL("../src/archive/archive.css", import.meta.url), "utf8");
const archiveCss = rawArchiveCss.replace(/\/\*[\s\S]*?\*\//g, "");
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
  corporate: {
    "index.html": "page--marketing",
    "products.html": "page--records",
    "team.html": "page--records",
    "archive.html": "page--workspace",
    "diff.html": "page--workspace",
    "directory.html": "page--records",
    "request-log.html": "page--records",
  },
  archive: {
    "index.html": "page--verify",
    "tree.html": "page--records",
    "package.html": "page--records",
    "forensics.html": "page--workspace",
    "integrity.html": "page--verify",
    "switch-console.html": "page--decision",
  },
};

async function readBlogPage(file) {
  return readFile(new URL(`../src/blog/${file}`, import.meta.url), "utf8");
}

async function readCorporatePage(file) {
  return readFile(new URL(`../src/corporate/${file}`, import.meta.url), "utf8");
}

async function readArchivePage(file) {
  return readFile(new URL(`../src/archive/${file}`, import.meta.url), "utf8");
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
      assert.notEqual(stack.length, 1, `unexpected closing tag: </${tag}>`);
      assert.equal(
        stack.at(-1).tag,
        tag,
        `mismatched closing tag: expected </${stack.at(-1).tag}> but found </${tag}>`,
      );
      stack.pop();
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

  assert.equal(
    stack.length,
    1,
    `unclosed tag: <${stack.at(-1).tag}>`,
  );
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

function assertExactClasses(node, expected, label) {
  assert.deepEqual(
    [...classTokens(`class="${node.attributes.get("class") ?? ""}"`)].sort(),
    [...expected].sort(),
    `${label} classes`,
  );
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

function relativeLuminance(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i, `six-digit hex color: ${hex}`);
  const channels = hex.slice(1).match(/../g).map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
}

function contrastRatio(first, second) {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
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

test("HTML structure helper rejects malformed nesting", () => {
  assert.throws(
    () => parseHtml("<main><section></main></section>"),
    /mismatched closing tag/,
  );
  assert.throws(
    () => parseHtml("<main><section></section>"),
    /unclosed tag/,
  );
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
  assert.equal(isDescendant(fragmentForm, status), false, "status is outside fragment form");
  assert.equal(isDescendant(tokenForm, status), false, "status is outside token form");
  assert.equal(status.parent, fragmentForm.parent, "status shares the forms' panel");
  assert.ok(
    status.parent.children.indexOf(status) > status.parent.children.indexOf(tokenForm),
    "status follows both forms",
  );
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

test("paper theme feedback colors meet text contrast and are consumed", () => {
  const paper = declarations(extractRuleBody(blogCss, ".paper"));
  const approved = {
    "--accent": "#7d332a",
    "--accent-contrast": "#fffaf2",
    "--danger": "#7a1f2b",
    "--warn": "#6b4a00",
    "--success": "#245c3a",
  };
  for (const [property, value] of Object.entries(approved)) {
    assert.equal(paper.get(property), value, `.paper ${property}`);
  }

  assert.ok(
    contrastRatio(approved["--accent"], approved["--accent-contrast"]) >= 4.5,
    "primary button text contrasts with accent",
  );
  for (const property of ["--danger", "--warn", "--success"]) {
    for (const background of ["#e9e1d4", "#f6f0e7", "#fffaf2"]) {
      assert.ok(
        contrastRatio(approved[property], background) >= 4.5,
        `${property} contrasts with ${background}`,
      );
    }
  }

  const primary = extractRuleBody(blogCss, ".paper button.primary,\n.paper .button.primary");
  assertDeclaration(primary, "color", "var(--accent-contrast)");
  assertDeclaration(extractRuleBody(css, ".status"), "color", "var(--warn)");
  assertDeclaration(extractRuleBody(css, '.status[data-state="success"]'), "color", "var(--success)");
  assertDeclaration(extractRuleBody(css, '.status[data-state="error"]'), "color", "var(--danger)");
  assertDeclaration(extractRuleBody(css, ".danger"), "color", "var(--danger)");
});

test("corporate pages use their assigned shared page templates and one h1", async () => {
  for (const [file, template] of Object.entries(templateMaps.corporate)) {
    const root = parseHtml(await readCorporatePage(file));
    const main = findOne(root, (node) => node.tag === "main", `${file} main`);
    assert.ok(hasClass(main, "page"), `${file} main uses page`);
    assert.ok(hasClass(main, template), `${file} main uses ${template}`);
    assert.equal(allElements(root, (node) => node.tag === "h1").length, 1, `${file} has one h1`);
  }

  for (const [file, text] of [
    ["products.html", "技术与产品档案"],
    ["team.html", "当前团队"],
  ]) {
    const html = await readCorporatePage(file);
    assert.match(html, new RegExp(`<h1[^>]*>\\s*${text}\\s*</h1>`), `${file} h1`);
  }
});

test("corporate marketing and card pages preserve their exact content hierarchy", async () => {
  const indexRoot = parseHtml(await readCorporatePage("index.html"));
  const nav = findByClass(indexRoot, "corp-nav");
  const main = findOne(indexRoot, (node) => node.tag === "main", "index main");
  assert.equal(isDescendant(main, nav), false, "corporate nav is outside main");
  assert.equal(nav.parent, main.parent, "corporate nav and main are body siblings");
  assert.ok(
    nav.parent.children.indexOf(nav) < nav.parent.children.indexOf(main),
    "corporate nav precedes main",
  );

  const mainElements = main.children.filter((node) => node.tag !== "#text");
  assert.ok(hasClass(mainElements[0], "corp-hero"), "hero is main's first element child");
  const marketing = findByClass(indexRoot, "marketing-content");
  assert.equal(marketing.parent, main, "marketing content is a direct main child");
  assert.ok(
    mainElements.indexOf(marketing) > mainElements.indexOf(mainElements[0]),
    "marketing content follows hero",
  );
  const cards = findOne(
    marketing,
    (node) => isDescendant(marketing, node) && node.tag === "section" && hasClass(node, "cards"),
    "marketing cards section",
  );
  const invitation = findOne(
    marketing,
    (node) => isDescendant(marketing, node) &&
      node.tag === "section" &&
      allElements(node, (child) => child.tag === "a" && child.attributes.get("href") === "archive.html").length === 1,
    "archive invitation section",
  );
  assert.ok(marketing.children.indexOf(cards) < marketing.children.indexOf(invitation), "cards precede invitation");

  for (const file of ["products.html", "team.html"]) {
    const root = parseHtml(await readCorporatePage(file));
    const pageCards = findByClass(root, "cards");
    assert.equal(pageCards.tag, "section", `${file} cards use section`);
    assertExactClasses(pageCards, ["cards"], `${file} cards section`);
  }
});

test("corporate archive preserves exact snapshot controls and targets", async () => {
  const root = parseHtml(await readCorporatePage("archive.html"));
  const buttons = allElements(
    root,
    (node) => node.tag === "button" && node.attributes.has("data-year"),
  );
  assert.deepEqual(
    buttons.map((node) => node.attributes.get("data-year")),
    ["2019", "2020", "current"],
    "snapshot button values",
  );

  const snapshots = allElements(
    root,
    (node) => node.tag === "section" && node.attributes.has("data-snapshot"),
  );
  assert.deepEqual(
    snapshots.map((node) => node.attributes.get("data-snapshot")),
    ["2019", "2020", "current"],
    "snapshot target values",
  );
});

test("corporate data tables are nested in horizontal data viewports", async () => {
  for (const [file, tableClass] of [
    ["diff.html", "diff-table"],
    ["directory.html", null],
    ["request-log.html", null],
  ]) {
    const root = parseHtml(await readCorporatePage(file));
    const scroll = findByClass(root, "data-scroll");
    const table = findOne(
      root,
      (node) => node.tag === "table" && (!tableClass || hasClass(node, tableClass)),
      `${file} table`,
    );
    assert.ok(isDescendant(scroll, table), `${file} table is inside .data-scroll`);
  }
});

test("corporate evidence and interactive forms keep structural grouping", async () => {
  const diffRoot = parseHtml(await readCorporatePage("diff.html"));
  const diffForm = findById(diffRoot, "diff-form");
  assert.ok(hasClass(diffForm, "form-stack"), "diff form uses form-stack");
  const radios = allElements(
    diffForm,
    (node) => isDescendant(diffForm, node) &&
      node.tag === "input" &&
      node.attributes.get("type") === "radio",
  );
  assert.equal(radios.length, 3, "diff form keeps three choices");
  assert.deepEqual(
    radios.map((radio) => [radio.attributes.get("name"), radio.attributes.get("value")]),
    [
      ["answer", "resign"],
      ["answer", "batch"],
      ["answer", "error"],
    ],
    "diff answer names and values",
  );
  for (const radio of radios) {
    const label = nearestAncestor(radio, (node) => node.tag === "label");
    assert.ok(label, "radio has label ancestor");
    assert.ok(hasClass(label, "field-group"), "radio label uses field-group");
    assert.ok(hasClass(label, "choice-field"), "radio label uses choice-field");
  }
  const diffActions = assertInClassAncestor(findSubmit(diffForm), "form-actions", "diff submit");
  assert.equal(
    assertInClassAncestor(findById(diffRoot, "status"), "form-actions", "diff status"),
    diffActions,
    "diff submit and status share form-actions",
  );

  const directoryRoot = parseHtml(await readCorporatePage("directory.html"));
  const directoryStack = findByClass(directoryRoot, "section-stack");
  const directoryScroll = findByClass(directoryRoot, "data-scroll");
  const directoryEvidence = findByClass(directoryRoot, "evidence");
  assert.equal(directoryScroll.parent, directoryStack, "directory viewport belongs to section stack");
  assert.equal(directoryEvidence.parent, directoryStack, "directory evidence belongs to section stack");
  assert.ok(
    directoryStack.children.indexOf(directoryScroll) < directoryStack.children.indexOf(directoryEvidence),
    "directory evidence follows data viewport",
  );

  const requestRoot = parseHtml(await readCorporatePage("request-log.html"));
  const filters = findByClass(requestRoot, "record-filters");
  assert.ok(hasClass(filters, "actions"), "request filters retain actions");
  const filterButtons = allElements(
    filters,
    (node) => isDescendant(filters, node) && node.tag === "button",
  );
  assert.deepEqual(
    filterButtons.map((node) => node.attributes.get("data-filter")),
    ["all", "CYM-071", "DEL-1109"],
    "request filter values",
  );
  assert.deepEqual(
    filterButtons.map((node) => node.attributes.get("aria-pressed")),
    ["true", "false", "false"],
    "request filters expose their initial selected state",
  );
  const terminal = findByClass(requestRoot, "terminal");
  const requestScroll = findByClass(requestRoot, "data-scroll");
  const requestTable = findOne(requestRoot, (node) => node.tag === "table", "request table");
  assert.ok(isDescendant(terminal, requestScroll), "request viewport is inside terminal");
  assert.ok(isDescendant(requestScroll, requestTable), "request table is inside viewport");
  const targetRows = allElements(requestTable, (node) => node.tag === "tr" && hasClass(node, "target"));
  assert.equal(targetRows.length, 4, "request table keeps four target rows");
  assert.deepEqual(
    targetRows.map((node) => node.attributes.get("data-tags")),
    Array(4).fill("CYM-071 DEL-1109"),
    "target rows keep employee and deletion tags",
  );
  const requestForm = findById(requestRoot, "path-form");
  assert.ok(hasClass(requestForm, "form-stack"), "path form uses form-stack");
  const path = findById(requestRoot, "path");
  assert.ok(isDescendant(requestForm, path), "path input belongs to path form");
  assertInClassAncestor(path, "field-group", "path input");
  const requestActions = assertInClassAncestor(findSubmit(requestForm), "form-actions", "path submit");
  assert.equal(
    assertInClassAncestor(findById(requestRoot, "status"), "form-actions", "path status"),
    requestActions,
    "path submit and status share form-actions",
  );
});

test("corporate request log bounds table overflow and exposes selected filter behavior", async () => {
  const terminal = extractRuleBody(corporateCss, ".terminal");
  assertDeclaration(terminal, "min-width", "0");
  assert.equal(declarations(terminal).has("overflow"), false, "terminal does not own table scrolling");
  assert.equal(declarations(terminal).has("overflow-x"), false, "terminal does not own horizontal scrolling");

  const dataScroll = extractRuleBody(css, ".data-scroll");
  assertDeclaration(dataScroll, "width", "100%");
  assertDeclaration(dataScroll, "overflow-x", "auto");

  const selected = extractRuleBody(
    corporateCss,
    '.record-filters button[aria-pressed="true"]',
  );
  assertDeclaration(selected, "background", "var(--corp-blue)");
  assertDeclaration(selected, "color", "#04101a");
  assert.ok(
    contrastRatio("#4ac8ff", "#04101a") >= 4.5,
    "selected filter text contrasts with its background",
  );

  const html = await readCorporatePage("request-log.html");
  assert.match(
    html,
    /document\.querySelectorAll\("\[data-filter\]"\)\.forEach\(\(filterButton\) =>\s*filterButton\.setAttribute\("aria-pressed", String\(filterButton === button\)\)\)/,
    "filter click updates aria-pressed on every filter button",
  );
});

test("corporate skin owns semantic theme values without reclaiming shared layout", () => {
  const root = extractRuleBody(corporateCss, ":root");
  assertDeclaration(root, "--corp-blue", "#4ac8ff", "corporate --corp-blue");
  const theme = {
    "--bg": "#07111b",
    "--panel": "#0c1721",
    "--panel-2": "#101f2c",
    "--line": "#254056",
    "--ink": "#e5eef5",
    "--muted": "#9bb0bf",
    "--accent": "var(--corp-blue)",
  };
  for (const property of Object.keys(theme)) {
    assert.equal(declarations(root).has(property), false, `${property} is not global`);
  }

  const body = extractRuleBody(corporateCss, "body");
  for (const [property, value] of Object.entries(theme)) {
    assertDeclaration(body, property, value, `corporate body ${property}`);
  }

  assertDeclaration(
    body,
    "background",
    "linear-gradient(145deg, #07111b, #0b1824 55%, #061018)",
  );

  for (const selector of [".corp-nav", ".corp-hero", ".snapshot", ".diff-table", ".terminal"]) {
    assert.ok(extractRuleBody(corporateCss, selector).trim(), `${selector} keeps corporate styling`);
  }

  const rules = collectStyleRules(corporateCss);
  for (const rule of rules) {
    const values = declarations(rule.body);
    if (rule.selectors.includes(".archive-shell") || rule.selectors.includes(".corp-section")) {
      assert.equal(values.has("width"), false, `${rule.selectors.join(", ")} does not own width`);
      assert.equal(values.has("max-width"), false, `${rule.selectors.join(", ")} does not own max-width`);
      assert.equal(values.has("margin"), false, `${rule.selectors.join(", ")} does not own margin`);
    }
  }

  for (const selector of [".corp-nav", ".snapshot-tabs"]) {
    assert.match(
      declarations(extractRuleBody(corporateCss, selector)).get("gap") ?? "",
      /^var\(--space-\d+\)$/,
      `${selector} gap uses spacing token`,
    );
  }
});

test("archive pages use their assigned shared page templates and one h1", async () => {
  for (const [file, template] of Object.entries(templateMaps.archive)) {
    const root = parseHtml(await readArchivePage(file));
    const main = findOne(root, (node) => node.tag === "main", `${file} main`);
    assert.ok(hasClass(main, "page"), `${file} main uses page`);
    assert.ok(hasClass(main, template), `${file} main uses ${template}`);
    assert.equal(allElements(root, (node) => node.tag === "h1").length, 1, `${file} has one h1`);
  }
});

test("archive entry and tree preserve exact form and mounted-directory structure", async () => {
  const indexHtml = await readArchivePage("index.html");
  const indexRoot = parseHtml(indexHtml);
  const indexMain = findOne(indexRoot, (node) => node.tag === "main", "index main");
  const indexStack = findByClass(indexRoot, "section-stack");
  assert.equal(indexStack.parent, indexMain, "entry stack is a direct main child");

  const pathForm = findById(indexRoot, "path-form");
  assertExactClasses(pathForm, ["panel", "form-stack"], "path form");
  assert.equal(pathForm.parent, indexStack, "path form belongs to section stack");
  const pathInput = findById(indexRoot, "path");
  assertExactClasses(pathInput, ["mono"], "path input");
  assert.equal(pathInput.attributes.get("placeholder"), "/legacy/...", "path input keeps placeholder");
  assert.ok(isDescendant(pathForm, pathInput), "path input belongs to form");
  assertInClassAncestor(pathInput, "field-group", "path input");
  const pathSubmit = findSubmit(pathForm);
  const pathActions = assertInClassAncestor(pathSubmit, "form-actions", "path submit");
  assert.equal(
    assertInClassAncestor(findById(indexRoot, "status"), "form-actions", "path status"),
    pathActions,
    "path submit and status share form-actions",
  );
  assert.equal(
    findById(indexRoot, "status").attributes.get("role"),
    "status",
    "entry dynamic status is announced",
  );
  assert.match(indexHtml, /<label\b[^>]*>\s*镜像路径\s*<input\b/i, "entry keeps path label");
  assert.match(indexHtml, /<button\b[^>]*type=["']submit["'][^>]*>\s*挂载路径\s*<\/button>/i, "entry keeps mount action");
  assert.match(
    indexHtml,
    /const\s+expected\s*=\s*["']\/legacy\/CYM-071\/DEL-1109\/testimony\.pkg["']/,
    "entry keeps expected archive path",
  );
  assert.match(
    indexHtml,
    /if\s*\(\s*value\s*===\s*expected\s*\)\s*location\.href\s*=\s*`tree\.html\?path=\$\{encodeURIComponent\(value\)\}`/,
    "entry keeps exact path verification redirect",
  );
  assert.ok(
    indexHtml.includes("镜像索引中不存在这条路径。路径区分层级与顺序。"),
    "entry keeps exact failure status",
  );

  const treeHtml = await readArchivePage("tree.html");
  const treeRoot = parseHtml(treeHtml);
  const treeIntro = findByClass(treeRoot, "page-intro");
  for (const node of [
    findByClass(treeRoot, "eyebrow"),
    findByClass(treeRoot, "crumb"),
    findOne(treeRoot, (candidate) => candidate.tag === "h1", "tree h1"),
  ]) {
    assert.ok(isDescendant(treeIntro, node), "tree heading material belongs to page intro");
  }
  const treeStack = findByClass(treeRoot, "section-stack");
  const denied = findById(treeRoot, "denied");
  const treePanel = findById(treeRoot, "tree-panel");
  assert.equal(denied.parent, treeStack, "denied panel belongs to stack");
  assert.equal(treePanel.parent, treeStack, "tree panel belongs to stack");
  assert.ok(hasClass(denied, "hidden"), "denied panel starts hidden");
  assert.ok(hasClass(treePanel, "hidden"), "tree panel starts hidden");
  assert.match(
    treeHtml,
    /import\s*\{\s*isExpectedPath\s*\}\s*from\s*["']\.\/archive\.js["']/,
    "tree keeps path verifier import",
  );
  assert.match(
    treeHtml,
    /isExpectedPath\(\s*new URLSearchParams\(\s*location\.search\s*\)\.get\(\s*["']path["']\s*\)\s*\)/,
    "tree keeps expected-path query logic",
  );
  assert.match(
    treeHtml,
    /document\.querySelector\(\s*ok\s*\?\s*["']#tree-panel["']\s*:\s*["']#denied["']\s*\)\.classList\.remove\(\s*["']hidden["']\s*\)/,
    "tree keeps conditional visibility toggle",
  );
  for (const href of ["index.html", "package.html"]) {
    assert.equal(
      allElements(treeRoot, (node) => node.tag === "a" && node.attributes.get("href") === href).length,
      1,
      `tree keeps ${href} link`,
    );
  }
});

test("archive package and forensics preserve evidence controls and navigation", async () => {
  const packageRoot = parseHtml(await readArchivePage("package.html"));
  const packageMain = findOne(packageRoot, (node) => node.tag === "main", "package main");
  const packageIntro = findByClass(packageRoot, "page-intro");
  assert.equal(packageIntro.parent, packageMain, "package intro is a direct main child");
  assert.ok(isDescendant(packageIntro, findByClass(packageRoot, "crumb")), "package breadcrumb is in intro");
  assert.ok(
    isDescendant(packageIntro, findOne(packageRoot, (node) => node.tag === "h1", "package h1")),
    "package heading is in intro",
  );
  const packageStack = findByClass(packageRoot, "section-stack");
  assert.equal(packageStack.parent, packageMain, "package stack is a direct main child");
  const packagePanels = packageStack.children.filter((node) => hasClass(node, "panel"));
  assert.equal(packagePanels.length, 2, "package keeps metadata and download panels");
  assert.ok(hasClass(packagePanels[0], "grid"), "metadata panel keeps grid");
  const downloads = allElements(
    packageRoot,
    (node) => node.tag === "a" && node.attributes.get("href") === "assets/testimony.pkg",
  );
  assert.deepEqual(
    downloads.map((node) => node.attributes.get("download")),
    ["testimony.pkg", "testimony.wav"],
    "package keeps exact original and compatible downloads",
  );
  assert.equal(
    allElements(
      packageRoot,
      (node) => node.tag === "a" && node.attributes.get("href") === "forensics.html",
    ).length,
    1,
    "package keeps forensics link",
  );

  const forensicsHtml = await readArchivePage("forensics.html");
  const forensicsRoot = parseHtml(forensicsHtml);
  const forensicsMain = findOne(forensicsRoot, (node) => node.tag === "main", "forensics main");
  const header = findByClass(forensicsRoot, "page-header");
  const intro = findByClass(forensicsRoot, "page-intro");
  const forensicsStack = findByClass(forensicsRoot, "section-stack");
  const material = findByClass(forensicsRoot, "workspace-material");
  assert.equal(header.parent, forensicsMain, "forensics header is a direct main child");
  assert.equal(intro.parent, forensicsMain, "forensics intro is a direct main child");
  assert.equal(forensicsStack.parent, forensicsMain, "forensics stack is a direct main child");
  assert.equal(material.parent, forensicsStack, "waveform material belongs to section stack");
  assert.ok(isDescendant(material, findById(forensicsRoot, "wave")), "waveform is inside material panel");
  assert.equal(findByClass(forensicsRoot, "channel-grid").parent, forensicsStack, "channels belong to section stack");
  for (const id of ["play-left", "play-right", "status"]) findById(forensicsRoot, id);
  const actions = findByClass(forensicsRoot, "actions");
  for (const href of ["assets/testimony-transcript.txt", "integrity.html"]) {
    assert.equal(
      allElements(
        actions,
        (node) => isDescendant(actions, node) && node.tag === "a" && node.attributes.get("href") === href,
      ).length,
      1,
      `forensics keeps ${href} action`,
    );
  }
  assert.match(
    forensicsHtml,
    /import\s*\{\s*playChannel\s*\}\s*from\s*["']\.\/archive\.js["']/,
    "forensics keeps channel player import",
  );
  assert.match(
    forensicsHtml,
    /for\s*\(\s*const\s+side\s+of\s+\[\s*["']left["']\s*,\s*["']right["']\s*\]\s*\)/,
    "forensics binds both channel sides",
  );
  assert.match(
    forensicsHtml,
    /document\.querySelector\(\s*`#play-\$\{side\}`\s*\)\.addEventListener\(\s*["']click["']/,
    "forensics keeps channel click bindings",
  );
  assert.match(forensicsHtml, /playChannel\(\s*side\s*\)/, "forensics passes selected side");
  assert.ok(
    forensicsHtml.includes('`正在播放${side === "left" ? "左" : "右"}声道，时长 ${result.duration.toFixed(1)} 秒。`'),
    "forensics keeps exact playback status",
  );
  assert.ok(
    forensicsHtml.includes("浏览器未能启动音频。请使用分轨文字稿继续。"),
    "forensics keeps exact fallback status",
  );
  for (const marker of ["AudioContext", 'canvas.getContext("2d")']) {
    assert.ok(forensicsHtml.includes(marker), `forensics keeps ${marker} marker`);
  }
});

test("archive integrity and switch console preserve verification and decision evidence", async () => {
  const integrityHtml = await readArchivePage("integrity.html");
  const integrityRoot = parseHtml(integrityHtml);
  const integrityMain = findOne(integrityRoot, (node) => node.tag === "main", "integrity main");
  const integrityStack = findByClass(integrityRoot, "section-stack");
  assert.equal(integrityStack.parent, integrityMain, "integrity stack is a direct main child");
  const integrityPanels = integrityStack.children.filter((node) => hasClass(node, "panel"));
  assert.equal(integrityPanels.length, 2, "integrity keeps two panels");
  assert.ok(isDescendant(integrityPanels[0], findById(integrityRoot, "original-hash")), "upload chain is first");
  for (const id of ["verify", "current-hash", "status", "next"]) {
    assert.ok(isDescendant(integrityPanels[1], findById(integrityRoot, id)), `#${id} is in verification panel`);
  }
  const verifyActions = assertInClassAncestor(findById(integrityRoot, "verify"), "form-actions", "verify button");
  assert.equal(isDescendant(verifyActions, findById(integrityRoot, "status")), false, "status stays outside action row");
  assert.ok(hasClass(findById(integrityRoot, "status"), "status"), "integrity status keeps status class");
  assert.equal(
    findById(integrityRoot, "status").attributes.get("role"),
    "status",
    "integrity dynamic status is announced",
  );
  assert.equal(
    allElements(
      findById(integrityRoot, "next"),
      (node) => node.tag === "a" && node.attributes.get("href") === "switch-console.html",
    ).length,
    1,
    "integrity keeps switch-console link",
  );
  assert.match(
    integrityHtml,
    /import\s*\{\s*sha256\s*\}\s*from\s*["']\.\/archive\.js["']/,
    "integrity keeps digest import",
  );
  assert.match(
    integrityHtml,
    /fetch\(\s*["']assets\/evidence-manifest\.json["']\s*\)\.then\(\s*\(response\)\s*=>\s*response\.json\(\)\s*\)/,
    "integrity keeps manifest fetch",
  );
  assert.match(
    integrityHtml,
    /document\.querySelector\(\s*["']#verify["']\s*\)\.addEventListener\(\s*["']click["']/,
    "integrity keeps verify binding",
  );
  assert.match(
    integrityHtml,
    /fetch\(\s*["']assets\/testimony\.pkg["']\s*\)\.then\(\s*\(response\)\s*=>\s*response\.arrayBuffer\(\)\s*\)/,
    "integrity keeps evidence fetch",
  );
  assert.match(
    integrityHtml,
    /digest\s*===\s*manifest\.testimonySha256/,
    "integrity compares digest with manifest",
  );
  for (const status of [
    "摘要一致：删除批次只改了文件名，核心音频可验证。",
    "摘要不一致：不能把这份材料当作原始证据。",
    "兼容模式：无法计算摘要。请对照 manifest.sha256 中的预生成记录。",
  ]) {
    assert.ok(integrityHtml.includes(status), `integrity keeps status: ${status}`);
  }
  assert.match(
    integrityHtml,
    /document\.querySelector\(\s*["']#next["']\s*\)\.classList\.toggle\(\s*["']hidden["']\s*,\s*!ok\s*\)/,
    "integrity keeps next-step visibility logic",
  );

  const switchRoot = parseHtml(await readArchivePage("switch-console.html"));
  const switchMain = findOne(switchRoot, (node) => node.tag === "main", "switch main");
  assert.equal(findByClass(switchRoot, "page-intro").parent, switchMain, "switch intro is a direct child");
  const switchStack = findByClass(switchRoot, "section-stack");
  assert.equal(switchStack.parent, switchMain, "switch stack is a direct child");
  const switchPanels = switchStack.children.filter((node) => hasClass(node, "panel"));
  assert.equal(switchPanels.length, 2, "switch keeps log and evidence panels");
  assert.ok(hasClass(switchPanels[1], "evidence"), "second switch panel keeps evidence");
  assert.equal(
    findById(switchRoot, "notebook-link").attributes.get("href"),
    "../blog/case-notebook.html",
    "switch keeps notebook fallback link",
  );
  const switchHtml = await readArchivePage("switch-console.html");
  assert.match(switchHtml, /type="module"/, "switch keeps module script");
  assert.match(
    switchHtml,
    /import\s*\{\s*blogNotebookUrl\s*\}\s*from\s*["']\.\/archive\.js["']/,
    "switch keeps notebook URL import",
  );
  assert.match(
    switchHtml,
    /document\.querySelector\(\s*["']#notebook-link["']\s*\)\.href\s*=\s*blogNotebookUrl\(\s*\)/,
    "switch keeps notebook URL assignment",
  );
  assert.match(switchHtml, /DRYRUN/, "switch keeps fragment");
  assert.match(switchHtml, /FOLLOW-THE-TIDE/, "switch keeps token");
});

test("archive skin owns terminal semantics without reclaiming shared layout", () => {
  const body = extractRuleBody(archiveCss, "body");
  const theme = {
    "--bg": "#020504",
    "--panel": "#050b08",
    "--panel-2": "#07110b",
    "--line": "#173823",
    "--ink": "#cde8d5",
    "--muted": "#6e9c7b",
    "--accent": "var(--term)",
    "--success": "var(--term)",
  };
  for (const [property, value] of Object.entries(theme)) {
    assertDeclaration(body, property, value, `archive body ${property}`);
  }
  assertDeclaration(body, "background", "#020504");
  assertDeclaration(body, "color", "var(--ink)");

  for (const selector of [".tree", ".hex", ".wave", ".channel-grid", ".record", ".hash", ".console-line"]) {
    assert.ok(extractRuleBody(archiveCss, selector).trim(), `${selector} keeps archive styling`);
  }

  const rules = collectStyleRules(archiveCss);
  for (const rule of rules) {
    const values = declarations(rule.body);
    if (rule.selectors.includes(".terminal-shell")) {
      for (const property of ["width", "max-width", "margin", "padding"]) {
        assert.equal(values.has(property), false, `.terminal-shell does not own ${property}`);
      }
    }
  }

  for (const selector of [".channel-grid", ".hex"]) {
    assert.match(
      declarations(extractRuleBody(archiveCss, selector)).get("gap") ?? "",
      /^var\(--space-\d+\)$/,
      `${selector} gap uses spacing token`,
    );
  }

  assertDeclaration(
    extractRuleBody(archiveCss, "body"),
    "font-family",
    '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
    "archive body uses shared system sans stack",
  );
  const mono = extractRuleBody(
    archiveCss,
    "h1,\nh2,\n.crumb,\n.tree,\n.hex,\n.hash,\n.console-line,\n.record",
  );
  assertDeclaration(
    mono,
    "font-family",
    "ui-monospace, SFMono-Regular, Menlo, monospace",
    "terminal material remains monospace",
  );
});
