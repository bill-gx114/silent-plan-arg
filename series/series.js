const body = document.body;
const chapter = body.dataset.chapter;
const objective = body.dataset.objective;

if (chapter && objective) {
  const bar = document.createElement("aside");
  bar.className = "series-bar";
  bar.setAttribute("aria-label", "寂静计划调查进度");
  bar.innerHTML = `
    <span class="series-bar__chapter">第 ${chapter} 章</span>
    <span class="series-bar__objective">${objective}</span>
    <a class="series-bar__home" href="index.html">章节入口</a>
  `;
  body.appendChild(bar);
}
