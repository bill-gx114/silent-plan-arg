import { ARG_CONFIG } from "../shared/config.js";

export const expectedPath = "/legacy/CYM-071/DEL-1109/testimony.pkg";

export function isExpectedPath(value) {
  return decodeURIComponent(String(value || "")) === expectedPath;
}

export async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function playChannel(channel) {
  const response = await fetch("assets/testimony.pkg");
  const data = await response.arrayBuffer();
  const context = new AudioContext();
  const decoded = await context.decodeAudioData(data.slice(0));
  const source = context.createBufferSource();
  const splitter = context.createChannelSplitter(2);
  const gain = context.createGain();
  source.buffer = decoded;
  source.connect(splitter);
  splitter.connect(gain, channel === "right" ? 1 : 0);
  gain.connect(context.destination);
  source.start();
  return { context, source, duration: decoded.duration };
}

export function blogNotebookUrl() {
  const url = new URL("case-notebook.html", ARG_CONFIG.blogUrl);
  url.searchParams.set("fragment", "DRYRUN");
  url.searchParams.set("token", "FOLLOW-THE-TIDE");
  return url.href;
}

