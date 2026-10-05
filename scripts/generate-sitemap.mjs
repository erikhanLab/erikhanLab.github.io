import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://sangseokhan.com";

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    if (name === ".git" || name === "node_modules") continue;
    const full = path.join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}
function meta(html, name) {
  const tag = html.match(new RegExp(`<meta\\b[^>]*name=["']${name}["'][^>]*>`, "i"))?.[0] || "";
  return tag.match(/content=["']([^"']*)["']/i)?.[1]?.trim() || "";
}
function canonical(html) {
  const tag=html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i)?.[0] || "";
  return tag.match(/href=["']([^"']+)["']/i)?.[1]?.trim() || "";
}

const files=(await walk(ROOT)).filter((f)=>f.endsWith("index.html") && !f.includes(`${path.sep}.git${path.sep}`));
const urls=[];
for (const file of files) {
  const html=await readFile(file,"utf8");
  if (meta(html,"robots").toLowerCase().includes("noindex")) continue;
  const can=canonical(html);
  if (can.startsWith(SITE + "/")) urls.push(can);
}
urls.sort();
const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u)=>`  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(path.join(ROOT,"sitemap.xml"),xml,"utf8");
console.log(`Wrote sitemap.xml with ${urls.length} indexable URLs.`);
