import { ARG_CONFIG } from "../shared/config.js";
import { reconstructArchivePath } from "../shared/evidence.js";

export function selectSnapshot(year, root = document) {
  root.querySelectorAll("[data-snapshot]").forEach((node) => {
    node.classList.toggle("hidden", node.dataset.snapshot !== String(year));
  });
  root.querySelectorAll("[data-year]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.year === String(year)));
  });
}

export function reconstruct(employee, batch) {
  return reconstructArchivePath(employee, batch);
}

export function archiveUrl(path) {
  const url = new URL("tree.html", ARG_CONFIG.archiveUrl);
  if (path) url.searchParams.set("path", path);
  return url.href;
}

