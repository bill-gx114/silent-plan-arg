import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (page) => readFile(new URL(`../chapter4/${page}`, import.meta.url), "utf8");

test("chapter four entry supports immediate reveal and reduced motion", async () => {
  const html = await read("index.html");
  assert.match(html, /id="reveal-all"/);
  assert.match(html, /立即显示全部/);
  assert.match(html, /function finishConversation\(\)/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /href="portal\.html"/);
});

test("chapter four entry loads shared orientation and chapter skin", async () => {
  const html = await read("index.html");
  assert.match(html, /href="\.\.\/series\/series\.css"/);
  assert.match(html, /src="\.\.\/series\/series\.js"/);
  assert.match(html, /href="chapter4\.css"/);
  assert.match(html, /data-chapter="4"/);
  assert.match(html, /data-objective="[^"]+"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
});
