import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("GitHub API publishing preserves main history", async () => {
  const script = await readFile(
    new URL("../scripts/publish-github-api.mjs", import.meta.url),
    "utf8"
  );
  assert.match(script, /parents: \[currentMain\.object\.sha\]/);
  assert.match(script, /force: false/);
  assert.doesNotMatch(script, /force: true/);
});

test("GitHub API publishing times out and retries stalled requests", async () => {
  const script = await readFile(
    new URL("../scripts/publish-github-api.mjs", import.meta.url),
    "utf8"
  );
  assert.match(script, /for \(let attempt = 1; attempt <= 3; attempt \+= 1\)/);
  assert.match(script, /timeout: 30_000/);
  assert.match(script, /ETIMEDOUT/);
});
