import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import test from "node:test";

const distRoot = new URL("../dist/", import.meta.url);

async function htmlFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(new URL(`${entry.name}/`, directory), relative));
    else if (entry.name.endsWith(".html")) files.push(relative);
  }
  return files;
}

test("all static local HTML links resolve inside the Pages artifact", async () => {
  const pages = await htmlFiles(distRoot);
  const failures = [];
  for (const page of pages) {
    const html = await readFile(new URL(page, distRoot), "utf8");
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1];
      if (/^(https?:|mailto:|#|javascript:)/.test(href) || href.includes("${") || href.includes("+")) continue;
      const pathname = href.split(/[?#]/)[0];
      if (!pathname) continue;
      let target = normalize(join(dirname(page), pathname));
      if (target.endsWith("/")) target += "index.html";
      try {
        const info = await stat(new URL(target, distRoot));
        if (info.isDirectory()) await stat(new URL(`${target}/index.html`, distRoot));
      } catch {
        failures.push(`${page} -> ${href}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});
