import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

for (const site of ["blog", "corporate", "archive"]) {
  test(`build contains ${site} entry point`, async () => {
    await assert.doesNotReject(() => access(new URL(`../dist/${site}/index.html`, import.meta.url)));
  });
}

for (const page of ["index.html", "radio.html", "decode.html", "station.html", "end.html"]) {
  test(`build contains chapter 3 ${page}`, async () => {
    await assert.doesNotReject(() => access(new URL(`../dist/chapter3/${page}`, import.meta.url)));
  });
}

for (const file of [
  "index.html",
  "portal.html",
  "notices.html",
  "hearing.html",
  "operation.html",
  "execute.html",
  "end.html",
  "chapter4.js",
  "chapter4.css"
]) {
  test(`build contains chapter 4 ${file}`, async () => {
    await assert.doesNotReject(() => access(new URL(`../dist/chapter4/${file}`, import.meta.url)));
  });
}

test("build contains shared series orientation assets", async () => {
  await assert.doesNotReject(() => access(new URL("../dist/series/series.css", import.meta.url)));
  await assert.doesNotReject(() => access(new URL("../dist/series/series.js", import.meta.url)));
});
