import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://sangseokhan.com";
const routes = JSON.parse(await readFile(path.join(ROOT, "src/content/routes.json"), "utf8"));
const urls = routes.filter((route) => route.index).map((route) => `${SITE}${route.path}`);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
await mkdir(path.join(ROOT, "dist"), { recursive: true });
await writeFile(path.join(ROOT, "dist", "sitemap.xml"), xml, "utf8");
console.log(`Wrote dist/sitemap.xml from route manifest with ${urls.length} indexable URLs.`);
