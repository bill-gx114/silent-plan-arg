import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("chapter 2 conversation can be revealed immediately", async () => {
  const html = await readFile(new URL("../chapter2/index.html", import.meta.url), "utf8");
  assert.match(html, /id="reveal-all"/);
  assert.match(html, /立即显示全部/);
  assert.match(html, /function finishConversation\(\)/);
  assert.match(html, /prefers-reduced-motion/);
});

test("chapter 3 conversation can be revealed immediately", async () => {
  const html = await readFile(new URL("../chapter3/index.html", import.meta.url), "utf8");
  assert.match(html, /id="reveal-all"/);
  assert.match(html, /立即显示全部/);
  assert.match(html, /function finishConversation\(\)/);
  assert.match(html, /prefers-reduced-motion/);
});

for (const chapter of ["chapter2", "chapter3", "chapter4"]) {
  for (const page of ["index.html", ...(chapter === "chapter2"
    ? ["sleepisle.html", "devlogin.html", "data.html", "corp.html", "end.html"]
    : chapter === "chapter3"
      ? ["radio.html", "decode.html", "station.html", "end.html"]
      : ["portal.html", "notices.html", "hearing.html", "operation.html", "execute.html", "end.html"])]) {
    test(`${chapter}/${page} exposes series orientation`, async () => {
      const html = await readFile(new URL(`../${chapter}/${page}`, import.meta.url), "utf8");
      assert.match(html, /href="\.\.\/series\/series\.css"/);
      assert.match(html, /src="\.\.\/series\/series\.js"/);
      const chapterNumber = chapter.replace("chapter", "");
      assert.match(html, new RegExp(`data-chapter="${chapterNumber}"`));
      assert.match(html, /data-objective="[^"]+"/);
      if (chapter === "chapter4") {
        assert.equal((html.match(/<h1\b/g) || []).length, 1);
      }
    });
  }
}

test("chapter 2 continues to the locally hosted chapter 3", async () => {
  const html = await readFile(new URL("../chapter2/end.html", import.meta.url), "utf8");
  assert.match(html, /href="\.\.\/chapter3\/index\.html"/);
  assert.doesNotMatch(html, /aiforce\.cloud/);
});

test("chapter 3 continues to the locally hosted chapter 4", async () => {
  const html = await readFile(new URL("../chapter3/end.html", import.meta.url), "utf8");
  assert.match(html, /href="\.\.\/chapter4\/index\.html"/);
  assert.doesNotMatch(html, /第四章《鹿原 · 为你好》，待续/);
});
