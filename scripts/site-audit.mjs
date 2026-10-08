import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderStandardHeader, renderStandardNav, renderStandardFooter } from "../src/components/site-shell.mjs";

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.join(PROJECT, "dist");
const SITE = "https://sangseokhan.com";
const publications = JSON.parse(await readFile(path.join(PROJECT, "src/content/publications.json"), "utf8"));
const person = JSON.parse(await readFile(path.join(PROJECT, "src/content/person.json"), "utf8"));
const site = JSON.parse(await readFile(path.join(PROJECT, "src/content/site.json"), "utf8"));
const routes = JSON.parse(await readFile(path.join(PROJECT, "src/content/routes.json"), "utf8"));
const generatedPages = JSON.parse(await readFile(path.join(PROJECT, "src/content/generated-pages.json"), "utf8"));

const norm = (value = "") => value.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = path.join(dir, name);
    const s = await stat(full);
    if (s.isDirectory()) out.push(...(await walk(full))); else out.push(full);
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
  return m[0].match(new RegExp(`${wanted}=["']([^"']*)["']`, "i"))?.[1]?.trim() || "";
}
const meta = (html, name) => tagAttr(html, "meta", "name", name, "content");
const prop = (html, name) => tagAttr(html, "meta", "property", name, "content");
const canonical = (html) => html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i)?.[0]?.match(/href=["']([^"']+)["']/i)?.[1]?.trim() || "";
const title = (html) => norm(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
const h1s = (html) => [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => norm(m[1]));
const ids = (html) => [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((m) => m[1]);
function jsonLd(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => { try { return [JSON.parse(m[1])]; } catch { return []; } });
}
function hasType(value, type) {
  if (!value || typeof value !== "object") return false;
  if (value["@type"] === type) return true;
  return Array.isArray(value["@graph"]) && value["@graph"].some((x) => hasType(x, type));
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
  return stat(path.join(ROOT, rel, "index.html")).then(() => true, () => false);
}

const files = (await walk(ROOT)).filter((f) => f.endsWith(".html"));
const authored = files.filter((f) => !f.endsWith("googlef5cfb479256c421d.html") && !f.endsWith("404.html"));
const errors = [];
const routeMap = new Map(routes.map((r) => [r.path, r]));
const seenRoutes = new Set();
const indexable = [];

for (const file of authored) {
  const html = await readFile(file, "utf8");
  const route = routeFor(file);
  const policy = routeMap.get(route);
  seenRoutes.add(route);
  if (!policy) errors.push(`${route}: missing from src/content/routes.json`);
  const can = canonical(html);
  const expected = SITE + route;
  const robots = meta(html, "robots").toLowerCase();
  const isIndexable = !robots.includes("noindex");
  if (!title(html)) errors.push(`${route}: missing title`);
  if (!meta(html, "author")) errors.push(`${route}: missing author meta`);
  if (can !== expected) errors.push(`${route}: canonical must be ${expected}, found ${can || "(missing)"}`);
  if (policy && policy.index !== isIndexable) errors.push(`${route}: robots policy disagrees with route manifest`);
  if (prop(html, "og:url") && prop(html, "og:url") !== expected) errors.push(`${route}: og:url mismatch`);
  if (isIndexable) {
    indexable.push(can);
    if (!meta(html, "description")) errors.push(`${route}: indexable page missing description`);
    if (h1s(html).length !== 1) errors.push(`${route}: indexable page must have exactly one H1 (found ${h1s(html).length})`);
  }
  const pageIds = ids(html);
  if (new Set(pageIds).size !== pageIds.length) errors.push(`${route}: duplicate id attributes`);
  if (!html.includes('/assets/js/site-analytics.js')) errors.push(`${route}: shared analytics loader missing`);
  for (const m of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const raw = m[1];
    if (raw.includes("${") || raw.includes("{{")) continue;
    const pathname = localPathFromUrl(raw, route);
    if (pathname && !(await existsForUrl(pathname))) errors.push(`${route}: broken local reference ${raw}`);
  }
}
for (const route of routes) if (!seenRoutes.has(route.path)) errors.push(`${route.path}: route manifest entry missing from dist`);

// Source-owned shared shell must survive the build exactly where each page policy requests it.
for (const route of routes.filter((r) => ["generated-profile", "generated-publications"].includes(r.source))) {
  const file = path.join(ROOT, route.path.replace(/^\//, ""), "index.html");
  const html = await readFile(file, "utf8");
  if (!html.includes(renderStandardHeader(person))) errors.push(`${route.path}: shared header drifted from component source`);
  if (!html.includes(renderStandardNav(site, route.nav))) errors.push(`${route.path}: shared navigation drifted from component source`);
  if (!html.includes(renderStandardFooter(person, site))) errors.push(`${route.path}: shared footer drifted from component source`);
}
for (const page of generatedPages) {
  const route = routes.find((r) => r.path === page.path);
  const file = page.path === "/" ? path.join(ROOT, "index.html") : path.join(ROOT, page.path.replace(/^\//, ""), "index.html");
  const html = await readFile(file, "utf8");
  if (page.shell?.header && !html.includes(renderStandardHeader(person))) errors.push(`${page.path}: shared header drifted from component source`);
  if (page.shell?.nav && !html.includes(renderStandardNav(site, route.nav))) errors.push(`${page.path}: shared navigation drifted from component source`);
  if (page.shell?.footer && !html.includes(renderStandardFooter(person, site))) errors.push(`${page.path}: shared footer drifted from component source`);
}

for (const file of authored) {
  const html = await readFile(file, "utf8");
  const route = routeFor(file);
  if (/__[A-Z0-9_]+__|<!--(?:P2[BCD]?_|SITE_)/i.test(html)) errors.push(`${route}: unresolved source template marker in dist`);
}

// Authored content pages must come from src/ and emit their page assets verbatim.
for (const page of generatedPages) {
  const file = page.path === "/" ? path.join(ROOT, "index.html") : path.join(ROOT, page.path.replace(/^\//, ""), "index.html");
  const html = await readFile(file, "utf8");
  const cssHref = `/assets/css/pages/${page.assetKey}.css?v=1`;
  const jsSrc = `/assets/js/pages/${page.assetKey}.js?v=1`;
  if (!html.includes(`href="${cssHref}"`)) errors.push(`${page.path}: generated stylesheet link missing`);
  if (!html.includes(`src="${jsSrc}"`)) errors.push(`${page.path}: generated script link missing`);
  if (/<style\b/i.test(html)) errors.push(`${page.path}: page-local CSS leaked back inline`);
  const sourceCss = await readFile(path.join(PROJECT, page.style), "utf8");
  const builtCss = await readFile(path.join(ROOT, "assets", "css", "pages", `${page.assetKey}.css`), "utf8");
  if (builtCss !== sourceCss) errors.push(`${page.path}: built page CSS differs from source`);
  const sourceJs = await readFile(path.join(PROJECT, page.script), "utf8");
  const builtJs = await readFile(path.join(ROOT, "assets", "js", "pages", `${page.assetKey}.js`), "utf8");
  if (builtJs !== sourceJs) errors.push(`${page.path}: built page JavaScript differs from source`);
}

// Publication detail pages are portfolio pages, not scholarly-hosting/index targets.
// Keep their visible bibliographic information canonical, while forbidding Scholar-oriented machine signals.
const pubIndex = await readFile(path.join(ROOT, "publications", "index.html"), "utf8");
for (const p of publications) {
  const route = `/publications/${p.slug}/`;
  const html = await readFile(path.join(ROOT, "publications", p.slug, "index.html"), "utf8");
  const routePolicy = routeMap.get(route);
  if (h1s(html)[0] !== p.title) errors.push(`${route}: visible H1 differs from canonical publication title`);
  if (routePolicy?.index !== false) errors.push(`${route}: publication detail must remain noindex in route manifest`);
  if (!meta(html, "robots").toLowerCase().includes("noindex")) errors.push(`${route}: publication detail must emit noindex`);
  if (!meta(html, "bingbot").toLowerCase().includes("noindex")) errors.push(`${route}: Bing publication detail policy must emit noindex`);
  const scholarMeta = [...html.matchAll(/<meta\b[^>]*name=["'](?:citation_|bepress_citation_|prism\.)[^"']*["'][^>]*>/gi)];
  if (scholarMeta.length) errors.push(`${route}: Scholar-oriented bibliographic meta tags are forbidden`);
  if (jsonLd(html).some((x) => hasType(x, "ScholarlyArticle"))) errors.push(`${route}: ScholarlyArticle JSON-LD is forbidden`);
  if (prop(html, "og:type").toLowerCase() === "article") errors.push(`${route}: publication portfolio detail should not advertise itself as an article object`);
  if (!pubIndex.includes(`data-publication-slug="${p.slug}"`)) errors.push(`/publications/: missing ${p.slug}`);
  if (!pubIndex.includes(`/publications/${p.slug}/`)) errors.push(`/publications/: missing link to ${p.slug}`);
}
const renderedCards = [...pubIndex.matchAll(/data-publication-slug="([^"]+)"/g)].map((m) => m[1]);
if (renderedCards.length !== publications.length || new Set(renderedCards).size !== publications.length) errors.push(`/publications/: generated card count/uniqueness mismatch`);

const home = await readFile(path.join(ROOT, "index.html"), "utf8");
const profile = await readFile(path.join(ROOT, "profile", "index.html"), "utf8");
if (!jsonLd(home).some((x) => hasType(x, "WebSite")) || !jsonLd(home).some((x) => hasType(x, "Person"))) errors.push(`/: missing WebSite/Person JSON-LD`);
if (!jsonLd(profile).some((x) => hasType(x, "ProfilePage"))) errors.push(`/profile/: missing ProfilePage JSON-LD`);
if (!home.includes(`mailto:${person.email}`) || !home.includes(person.currentAppointment.role.en)) errors.push(`/: person identity/current appointment drifted from src/content/person.json`);
const featured = publications.find((p) => p.slug === site.homeFeaturedPublication);
if (!featured || !home.includes(`/publications/${featured.slug}/`) || !home.includes(featured.title) || (featured.doi && !home.includes(`https://doi.org/${featured.doi}`))) errors.push(`/: selected work drifted from canonical publication data`);
for (const url of Object.values(person.profiles)) if (!profile.includes(url)) errors.push(`/profile/: missing canonical profile URL ${url}`);
if (!profile.includes(`mailto:${person.email}`) || !profile.includes(person.currentAppointment.institute.en) || !profile.includes(person.currentAppointment.period.en)) errors.push(`/profile/: identity/current appointment drifted from src/content/person.json`);

const sitemap = await readFile(path.join(ROOT, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()).sort();
const expectedUrls = routes.filter((r) => r.index).map((r) => SITE + r.path).sort();
if (JSON.stringify(sitemapUrls) !== JSON.stringify(expectedUrls)) errors.push(`sitemap.xml: expected ${expectedUrls.length} URLs, found ${sitemapUrls.length}`);
const robotsTxt = await readFile(path.join(ROOT, "robots.txt"), "utf8");
if (!robotsTxt.includes(`Sitemap: ${SITE}/sitemap.xml`)) errors.push(`robots.txt: sitemap directive missing`);
const notFound = await readFile(path.join(ROOT, "404.html"), "utf8");
if (!meta(notFound, "robots").toLowerCase().includes("noindex")) errors.push(`404.html: must be noindex`);

if (errors.length) {
  console.error(`FAIL: ${errors.length} P2 build issue(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`PASS: P2-D dist — ${authored.length} authored routes, ${indexable.length} indexable; all routes are source-generated, shared shell policies hold, ${generatedPages.length} content pages and ${publications.length} publication records match canonical sources, publication detail pages carry no Scholar-oriented indexing signals, and canonicals/sitemap/links/assets are consistent.`);
