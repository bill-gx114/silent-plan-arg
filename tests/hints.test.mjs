import assert from "node:assert/strict";
import test from "node:test";
import { hintFor } from "../src/shared/hints.js";

test("returns method guidance before bridge evidence", () => {
  assert.match(hintFor("p2", 1), /时间|停电/);
  assert.match(hintFor("p2", 2), /备用电|出口灯/);
});

