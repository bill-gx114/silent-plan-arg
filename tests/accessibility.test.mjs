import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

for (const site of ["blog", "corporate", "archive"]) {
  test(`${site} pages declare language, viewport, and titles`, async () => {
    const directory = new URL(`../src/${site}/`, import.meta.url);
    const pages = (await readdir(directory)).filter((name) => name.endsWith(".html"));
    for (const page of pages) {
      const html = await readFile(new URL(page, directory), "utf8");
      assert.match(html, /<html lang="zh-CN">/i, page);
      assert.match(html, /name="viewport"/i, page);
      assert.match(html, /<title>.+<\/title>/i, page);
    }
  });
}

test("complex evidence operations include desktop guidance or fallback", async () => {
  const attachments = await readFile(new URL("../src/blog/attachments.html", import.meta.url), "utf8");
  const forensics = await readFile(new URL("../src/archive/forensics.html", import.meta.url), "utf8");
  assert.match(attachments, /建议使用电脑/);
  assert.match(forensics, /分轨文字稿/);
});

test("every first-chapter page has exactly one h1", async () => {
  for (const site of ["blog", "corporate", "archive"]) {
    const directory = new URL(`../src/${site}/`, import.meta.url);
    const pages = (await readdir(directory)).filter((name) => name.endsWith(".html"));
    for (const page of pages) {
      const html = await readFile(new URL(page, directory), "utf8");
      assert.equal((html.match(/<h1\b/gi) ?? []).length, 1, `${site}/${page}`);
    }
  }
});
