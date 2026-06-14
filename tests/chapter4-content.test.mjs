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

test("hearing archive supports a multi-source forgery reconstruction", async () => {
  const html = await read("hearing.html");
  assert.match(html, /座次图/);
  assert.match(html, /麦克风编号/);
  assert.match(html, /门禁记录/);
  assert.match(html, /新闻稿发布时间/);
  assert.match(html, /data-scroll/);
  assert.match(html, /代表 2.*进入会场/s);
  assert.match(html, /安抚姓/);
  assert.match(html, /hearingExposed/);
  assert.match(html, /WHITE-TOWER/);
  assert.match(html, /B2 声纹室/);
  assert.match(html, /href="operation\.html"/);
});

test("operation page requires sufficient mirror evidence and a viable rescue route", async () => {
  const html = await read("operation.html");
  assert.match(html, /异常自愿者名单/);
  assert.match(html, /伪造听证证明/);
  assert.match(html, /WHITE-TOWER 上级授权记录/);
  assert.match(html, /mirrorReady/);
  assert.match(html, /西侧档案通道/);
  assert.match(html, /04:10/);
  assert.match(html, /04:17/);
  assert.match(html, /rescueReady/);
  assert.match(html, /href="execute\.html"/);
});

test("execution resolves prepared lines into explicit endings", async () => {
  const html = await read("execute.html");
  assert.match(html, /resolveChapter4Ending/);
  assert.match(html, /04:17/);
  assert.match(html, /缺失的准备/);
  assert.match(html, /end\.html\?ending=/);
});

test("stage ending closes Luyuan while preserving the White Tower thread", async () => {
  const html = await read("end.html");
  assert.match(html, /鹿原篇完成/);
  assert.match(html, /WHITE-TOWER/);
  assert.match(html, /林知秋/);
  assert.match(html, /exposure/);
  assert.match(html, /rescue/);
  assert.match(html, /coordinated/);
  assert.doesNotMatch(html, /chapter5|第五章入口/);
});
