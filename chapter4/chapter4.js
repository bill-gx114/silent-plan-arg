export const CHAPTER4_STORAGE_KEY = "silent-plan-chapter4-v1";

const steps = new Set([
  "volunteersVerified",
  "batchRecovered",
  "hearingExposed",
  "mirrorReady",
  "rescueReady"
]);

export function createChapter4State() {
  return {
    volunteersVerified: false,
    batchRecovered: false,
    hearingExposed: false,
    mirrorReady: false,
    rescueReady: false,
    executionTime: "",
    ending: ""
  };
}

export function loadChapter4State(storage = globalThis.localStorage) {
  if (!storage) return createChapter4State();
  try {
    return {
      ...createChapter4State(),
      ...JSON.parse(storage.getItem(CHAPTER4_STORAGE_KEY) || "{}")
    };
  } catch {
    return createChapter4State();
  }
}

export function saveChapter4State(state, storage = globalThis.localStorage) {
  storage?.setItem(CHAPTER4_STORAGE_KEY, JSON.stringify(state));
  return state;
}

export function completeChapter4Step(state, step) {
  return steps.has(step) ? { ...state, [step]: true } : state;
}

export function availableChapter4Actions(state) {
  if (!state.volunteersVerified) return ["portal"];
  if (!state.batchRecovered) return ["notices"];
  if (!state.hearingExposed) return ["hearing"];
  if (!state.mirrorReady || !state.rescueReady) return ["operation"];
  return ["execute"];
}

export function normalizeExecutionTime(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 4);
  return digits.length === 4 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : "";
}

export function resolveChapter4Ending(state, time) {
  if (normalizeExecutionTime(time) !== "04:17") return null;
  if (state.mirrorReady && state.rescueReady) return "coordinated";
  if (state.mirrorReady) return "exposure";
  if (state.rescueReady) return "rescue";
  return null;
}
