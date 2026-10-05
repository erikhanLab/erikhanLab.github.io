import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://sangseokhan.com";

const norm = (value = "") => value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

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

function routeFor(file) {
  const rel = path.relative(ROOT, file).replaceAll(path.sep, "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  return `/${rel}`;
}

function tagAttr(html, tag, attrName, attrValue, wanted) {
  const re = new RegExp(`<${tag}\\b[^>]*${attrName}=["']${attrValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`, "i");
  const m = html.match(re);
  if (!m) return "";
  const a = m[0].match(new RegExp(`${wanted}=["']([^"']*)["']`, "i"));
  return a?.[1]?.trim() || "";
}

function meta(html, name) { return tagAttr(html, "meta", "name", name, "content"); }
function prop(html, name) { return tagAttr(html, "meta", "property", name, "content"); }
function canonical(html) {
  const m = html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i);
  return m?.[0].match(/href=["']([^"']+)["']/i)?.[1]?.trim() || "";
}
function title(html) { return norm(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""); }
function h1s(html) { return [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => norm(m[1])); }
function ids(html) { return [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((m) => m[1]); }
function jsonLd(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
    try { return [JSON.parse(m[1])]; } catch { return []; }
  });
}
function hasType(value, type) {
  if (!value || typeof value !== "object") return false;
  if (value["@type"] === type) return true;
  if (Array.isArray(value["@graph"]) && value["@graph"].some((x) => hasType(x, type))) return true;
  return false;
}
function allMeta(html, name) {
  const matches = [...html.matchAll(new RegExp(`<meta\\b[^>]*name=["']${name}["'][^>]*>`, "gi"))];
  return matches.map((m) => m[0].match(/content=["']([^"']*)["']/i)?.[1] || "");
}
function localPathFromUrl(raw, baseRoute) {
  if (!raw || raw === "#" || raw.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(raw)) return null;
  const u = new URL(raw, SITE + baseRoute);
  if (u.origin !== SITE) return null;
  return decodeURIComponent(u.pathname);
}
async function existsForUrl(pathname) {
  if (pathname === "/") return stat(path.join(ROOT, "index.html")).then(() => true, () => false);
  const rel = pathname.replace(/^\//, "");
  const direct = path.join(ROOT, rel);
  if (path.extname(rel)) return stat(direct).then(() => true, () => false);
  const candidate = pathname.endsWith("/") ? path.join(ROOT, rel, "index.html") : path.join(ROOT, rel, "index.html");
  return stat(candidate).then(() => true, () => false);
}

const files = (await walk(ROOT)).filter((f) => f.endsWith(".html"));
const authored = files.filter((f) => !f.endsWith("googlef5cfb479256c421d.html") && !f.endsWith("404.html"));
const errors = [];
const indexable = [];
const seenCanonicals = new Map();

for (const file of authored) {
  const html = await readFile(file, "utf8");
  const route = routeFor(file);
  const can = canonical(html);
  const robots = meta(html, "robots").toLowerCase();
  const isIndexable = !robots.includes("noindex");
  const expected = SITE + route;

  if (!title(html)) errors.push(`${route}: missing <title>`);
  if (!meta(html, "author")) errors.push(`${route}: missing author meta`);
  if (can !== expected) errors.push(`${route}: canonical must be ${expected}, found ${can || "(missing)"}`);
  if (can) {
    if (seenCanonicals.has(can)) errors.push(`${route}: duplicate canonical also used by ${seenCanonicals.get(can)}`);
    seenCanonicals.set(can, route);
  }
  if (prop(html, "og:url") && prop(html, "og:url") !== expected) errors.push(`${route}: og:url does not match canonical route`);
  if (isIndexable) {
    indexable.push(can);
    if (!meta(html, "description")) errors.push(`${route}: indexable page missing description`);
    if (h1s(html).length !== 1) errors.push(`${route}: indexable page must have exactly one H1 (found ${h1s(html).length})`);
  }
  const pageIds = ids(html);
  if (new Set(pageIds).size !== pageIds.length) errors.push(`${route}: duplicate id attributes`);
  if (!html.includes('/assets/js/site-analytics.js')) errors.push(`${route}: shared analytics loader missing`);
  if (/googletagmanager\.com\/gtm\.js/i.test(html)) errors.push(`${route}: inline GTM loader found; use shared analytics loader`);

  const ogImage = prop(html, "og:image");
  if (ogImage) {
    const pathname = localPathFromUrl(ogImage, route);
    if (pathname && !(await existsForUrl(pathname))) errors.push(`${route}: missing og:image asset ${pathname}`);
  }

  // Internal links/assets referenced in HTML must resolve locally.
  for (const m of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const raw = m[1];
    if (raw.includes("${") || raw.includes("{{")) continue;
    const pathname = localPathFromUrl(raw, route);
    if (!pathname) continue;
    // canonical/self URLs are handled separately; query/hash is discarded by URL.
    if (!(await existsForUrl(pathname))) errors.push(`${route}: broken local reference ${raw}`);
  }

  if (/^\/publications\/[^/]+\/$/.test(route)) {
    const ct = meta(html, "citation_title");
    const authors = allMeta(html, "citation_author");
    if (!ct) errors.push(`${route}: missing citation_title`);
    if (ct && norm(ct) !== h1s(html)[0]) errors.push(`${route}: citation_title differs from visible H1`);
    if (!authors.length) errors.push(`${route}: missing citation_author`);
    if (!jsonLd(html).some((x) => hasType(x, "ScholarlyArticle"))) errors.push(`${route}: missing ScholarlyArticle JSON-LD`);
    const doiHref = html.match(/href=["']https:\/\/doi\.org\/([^"']+)["']/i)?.[1] || "";
    const citationDoi = meta(html, "citation_doi");
    if (doiHref && citationDoi !== doiHref) errors.push(`${route}: citation_doi (${citationDoi}) does not match visible DOI (${doiHref})`);
  }

  if (route === "/profile/" && !jsonLd(html).some((x) => hasType(x, "ProfilePage"))) errors.push(`/profile/: missing ProfilePage JSON-LD`);
  if (route === "/" && (!jsonLd(html).some((x) => hasType(x, "WebSite")) || !jsonLd(html).some((x) => hasType(x, "Person")))) errors.push(`/: missing WebSite/Person JSON-LD graph`);
}

// robots.txt must advertise sitemap and must not block authored pages from reading noindex.
const robotsTxt = await readFile(path.join(ROOT, "robots.txt"), "utf8");
if (!/Sitemap:\s*https:\/\/sangseokhan\.com\/sitemap\.xml/i.test(robotsTxt)) errors.push(`robots.txt: sitemap directive missing`);

// sitemap must exactly contain the canonical URLs of indexable HTML pages.
const sitemap = await readFile(path.join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).sort();
const expectedUrls = [...indexable].sort();
if (JSON.stringify(sitemapUrls) !== JSON.stringify(expectedUrls)) {
  errors.push(`sitemap.xml: expected ${expectedUrls.length} indexable URLs, found ${sitemapUrls.length}. Run npm run sitemap.`);
}

// 404 should exist and be noindex.
const notFound = await readFile(path.join(ROOT, "404.html"), "utf8");
if (!meta(notFound, "robots").toLowerCase().includes("noindex")) errors.push(`404.html: must be noindex`);

if (errors.length) {
  console.error(`FAIL: ${errors.length} site integrity issue(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`PASS: ${authored.length} authored pages; ${indexable.length} indexable; canonicals, scholarly metadata, sitemap, internal links/assets, analytics and structured data are consistent.`);
