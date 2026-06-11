import assert from "node:assert/strict";
import test from "node:test";
import {
  availableEndings,
  createInitialCase,
  normalizeCredential,
  recordFragment,
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

test("true ending requires all four fragments and a switch token", () => {
  let state = createInitialCase();
  for (const fragment of ["AFTERIMAGE", "BLACKOUT", "CYPRESS", "DRYRUN"]) {
    state = recordFragment(state, fragment);
  }
  assert.deepEqual(availableEndings(state), ["publish", "hold"]);
  state = { ...state, switchToken: "FOLLOW-THE-TIDE" };
  assert.deepEqual(availableEndings(state), ["publish", "hold", "follow"]);
});

