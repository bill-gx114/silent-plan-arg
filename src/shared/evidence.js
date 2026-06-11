export const fragments = [
  { code: "AFTERIMAGE", source: "博客草稿", label: "余像" },
  { code: "BLACKOUT", source: "照片元数据", label: "停电" },
  { code: "CYPRESS", source: "员工目录", label: "柏树" },
  { code: "DRYRUN", source: "死人开关日志", label: "预演" }
];

export function validateFragment(value) {
  const normalized = String(value ?? "").trim().toUpperCase().replace(/[^A-Z]/g, "");
  return fragments.some((item) => item.code === normalized) ? normalized : null;
}

export function reconstructArchivePath(employee, deletionBatch) {
  const clean = (value) => String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[_\s]+/g, "-")
    .replace(/^([A-Z]{3})(\d{3})$/, "$1-$2")
    .replace(/^([A-Z]{3})(\d{4})$/, "$1-$2");
  const employeeId = clean(employee);
  const batchId = clean(deletionBatch);
  if (employeeId !== "CYM-071" || batchId !== "DEL-1109") return null;
  return `/legacy/${employeeId}/${batchId}/testimony.pkg`;
}

