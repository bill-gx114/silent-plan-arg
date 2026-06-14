import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const repository = process.argv[2];
if (!repository || !repository.includes("/")) {
  throw new Error("Usage: node scripts/publish-github-api.mjs owner/repository");
}

function gh(path, method = "GET", input) {
  const args = ["api", `repos/${repository}/${path}`];
  if (method !== "GET") args.push("--method", method);
  if (input !== undefined) args.push("--input", "-");
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = spawnSync("gh", args, {
      input: input === undefined ? undefined : JSON.stringify(input),
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: 30_000
    });
    if (result.status === 0) {
      return result.stdout ? JSON.parse(result.stdout) : null;
    }
    const timedOut = result.error?.code === "ETIMEDOUT";
    const message = result.error?.message || result.stderr || result.stdout || "GitHub API request failed";
    if (!timedOut || attempt === 3) throw new Error(message);
    console.warn(`GitHub API request timed out; retrying (${attempt}/3): ${path}`);
  }
  throw new Error(`GitHub API request failed: ${path}`);
}

const files = execFileSync("git", ["ls-files", "-z"]).toString("utf8").split("\0").filter(Boolean);
const tree = [];
let completed = 0;

for (const path of files) {
  const content = readFileSync(path).toString("base64");
  const blob = gh("git/blobs", "POST", { content, encoding: "base64" });
  tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  completed += 1;
  if (completed % 10 === 0 || completed === files.length) {
    console.log(`Uploaded ${completed}/${files.length} files`);
  }
}

const createdTree = gh("git/trees", "POST", { tree });
let currentMain = null;
try {
  currentMain = gh("git/ref/heads/main");
} catch (error) {
  if (!String(error.message).includes("HTTP 404")) throw error;
}
const commit = gh("git/commits", "POST", {
  message: "Build layered investigation ARG",
  tree: createdTree.sha,
  ...(currentMain ? { parents: [currentMain.object.sha] } : {})
});

if (!currentMain) {
  gh("git/refs", "POST", { ref: "refs/heads/main", sha: commit.sha });
} else {
  gh("git/refs/heads/main", "PATCH", { sha: commit.sha, force: false });
}

console.log(JSON.stringify({ repository, commit: commit.sha, files: files.length }));
