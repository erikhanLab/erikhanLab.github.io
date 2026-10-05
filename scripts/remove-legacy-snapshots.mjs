import { access, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "src/pages/404.html",
  "src/pages/home.html",
  "src/pages/profile.html",
  "src/pages/research.html",
  "src/pages/timeline.html",
  "src/pages/writing-single-number.html",
  "src/pages/research-log.html",
  "src/pages/research-connection.html",
  "src/pages/contact.html",
  "src/pages/archive.html",
  "src/content/routes.json",
  "src/content/generated-pages.json",
  "src/content/publications.json",
];
for (const rel of required) await stat(path.join(ROOT, rel));

const obsolete = [
  "index.html",
  "404.html",
  "profile",
  "publications",
  "research",
  "contact",
  "archive",
  "robots.txt",
  "sitemap.xml",
];
let removed = 0;
for (const rel of obsolete) {
  const target = path.join(ROOT, rel);
  if (await access(target).then(() => true, () => false)) {
    await rm(target, { recursive: true, force: true });
    removed += 1;
    console.log(`removed ${rel}`);
  }
}
console.log(`P2-D cleanup complete: ${removed} legacy/generated root snapshot path(s) removed. Canonical authored sources now live under src/.`);
