import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const blogAssets = new URL("src/blog/assets/", root);
const archiveAssets = new URL("src/archive/assets/", root);
await Promise.all([mkdir(blogAssets, { recursive: true }), mkdir(archiveAssets, { recursive: true })]);

for (const name of [
  "interview-timeline.csv",
  "city-outage-notice.txt",
  "published-report.txt",
  "autosave-draft.txt"
]) {
  await copyFile(new URL(`assets-source/${name}`, root), new URL(name, blogAssets));
}

function createStereoEvidenceWav() {
  const sampleRate = 16000;
  const seconds = 18;
  const channels = 2;
  const bytesPerSample = 2;
  const frames = sampleRate * seconds;
  const dataSize = frames * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  const envelopes = [
    [0.6, 1.5], [2.0, 3.4], [4.0, 5.2], [6.1, 7.8], [8.5, 10.6], [11.2, 13.1], [14.0, 16.8]
  ];
  const active = (time, shift) => envelopes.some(([start, end]) => time >= start + shift && time <= end + shift);
  let offset = 44;
  for (let frame = 0; frame < frames; frame += 1) {
    const time = frame / sampleRate;
    const fade = Math.min(1, time * 3, (seconds - time) * 3);
    const leftVoice = active(time, 0)
      ? Math.sin(2 * Math.PI * (185 + 22 * Math.sin(time * 3.1)) * time) * .34
        + Math.sin(2 * Math.PI * 370 * time) * .08
      : 0;
    const rightVoice = active(time, .35)
      ? Math.sin(2 * Math.PI * (245 + 30 * Math.sin(time * 2.4)) * time) * .31
        + Math.sin(2 * Math.PI * 490 * time) * .07
      : 0;
    const carrier = Math.sin(2 * Math.PI * 18.9 * time) * .04;
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, (leftVoice + carrier) * fade)) * 32767), offset);
    offset += 2;
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, (rightVoice - carrier) * fade)) * 32767), offset);
    offset += 2;
  }
  return buffer;
}

const testimony = createStereoEvidenceWav();
await writeFile(new URL("testimony.pkg", archiveAssets), testimony);
const testimonySha256 = createHash("sha256").update(testimony).digest("hex");

await writeFile(
  new URL("evidence-manifest.json", archiveAssets),
  `${JSON.stringify({
    testimonySha256,
    originalName: "testimony.wav",
    mirroredName: "testimony.pkg",
    channels: 2,
    sampleRate: 16000,
    uploadTime: "2019-11-09T23:41:00+08:00",
    renameTime: "2019-11-09T23:48:00+08:00"
  }, null, 2)}\n`
);

await writeFile(
  new URL("testimony-transcript.txt", archiveAssets),
  `证词包分轨文字稿

[左声道 / 陈砚明]
频率同步不是事故。钟楼街是产品演示。
11 月 9 日，他们删除了我的异议。
原始实验窗口只有五分钟，现实部署已经超过三十分钟。
如果这份文件还在，去核对上传日志，不要只相信我的声音。

[右声道 / 林知秋]
如果你能把两个声音分开，就不要急着公开。
先确认这个包有没有被动过。
如果摘要一致，去看死人开关的测试日志。
公开不是终点。让复核过的人继续追资金流。
`
);

const copiedDraft = await readFile(new URL("autosave-draft.txt", blogAssets), "utf8");
await writeFile(
  new URL("photo-metadata.json", blogAssets),
  `${JSON.stringify({
    file: "ZL0315_FRAME_03.jpg",
    capturedAt: "2019-03-15T02:21:36+08:00",
    cameraOwner: "LZQ",
    locationNote: "钟楼街候选建筑",
    relatedDraftSha256: createHash("sha256").update(copiedDraft).digest("hex")
  }, null, 2)}\n`
);
