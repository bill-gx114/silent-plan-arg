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

test("government portal exposes two-source volunteer evidence and layered hints", async () => {
  const html = await read("portal.html");
  assert.match(html, /平台开放时间：2024-04-03/);
  assert.match(html, /东七码头/);
  assert.match(html, /预约编号前缀/);
  assert.match(html, /volunteersVerified/);
  assert.match(html, /所谓自愿并不成立/);
  assert.match(html, /第一层提示/);
  assert.match(html, /第二层提示/);
  assert.match(html, /第三层提示/);
  assert.match(html, /href="notices\.html"/);
});

test("notice variants reconstruct the hidden approval batch", async () => {
  const html = await read("notices.html");
  assert.match(html, /网页版公示/);
  assert.match(html, /打印版/);
  assert.match(html, /无障碍朗读文本/);
  assert.match(html, /LY-MH-04/);
  assert.match(html, /batchRecovered/);
  assert.match(html, /volunteersVerified/);
  assert.match(html, /href="hearing\.html"/);
});
