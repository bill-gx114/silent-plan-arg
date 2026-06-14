import { cp, mkdir, rm } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const src = new URL("src/", root);
const dist = new URL("dist/", root);

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL("index.html", src), new URL("index.html", dist));

for (const directory of ["shared", "blog", "corporate", "archive"]) {
  await cp(new URL(`${directory}/`, src), new URL(`${directory}/`, dist), {
    recursive: true
  });
}

for (const directory of ["chapter2", "chapter3", "series"]) {
  await cp(new URL(`${directory}/`, root), new URL(`${directory}/`, dist), {
    recursive: true
  });
}

console.log("Built first-chapter sites, Chapters 2-3, and shared series assets");
