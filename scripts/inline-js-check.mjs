import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
}

const errors = [];
let inlineCount = 0;
let externalCount = 0;
const files = await walk(ROOT);

for (const file of files.filter((f) => f.endsWith(".html"))) {
  const html = await readFile(file, "utf8");
  let pageIndex = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1] || "";
    const source = match[2] || "";
    if (/\bsrc\s*=/.test(attrs) || /type=["']application\/ld\+json["']/i.test(attrs) || !source.trim()) continue;
    pageIndex += 1;
    inlineCount += 1;
    try { new Function(source); }
    catch (error) { errors.push(`${path.relative(ROOT, file)} inline script #${pageIndex}: ${error.message}`); }
  }
}

for (const file of files.filter((f) => f.endsWith(".js") && f.includes(`${path.sep}assets${path.sep}js${path.sep}`))) {
  const source = await readFile(file, "utf8");
  externalCount += 1;
  try { new Function(source); }
  catch (error) { errors.push(`${path.relative(ROOT, file)}: ${error.message}`); }
}

if (errors.length) {
  console.error(`FAIL: ${errors.length} browser JavaScript syntax issue(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`PASS: browser JavaScript syntax — ${inlineCount} inline scripts and ${externalCount} emitted JS assets parse successfully.`);
