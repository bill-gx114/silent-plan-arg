import { cp, mkdir, rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const src = new URL("src/", root);
const dist = new URL("dist/", root);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const directory of ["shared", "blog", "corporate", "archive"]) {
  await cp(new URL(`${directory}/`, src), new URL(`${directory}/`, dist), {
    recursive: true
  });
}

console.log("Built dist/blog, dist/corporate, and dist/archive");

