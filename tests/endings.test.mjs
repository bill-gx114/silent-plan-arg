import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("dead switch contains three causally distinct endings", async () => {
  const html = await readFile(new URL("../src/blog/dead-switch.html", import.meta.url), "utf8");
  assert.match(html, /证据已公开/);
  assert.match(html, /证据已离线保存/);
  assert.match(html, /真正留下的路线/);
  assert.match(html, /available\.includes/);
});

test("notebook accepts archive context as prefill rather than automatic completion", async () => {
  const html = await readFile(new URL("../src/blog/case-notebook.html", import.meta.url), "utf8");
  assert.match(html, /URLSearchParams/);
  assert.match(html, /fragment-input/);
  assert.doesNotMatch(html, /submitNotebook\(params/);
});

test("root entry points players to the blog", async () => {
  const html = await readFile(new URL("../src/index.html", import.meta.url), "utf8");
  assert.match(html, /blog\/index\.html/);
});

