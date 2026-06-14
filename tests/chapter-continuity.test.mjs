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

for (const chapter of ["chapter2", "chapter3"]) {
  for (const page of ["index.html", ...(chapter === "chapter2"
    ? ["sleepisle.html", "devlogin.html", "data.html", "corp.html", "end.html"]
    : ["radio.html", "decode.html", "station.html", "end.html"])]) {
    test(`${chapter}/${page} exposes series orientation`, async () => {
      const html = await readFile(new URL(`../${chapter}/${page}`, import.meta.url), "utf8");
      assert.match(html, /href="\.\.\/series\/series\.css"/);
      assert.match(html, /src="\.\.\/series\/series\.js"/);
      assert.match(html, new RegExp(`data-chapter="${chapter === "chapter2" ? "2" : "3"}"`));
      assert.match(html, /data-objective="[^"]+"/);
    });
  }
}

test("chapter 2 continues to the locally hosted chapter 3", async () => {
  const html = await readFile(new URL("../chapter2/end.html", import.meta.url), "utf8");
  assert.match(html, /href="\.\.\/chapter3\/index\.html"/);
  assert.doesNotMatch(html, /aiforce\.cloud/);
});
