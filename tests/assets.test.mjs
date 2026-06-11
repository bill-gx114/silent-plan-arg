import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("blog evidence files are present and internally consistent", async () => {
  const csv = await readFile(new URL("../src/blog/assets/interview-timeline.csv", import.meta.url), "utf8");
  const outage = await readFile(new URL("../src/blog/assets/city-outage-notice.txt", import.meta.url), "utf8");
  const draft = await readFile(new URL("../src/blog/assets/autosave-draft.txt", import.meta.url), "utf8");
  assert.equal(csv.trim().split("\n").length, 8);
  assert.match(outage, /29 号.*备用电源/s);
  assert.match(draft, /ZL-0315/);
});

test("testimony package is a stereo RIFF/WAVE file", async () => {
  const wav = await readFile(new URL("../src/archive/assets/testimony.pkg", import.meta.url));
  assert.equal(wav.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(wav.subarray(8, 12).toString("ascii"), "WAVE");
  assert.equal(wav.readUInt16LE(22), 2);
});

test("evidence manifest contains the package's actual SHA-256", async () => {
  const wav = await readFile(new URL("../src/archive/assets/testimony.pkg", import.meta.url));
  const manifest = JSON.parse(await readFile(new URL("../src/archive/assets/evidence-manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.testimonySha256, createHash("sha256").update(wav).digest("hex"));
});

test("audio fallback transcript contains both speakers", async () => {
  const transcript = await readFile(new URL("../src/archive/assets/testimony-transcript.txt", import.meta.url), "utf8");
  assert.match(transcript, /陈砚明/);
  assert.match(transcript, /林知秋/);
});

