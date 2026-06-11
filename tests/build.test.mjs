import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

for (const site of ["blog", "corporate", "archive"]) {
  test(`build contains ${site} entry point`, async () => {
    await assert.doesNotReject(() => access(new URL(`../dist/${site}/index.html`, import.meta.url)));
  });
}

