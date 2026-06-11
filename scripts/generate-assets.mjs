import { mkdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);
await Promise.all([
  mkdir(new URL("src/blog/assets/", root), { recursive: true }),
  mkdir(new URL("src/archive/assets/", root), { recursive: true })
]);

