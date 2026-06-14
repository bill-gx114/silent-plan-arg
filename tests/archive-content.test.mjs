import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pages = [
  "index.html",
  "tree.html",
  "package.html",
  "forensics.html",
  "integrity.html",
  "switch-console.html"
];

for (const page of pages) {
  test(`archive site contains ${page}`, async () => {
    const html = await readFile(new URL(`../src/archive/${page}`, import.meta.url), "utf8");
    assert.match(html, /<!doctype html>/i);
  });
}

test("tree requires the reconstructed archive path", async () => {
  const html = await readFile(new URL("../src/archive/tree.html", import.meta.url), "utf8");
  assert.match(html, /CYM-071/);
  assert.match(html, /DEL-1109/);
  assert.match(html, /testimony\.pkg/);
});

test("forensics exposes stereo channel and file-header controls", async () => {
  const html = await readFile(new URL("../src/archive/forensics.html", import.meta.url), "utf8");
  assert.match(html, /RIFF/);
  assert.match(html, /左声道/);
  assert.match(html, /右声道/);
  assert.match(html, /AudioContext/);
});

test("evidence package offers a WAV-compatible download", async () => {
  const html = await readFile(new URL("../src/archive/package.html", import.meta.url), "utf8");
  assert.match(html, /download="testimony\.wav"/);
  assert.match(html, /无法直接打开/);
  assert.match(html, /站内取证台/);
});

test("integrity page contains upload records and digest comparison", async () => {
  const html = await readFile(new URL("../src/archive/integrity.html", import.meta.url), "utf8");
  assert.match(html, /SHA-256/);
  assert.match(html, /23:41/);
  assert.match(html, /23:48/);
});

test("switch console emits hidden fragment and token", async () => {
  const html = await readFile(new URL("../src/archive/switch-console.html", import.meta.url), "utf8");
  assert.match(html, /DRYRUN/);
  assert.match(html, /FOLLOW-THE-TIDE/);
  assert.match(html, /recordSwitchEvidence/);
});
