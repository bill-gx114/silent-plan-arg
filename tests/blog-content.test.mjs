import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pages = [
  "index.html",
  "blog.html",
  "report.html",
  "revision.html",
  "attachments.html",
  "photo-lab.html",
  "case-notebook.html",
  "dead-switch.html"
];

for (const page of pages) {
  test(`blog site contains ${page}`, async () => {
    const html = await readFile(new URL(`../src/blog/${page}`, import.meta.url), "utf8");
    assert.match(html, /<!doctype html>/i);
  });
}

test("revision puzzle asks for structured evidence", async () => {
  const html = await readFile(new URL("../src/blog/revision.html", import.meta.url), "utf8");
  assert.match(html, /ZL-0315/);
  assert.match(html, /钟楼街 29 号/);
  assert.match(html, /2019-03-15/);
  assert.match(html, /AFTERIMAGE/);
  assert.match(html, /href="attachments\.html"/);
  assert.match(html, /继续核验照片/);
});

test("photo lab combines brightness, metadata, and conclusion", async () => {
  const html = await readFile(new URL("../src/blog/photo-lab.html", import.meta.url), "utf8");
  assert.match(html, /type="range"/);
  assert.match(html, /停电公告/);
  assert.match(html, /BLACKOUT/);
});

test("case notebook tracks fragments, memos, and switch token", async () => {
  const html = await readFile(new URL("../src/blog/case-notebook.html", import.meta.url), "utf8");
  assert.match(html, /剩余备忘/);
  assert.match(html, /证据片段/);
  assert.match(html, /启动令牌/);
  assert.match(html, /id="progress-count"/);
  assert.match(html, /id="evidence-list"/);
  assert.match(html, /id="next-action"/);
  assert.match(html, /fragments\.map/);
});

test("completed blog puzzles automatically record their evidence", async () => {
  const js = await readFile(new URL("../src/blog/blog.js", import.meta.url), "utf8");
  assert.match(js, /recordPuzzleEvidence/);
  assert.match(js, /state = recordPuzzleEvidence\(state, name\)/);
});

test("chapter 2 is not permanently linked from blog source", async () => {
  for (const page of pages.filter((name) => name !== "dead-switch.html")) {
    const html = await readFile(new URL(`../src/blog/${page}`, import.meta.url), "utf8");
    assert.doesNotMatch(html, /chapter2/i);
  }
});
