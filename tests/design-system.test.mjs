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
  };

  for (const [token, value] of Object.entries(tokens)) {
    assert.match(css, new RegExp(`${token}:\\s*${value.replace(".", "\\.")}\\s*;`), token);
  }
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
