import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../src/shared/base.css", import.meta.url), "utf8");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractBlock(source, startIndex, label) {
  const openingBrace = source.indexOf("{", startIndex);
  assert.notEqual(openingBrace, -1, `${label} opening brace`);

  let depth = 1;
  for (let index = openingBrace + 1; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  assert.fail(`${label} closing brace`);
}

function extractRuleBody(source, selector) {
  const selectorPattern = selector
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join("\\s+");
  const match = new RegExp(`${selectorPattern}\\s*\\{`).exec(source);
  assert.ok(match, `${selector} rule`);
  return extractBlock(source, match.index, selector);
}

function extractMediaBody(maxWidth) {
  const label = `@media (max-width: ${maxWidth}px)`;
  const match = new RegExp(`@media\\s*\\(max-width:\\s*${maxWidth}px\\)\\s*\\{`).exec(css);
  assert.ok(match, `${label} rule`);
  return extractBlock(css, match.index, label);
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
  assertDeclaration(range, "width", "100%");
  assertDeclaration(range, "min-height", "0");
  assertDeclaration(range, "padding", "0");

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

  const adjacentPanels = extractRuleBody(
    css,
    ".shell > .panel + .panel,\n.archive-shell > .panel + .panel,\n.terminal-shell > .panel + .panel",
  );
  assertDeclaration(adjacentPanels, "margin-top", "18px");
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
