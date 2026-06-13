import assert from "node:assert/strict";
import test from "node:test";
import { createStaticServer } from "../scripts/serve.mjs";

test("built application serves all critical routes and evidence assets", async (t) => {
  const server = createStaticServer({ port: 0, quiet: true });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  const routes = [
    "/",
    "/blog/index.html",
    "/blog/revision.html",
    "/blog/photo-lab.html",
    "/corporate/archive.html",
    "/corporate/request-log.html",
    "/archive/forensics.html",
    "/archive/integrity.html",
    "/archive/assets/testimony.pkg",
    "/chapter2/index.html"
  ];
  for (const route of routes) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, route);
    assert.ok(Number(response.headers.get("content-length") || 1) > 0, route);
  }
});

