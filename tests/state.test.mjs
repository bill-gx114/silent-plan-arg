import assert from "node:assert/strict";
import test from "node:test";
import {
  availableEndings,
  createInitialCase,
  normalizeCredential,
  recordFragment,
  recordPuzzleEvidence,
  spendMemo
} from "../src/shared/state.js";

test("normalizes investigation credentials without changing meaning", () => {
  assert.equal(normalizeCredential(" cym 071 "), "CYM-071");
  assert.equal(normalizeCredential("del_1109"), "DEL-1109");
  assert.equal(normalizeCredential("zl0315"), "ZL-0315");
});

test("spending a memo cannot reduce balance below zero", () => {
  const state = { ...createInitialCase(), memos: 1 };
  assert.equal(spendMemo(state).memos, 0);
  assert.equal(spendMemo(spendMemo(state)).memos, 0);
});

test("endings remain locked until all four fragments are recorded", () => {
  let state = createInitialCase();
  assert.deepEqual(availableEndings(state), []);
  state = recordFragment(state, "AFTERIMAGE");
  assert.deepEqual(availableEndings(state), []);
  for (const fragment of ["BLACKOUT", "CYPRESS", "DRYRUN"]) {
    state = recordFragment(state, fragment);
  }
  assert.deepEqual(availableEndings(state), ["publish", "hold"]);
});

test("true ending additionally requires the switch token", () => {
  let state = createInitialCase();
  for (const fragment of ["AFTERIMAGE", "BLACKOUT", "CYPRESS", "DRYRUN"]) {
    state = recordFragment(state, fragment);
  }
  assert.deepEqual(availableEndings(state), ["publish", "hold"]);
  state = { ...state, switchToken: "FOLLOW-THE-TIDE" };
  assert.deepEqual(availableEndings(state), ["publish", "hold", "follow"]);
});

test("records the evidence fragment associated with a completed puzzle", () => {
  let state = createInitialCase();
  state = recordPuzzleEvidence(state, "p1");
  state = recordPuzzleEvidence(state, "p2");
  state = recordPuzzleEvidence(state, "directory");
  state = recordPuzzleEvidence(state, "switch");
  assert.deepEqual(state.fragments, ["AFTERIMAGE", "BLACKOUT", "CYPRESS", "DRYRUN"]);
  assert.deepEqual(recordPuzzleEvidence(state, "unknown"), state);
});
