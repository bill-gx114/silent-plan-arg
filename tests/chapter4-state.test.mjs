import assert from "node:assert/strict";
import test from "node:test";
import {
  availableChapter4Actions,
  completeChapter4Step,
  createChapter4State,
  resolveChapter4Ending
} from "../chapter4/chapter4.js";

test("chapter four starts with no completed investigation steps", () => {
  assert.deepEqual(createChapter4State(), {
    volunteersVerified: false,
    batchRecovered: false,
    hearingExposed: false,
    mirrorReady: false,
    rescueReady: false,
    executionTime: "",
    ending: ""
  });
});

test("completing a step is immutable and only accepts known steps", () => {
  const initial = createChapter4State();
  const completed = completeChapter4Step(initial, "volunteersVerified");
  assert.equal(initial.volunteersVerified, false);
  assert.equal(completed.volunteersVerified, true);
  assert.deepEqual(completeChapter4Step(initial, "unknown"), initial);
});

test("actions unlock in investigation order", () => {
  let state = createChapter4State();
  assert.deepEqual(availableChapter4Actions(state), ["portal"]);
  state = completeChapter4Step(state, "volunteersVerified");
  assert.deepEqual(availableChapter4Actions(state), ["notices"]);
  state = completeChapter4Step(state, "batchRecovered");
  assert.deepEqual(availableChapter4Actions(state), ["hearing"]);
  state = completeChapter4Step(state, "hearingExposed");
  assert.deepEqual(availableChapter4Actions(state), ["operation"]);
});

test("coordinated ending requires both preparations and 04:17", () => {
  const ready = {
    ...createChapter4State(),
    mirrorReady: true,
    rescueReady: true
  };
  assert.equal(resolveChapter4Ending(ready, "04:16"), null);
  assert.equal(resolveChapter4Ending(ready, "0417"), "coordinated");
});

test("one prepared line resolves to its partial ending", () => {
  assert.equal(resolveChapter4Ending({
    ...createChapter4State(),
    mirrorReady: true
  }, "04:17"), "exposure");
  assert.equal(resolveChapter4Ending({
    ...createChapter4State(),
    rescueReady: true
  }, "04:17"), "rescue");
});

test("execution is unavailable without either prepared line", () => {
  assert.equal(resolveChapter4Ending(createChapter4State(), "04:17"), null);
});
