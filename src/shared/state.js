import { fragments, puzzleEvidence, validateFragment } from "./evidence.js";

export const STORAGE_KEY = "silent-plan-case-v2";

export function normalizeCredential(value) {
  const compact = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^A-Z0-9/-]/g, "");
  return compact
    .replace(/^([A-Z]{2,3})(\d{3,4})$/, "$1-$2")
    .replace(/-+/g, "-");
}

export function createInitialCase() {
  return {
    memos: 3,
    fragments: [],
    switchToken: "",
    completed: {},
    hintLevel: {}
  };
}

export function loadCase(storage = globalThis.localStorage) {
  if (!storage) return createInitialCase();
  try {
    return { ...createInitialCase(), ...JSON.parse(storage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return createInitialCase();
  }
}

export function saveCase(state, storage = globalThis.localStorage) {
  storage?.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function spendMemo(state) {
  return { ...state, memos: Math.max(0, Number(state.memos || 0) - 1) };
}

export function recordFragment(state, value) {
  const fragment = validateFragment(value);
  if (!fragment) return state;
  return { ...state, fragments: [...new Set([...(state.fragments || []), fragment])] };
}

export function recordPuzzleEvidence(state, puzzle) {
  const fragment = puzzleEvidence[puzzle];
  return fragment ? recordFragment(state, fragment) : state;
}

export function availableEndings(state) {
  const hasAllFragments = fragments.every((item) => state.fragments?.includes(item.code));
  if (!hasAllFragments) return [];
  const endings = ["publish", "hold"];
  if (hasAllFragments && normalizeCredential(state.switchToken) === "FOLLOW-THE-TIDE") {
    endings.push("follow");
  }
  return endings;
}
