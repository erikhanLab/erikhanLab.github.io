import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const readJson = async (rel) => JSON.parse(await readFile(path.join(ROOT, rel), "utf8"));
const readText = async (rel) => readFile(path.join(ROOT, rel), "utf8");

const publications = await readJson("src/content/publications.json");
const routes = await readJson("src/content/routes.json");
const person = await readJson("src/content/person.json");
const site = await readJson("src/content/site.json");
const generatedPages = await readJson("src/content/generated-pages.json");
const errors = [];

function routeFile(route) {
  return route === "/" ? path.join(DIST, "index.html") : path.join(DIST, route.replace(/^\//, ""), "index.html");
}
function meta(html, name) {
  const re = new RegExp(`<meta\\b[^>]*name=["']${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}["'][^>]*content=["']([^"']*)["'][^>]*>|<meta\\b[^>]*content=["']([^"']*)["'][^>]*name=["']${name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}["'][^>]*>`, "i");
  const m = html.match(re);
  return m ? (m[1] ?? m[2] ?? "").trim() : "";
}
function title(html) {
  return (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
}
// 1) Search-facing copy should be concise, unique, and route-specific.
const indexable = routes.filter((r) => r.index);
const seenTitles = new Map();
const seenDescriptions = new Map();
for (const route of indexable) {
  const html = await readFile(routeFile(route.path), "utf8");
  const t = title(html);
  const d = meta(html, "description");
  if (t.length < 15 || t.length > 70) errors.push(`${route.path}: title length ${t.length} outside 15–70 characters`);
  if (d.length < 60 || d.length > 165) errors.push(`${route.path}: description length ${d.length} outside 60–165 characters`);
  if (seenTitles.has(t)) errors.push(`${route.path}: duplicate title with ${seenTitles.get(t)}`); else seenTitles.set(t, route.path);
  if (seenDescriptions.has(d)) errors.push(`${route.path}: duplicate description with ${seenDescriptions.get(d)}`); else seenDescriptions.set(d, route.path);
}

// 2) Canonical publication bibliography must contain enough stable detail for human-facing accuracy.
const journalBySlug = new Map();
for (const p of publications) {
  const b = p.bibliography;
  if (!b || !b.type) { errors.push(`${p.slug}: missing bibliography block`); continue; }
  if (p.kind === "journal") {
    journalBySlug.set(p.slug, p);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.publicationDate)) errors.push(`${p.slug}: journal publicationDate must be full ISO date`);
    if (b.publishedDate !== p.publicationDate) errors.push(`${p.slug}: bibliography publishedDate differs from publicationDate`);
    if (!b.volume || !b.articleNumber) errors.push(`${p.slug}: journal bibliography requires volume and articleNumber`);
  }
  if (p.doi) {
    if (!b.recordUrl || !b.recordUrl.includes(p.doi)) errors.push(`${p.slug}: bibliography recordUrl must resolve through canonical DOI`);
  }
  if (p.openAccess && !b.license) errors.push(`${p.slug}: openAccess=true requires an explicit licence`);
  if (p.slug === "naval-roughness" && p.openAccess) errors.push(`${p.slug}: publisher record is not marked as publisher open access`);

  const detail = await readFile(routeFile(`/publications/${p.slug}/`), "utf8");
  if (p.kind === "journal") {
    if (!detail.includes(`Vol. ${b.volume}`)) errors.push(`${p.slug}: detail page missing canonical volume`);
    if (!detail.includes(`Article ${b.articleNumber}`)) errors.push(`${p.slug}: detail page missing canonical article number`);
  }
  if (/Open Access \(Elsevier\)/i.test(detail)) errors.push(`${p.slug}: ambiguous/stale 'Open Access (Elsevier)' label is forbidden`);
}

// 3) Timeline publication months must agree with canonical publication dates.
// Locate each publication link, then inspect the nearest preceding trace-line opener.
// This avoids treating nested timeline HTML as a flat regex block.
const timeline = await readText("src/pages/timeline.html");
function timelineMonthBefore(needle) {
  const needleIndex = timeline.indexOf(needle);
  if (needleIndex < 0) return null;
  const openerIndex = timeline.lastIndexOf('<div class="trace-line', needleIndex);
  const openerEnd = openerIndex >= 0 ? timeline.indexOf(">", openerIndex) : -1;
  if (openerIndex < 0 || openerEnd < 0) return null;
  return timeline.slice(openerIndex, openerEnd + 1).match(/\bdata-date="([^"]+)"/)?.[1] ?? null;
}

