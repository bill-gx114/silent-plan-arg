import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pages = [
  "index.html",
  "products.html",
  "team.html",
  "archive.html",
  "diff.html",
  "directory.html",
  "request-log.html"
];

for (const page of pages) {
  test(`corporate site contains ${page}`, async () => {
    const html = await readFile(new URL(`../src/corporate/${page}`, import.meta.url), "utf8");
    assert.match(html, /<!doctype html>/i);
  });
}

test("archive contains three meaningful snapshots", async () => {
  const html = await readFile(new URL("../src/corporate/archive.html", import.meta.url), "utf8");
  assert.match(html, /2019/);
  assert.match(html, /2020/);
  assert.match(html, /当前/);
  assert.match(html, /陈砚明/);
});

test("employee directory exposes the residual employee id and hidden fragment", async () => {
  const html = await readFile(new URL("../src/corporate/directory.html", import.meta.url), "utf8");
  assert.match(html, /CYM-071/);
  assert.match(html, /CYPRESS/);
});

test("request log reconstructs deletion batch and archive package", async () => {
  const html = await readFile(new URL("../src/corporate/request-log.html", import.meta.url), "utf8");
  assert.match(html, /DEL-1109/);
  assert.match(html, /testimony\.pkg/);
  assert.match(html, /data-filter/);
});

test("corporate bridge clue has a second source", async () => {
  const directory = await readFile(new URL("../src/corporate/directory.html", import.meta.url), "utf8");
  const log = await readFile(new URL("../src/corporate/request-log.html", import.meta.url), "utf8");
  assert.match(directory, /DEL-1109/);
  assert.match(log, /CYM-071/);
});

