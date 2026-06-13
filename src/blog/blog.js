import { ARG_CONFIG } from "../shared/config.js";
import {
  availableEndings,
  loadCase,
  normalizeCredential,
  recordFragment,
  saveCase,
  spendMemo
} from "../shared/state.js";
import { hintFor } from "../shared/hints.js";

export function wireExternalLinks(root = document) {
  root.querySelectorAll("[data-site]").forEach((link) => {
    const key = `${link.dataset.site}Url`;
    if (ARG_CONFIG[key]) link.href = ARG_CONFIG[key];
  });
}

export function completePuzzle(name) {
  const state = loadCase();
  state.completed[name] = true;
  saveCase(state);
}

export function submitNotebook(fragmentValue, tokenValue) {
  let state = loadCase();
  if (fragmentValue) state = recordFragment(state, fragmentValue);
  if (tokenValue) state.switchToken = normalizeCredential(tokenValue);
  return saveCase(state);
}

export function useMemo(puzzle) {
  let state = loadCase();
  if (state.memos <= 0) return { state, hint: "备忘已经用完。回到材料本身，寻找第二来源。" };
  state = spendMemo(state);
  const nextLevel = Math.min(2, Number(state.hintLevel[puzzle] || 0) + 1);
  state.hintLevel[puzzle] = nextLevel;
  saveCase(state);
  return { state, hint: hintFor(puzzle, nextLevel) };
}

export function notebookView() {
  const state = loadCase();
  return { state, endings: availableEndings(state) };
}

wireExternalLinks();

