import { ARG_CONFIG } from "../shared/config.js";
import {
  availableEndings,
  loadCase,
  normalizeCredential,
  recordFragment,
  recordPuzzleEvidence,
  saveCase,
  spendMemo
} from "../shared/state.js";
import { fragments } from "../shared/evidence.js";
import { hintFor } from "../shared/hints.js";

export function wireExternalLinks(root = document) {
  root.querySelectorAll("[data-site]").forEach((link) => {
    const key = `${link.dataset.site}Url`;
    if (ARG_CONFIG[key]) link.href = ARG_CONFIG[key];
  });
}

export function completePuzzle(name) {
  let state = loadCase();
  state = {
    ...state,
    completed: { ...state.completed, [name]: true }
  };
  state = recordPuzzleEvidence(state, name);
  return saveCase(state);
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
  const evidence = fragments.map((item) => ({
    ...item,
    found: state.fragments?.includes(item.code)
  }));
  const missing = evidence.find((item) => !item.found);
  let nextAction = {
    href: "#endings",
    label: "证据齐全，可以形成调查结论"
  };
  if (missing?.code === "AFTERIMAGE") {
    nextAction = { href: "report.html", label: "比较报道的修订记录" };
  } else if (missing?.code === "BLACKOUT") {
    nextAction = { href: "attachments.html", label: "核验照片与停电时间线" };
  } else if (missing?.code === "CYPRESS") {
    nextAction = { href: "../corporate/archive.html", label: "调查回声科技网页存档" };
  } else if (missing?.code === "DRYRUN") {
    nextAction = { href: "../corporate/request-log.html", label: "重建隐藏档案路径" };
  } else if (normalizeCredential(state.switchToken) !== "FOLLOW-THE-TIDE") {
    nextAction = { href: "../archive/switch-console.html", label: "取得死人开关启动令牌" };
  }
  return { state, evidence, nextAction, endings: availableEndings(state) };
}

wireExternalLinks();
