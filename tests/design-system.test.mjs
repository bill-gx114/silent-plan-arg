import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../src/shared/base.css", import.meta.url), "utf8");

test("shared design-system tokens define spacing, widths, and control height", () => {
  const tokens = {
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
    "--success": "#69c98a",
    "--radius-sm": "8px",
    "--radius-md": "12px",
    "--radius-lg": "18px",
  };

  for (const [token, value] of Object.entries(tokens)) {
    assert.match(css, new RegExp(`${token}:\\s*${value.replace(".", "\\.")}\\s*;`), token);
  }
});

test("shared layouts use the reviewed desktop and responsive dimensions", () => {
  assert.match(
    css,
    /\.page\s*\{[^}]*width:\s*min\(var\(--page-width,\s*var\(--width-standard\)\),\s*calc\(100%\s*-\s*64px\)\);[^}]*padding-block:\s*var\(--space-6\)\s+var\(--space-9\);/s,
    ".page desktop gutters and padding",
  );
  assert.match(
    css,
    /\.page--workspace\s*,\s*\.page--records\s*\{[^}]*--page-width:\s*var\(--width-data\);/s,
    ".page--workspace and .page--records data width",
  );
  assert.match(
    css,
    /\.panel\s*\{[^}]*margin:\s*0;[^}]*padding:\s*var\(--space-5\);/s,
    ".panel margin and padding",
  );
  assert.match(
    css,
    /\.status\s*\{[^}]*min-height:\s*3\.4em;[^}]*margin:\s*0;/s,
    ".status stable height",
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.page\s*\{[^}]*calc\(100%\s*-\s*36px\)/,
    "760px page gutter",
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*760px\)[\s\S]*?\.marketing-content\s*\{[^}]*calc\(100%\s*-\s*36px\)/,
    "760px marketing gutter",
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*560px\)[\s\S]*?\.page\s*\{[^}]*calc\(100%\s*-\s*32px\)/,
    "560px page gutter",
  );
  assert.match(
    css,
    /@media\s*\(max-width:\s*560px\)[\s\S]*?\.form-actions,\s*\.actions\s*\{[^}]*align-items:\s*stretch;[^}]*flex-direction:\s*column;/s,
    "560px stacked actions",
  );
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
