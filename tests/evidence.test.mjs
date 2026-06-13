import assert from "node:assert/strict";
import test from "node:test";
import {
  fragments,
  reconstructArchivePath,
  validateFragment
} from "../src/shared/evidence.js";

test("accepts only known hidden evidence fragments", () => {
  assert.equal(validateFragment(" afterimage "), "AFTERIMAGE");
  assert.equal(validateFragment("unknown"), null);
  assert.equal(fragments.length, 4);
});

test("reconstructs archive path from employee and deletion evidence", () => {
  assert.equal(
    reconstructArchivePath("cym 071", "del_1109"),
    "/legacy/CYM-071/DEL-1109/testimony.pkg"
  );
});