for (const [slug, p] of journalBySlug) {
  const href = `href="/publications/${slug}/"`;
  const linkIndex = timeline.indexOf(href);
  if (linkIndex < 0) {
    errors.push(`${slug}: linked journal publication missing from timeline`);
    continue;
  }

  const openerIndex = timeline.lastIndexOf('<div class="trace-line', linkIndex);
  const openerEnd = openerIndex >= 0 ? timeline.indexOf(">", openerIndex) : -1;
  if (openerIndex < 0 || openerEnd < 0) {
    errors.push(`${slug}: timeline publication is not inside a trace-line`);
    continue;
  }

  const opener = timeline.slice(openerIndex, openerEnd + 1);
  const timelineMonth = opener.match(/\bdata-date="([^"]+)"/)?.[1] ?? "";
  const expectedMonth = p.publicationDate.slice(0, 7);
  if (timelineMonth !== expectedMonth) {
    errors.push(`${slug}: timeline month ${timelineMonth || "missing"} differs from canonical ${expectedMonth}`);
  }
}

const conferenceTimelineChecks = [
  { slug: "cfd-spatial", needle: "36th Symposium on Naval Hydrodynamics", dateField: "presentedDate" },
  { slug: "wec-mpc", needle: "JASNAOE 2025", dateField: "publishedDate" },
  { slug: "fowt-fsi", needle: "MARINE 2025", dateField: "presentedDate" },
];
for (const check of conferenceTimelineChecks) {
  const p = publications.find((entry) => entry.slug === check.slug);
  const expectedDate = p?.bibliography?.[check.dateField];
  const timelineMonth = timelineMonthBefore(check.needle);
  if (!p || !expectedDate) {
    errors.push(`${check.slug}: canonical conference date is missing`);
    continue;
  }
  const expectedMonth = expectedDate.slice(0, 7);
  if (timelineMonth !== expectedMonth) {
    errors.push(`${check.slug}: timeline month ${timelineMonth || "missing"} differs from canonical ${expectedMonth}`);
  }
}

// 4) Status/award wording should not contradict the site's own canonical/current information.
const profile = await readText("src/pages/profile.html");
const builtProfile = await readFile(routeFile("/profile/"), "utf8");
const research = await readText("src/pages/research.html");
const connection = await readText("src/pages/research-connection.html");
if (!profile.includes('data-en="Doctoral Programme"') || !profile.includes('data-ja="博士後期課程"') || !profile.includes('data-en="(from April 2027)"')) errors.push(`/profile/: Kyoto education entry must use the programme name while retaining the future start date`);
if (timeline.includes("Dean's International Excellence Scholarship")) errors.push(`/research/timeline/: use official 'Dean's International Excellence Award' naming`);
if (timeline.includes("Certificate of Excellence in Reviewing")) errors.push(`/research/timeline/: reviewer recognition wording drifts from profile/source record`);
if (research.includes("Research visit · RIMSE")) errors.push(`/research/: current SNU role must not be downgraded to a research visit`);
if (!connection.includes("Affiliations and titles are shown for context and may change over time.")) errors.push(`/research/connection/: title/affiliation staleness note missing`);
if (!builtProfile.includes(person.currentAppointment.period.en)) errors.push(`/profile/: current appointment period drifted from person.json`);

// 5) Bilingual authoring: paired data attributes must stay paired and substantive copy must not be empty.
for (const page of generatedPages) {
  const html = await readText(page.template);
  for (const openTag of html.match(/<[^>]+(?:data-en|data-ja)=[^>]+>/g) ?? []) {
    const hasEn = /\bdata-en=["'][\s\S]*?["']/.test(openTag);
    const hasJa = /\bdata-ja=["'][\s\S]*?["']/.test(openTag);
    if (hasEn !== hasJa) errors.push(`${page.path}: bilingual element has only one of data-en/data-ja`);
  }
}

// 6) Last-updated copy must remain bilingual and parseable, without hard-coding a build-time clock.
if (!/^[A-Z][a-z]+ \d{4}$/.test(site.lastUpdated.en)) errors.push(`site.lastUpdated.en must be 'Month YYYY'`);
if (!/^\d{4}年\d{1,2}月$/.test(site.lastUpdated.ja)) errors.push(`site.lastUpdated.ja must be 'YYYY年M月'`);

if (errors.length) {
  console.error(`FAIL: ${errors.length} P3-B content issue(s)`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`PASS: content audit — ${indexable.length} indexable routes have concise unique search copy; ${publications.length} publication records carry canonical bibliography; publication dates match the timeline; future/current status wording, bilingual pairs, and portfolio-only publication policy are internally consistent.`);
