import { access, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "assets/research/fowt-pitch.webm",
  "assets/research/fowt-pitch.mp4",
  "assets/research/fowt-pitch-poster.jpg",
  "assets/research/wec-cfd-mbd.webm",
  "assets/research/wec-cfd-mbd.mp4",
  "assets/research/wec-cfd-mbd-poster.jpg",
];
const obsolete = [
  "assets/research/fowt-pitch.gif",
  "assets/research/wec-cfd-mbd.gif",
];

for (const rel of required) await access(path.join(ROOT, rel));
let removed = 0;
for (const rel of obsolete) {
  try {
    await rm(path.join(ROOT, rel));
    console.log(`removed ${rel}`);
    removed += 1;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
console.log(`Quality asset cleanup complete: ${removed} obsolete GIF asset(s) removed; video replacements verified first.`);
