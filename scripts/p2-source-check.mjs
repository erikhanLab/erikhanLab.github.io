import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (rel) => JSON.parse(await readFile(path.join(ROOT, rel), "utf8"));
const exists = async (rel) => access(path.join(ROOT, rel)).then(() => true, () => false);

const publications = await readJson("src/content/publications.json");
const person = await readJson("src/content/person.json");
const site = await readJson("src/content/site.json");
const routes = await readJson("src/content/routes.json");
const generatedPages = await readJson("src/content/generated-pages.json");

assert.equal(person.site, "https://sangseokhan.com");
assert.ok(person.name && person.profilePath && person.email && person.image && person.homePortrait);
assert.ok(person.profiles?.orcid && person.profiles?.googleScholar && person.profiles?.linkedin);
assert.ok(person.currentAppointment?.role?.en && person.currentAppointment?.schemaAffiliation);
assert.ok(person.profile?.field?.en && person.profile?.introLine1?.en && person.profile?.introLine2?.en);
assert.ok(site.homeFeaturedPublication && site.copyrightYear && site.lastUpdated?.en && site.footerField?.en);
assert.equal(new Set(site.navigation.map((x) => x.key)).size, site.navigation.length, "navigation keys must be unique");
assert.equal(publications.length, 7);
assert.equal(new Set(publications.map((p) => p.slug)).size, publications.length, "publication slugs must be unique");
assert.equal(routes.length, 17);
assert.equal(new Set(routes.map((r) => r.path)).size, routes.length, "routes must be unique");

for (const required of [
  "src/pages/404.html",
  "src/pages/home.html",
  "src/pages/profile.html",
  "src/components/site-shell.mjs",
  "src/components/profile-intro.html",
  "src/components/current-appointment.html",
  "src/components/home-affiliation.html",
  "src/components/home-featured-work.html",
  "src/templates/publications-index.html",
]) await stat(path.join(ROOT, required));

const sourceKinds = new Set(["generated-home", "generated-profile", "generated-publications", "generated-publication", "generated-content-page"]);
for (const route of routes) {
  assert.ok(sourceKinds.has(route.source), `${route.path}: unsupported/non-generated source kind ${route.source}`);
  if (!["/", "/archive/"].includes(route.path)) assert.ok(route.nav, `${route.path}: nav key required for managed route`);
}
assert.equal(routes.filter((r) => r.source.startsWith("generated")).length, routes.length, "every authored route must be source-generated");
assert.equal(routes.find((r) => r.path === "/")?.source, "generated-home");
assert.equal(routes.find((r) => r.path === "/profile/")?.source, "generated-profile");
assert.equal(routes.find((r) => r.path === "/publications/")?.source, "generated-publications");

const expectedContentPages = new Set([
  "/research/",
  "/research/timeline/",
  "/profile/writing/single-number/",
  "/research/log/",
  "/research/connection/",
  "/contact/",
  "/archive/",
]);
assert.equal(generatedPages.length, expectedContentPages.size, "generated content page manifest size mismatch");
assert.equal(new Set(generatedPages.map((p) => p.path)).size, generatedPages.length, "generated page paths must be unique");
assert.equal(new Set(generatedPages.map((p) => p.assetKey)).size, generatedPages.length, "generated page asset keys must be unique");
assert.deepEqual(new Set(generatedPages.map((p) => p.path)), expectedContentPages, "generated content page paths drifted");

for (const page of generatedPages) {
  const route = routes.find((r) => r.path === page.path);
  assert.equal(route?.source, "generated-content-page", `${page.path}: route must be generated-content-page`);
  assert.ok(page.shell && typeof page.shell.header === "boolean" && typeof page.shell.nav === "boolean" && typeof page.shell.footer === "boolean", `${page.path}: shell policy incomplete`);
  for (const file of [page.template, page.style, page.script]) await stat(path.join(ROOT, file));
  const template = await readFile(path.join(ROOT, page.template), "utf8");
  assert.ok(template.includes("<!--SITE_LANGUAGE_BOOTSTRAP-->"), `${page.path}: language bootstrap marker missing`);
  assert.equal(template.includes("<!--SITE_STANDARD_HEADER-->"), page.shell.header, `${page.path}: shared header marker/policy mismatch`);
  assert.equal(template.includes("<!--SITE_STANDARD_NAV-->"), page.shell.nav, `${page.path}: shared nav marker/policy mismatch`);
  assert.equal(template.includes("<!--SITE_STANDARD_FOOTER-->"), page.shell.footer, `${page.path}: shared footer marker/policy mismatch`);
  assert.ok(template.includes(`/assets/css/pages/${page.assetKey}.css?v=1`), `${page.path}: generated stylesheet link missing`);
  assert.ok(template.includes(`/assets/js/pages/${page.assetKey}.js?v=1`), `${page.path}: generated script link missing`);
  assert.ok(!/<style\b/i.test(template), `${page.path}: page CSS must live under src/styles/pages`);
  assert.ok((await readFile(path.join(ROOT, page.style), "utf8")).trim().length > 0, `${page.path}: page CSS is empty`);
  assert.ok((await readFile(path.join(ROOT, page.script), "utf8")).trim().length > 0, `${page.path}: page JavaScript is empty`);
}
const routeContentPages = new Set(routes.filter((r) => r.source === "generated-content-page").map((r) => r.path));
assert.deepEqual(routeContentPages, expectedContentPages, "route manifest content page set mismatch");

for (const p of publications) {
  assert.match(p.slug, /^[a-z0-9-]+$/);
  assert.ok(p.title && p.authors?.length && p.publicationDate && p.venue && p.description && p.ogDescription);
  assert.ok(["journal", "conference"].includes(p.kind));
  if (p.doi) assert.ok(!/^https?:\/\//i.test(p.doi), `${p.slug}: DOI must be bare DOI`);
  for (const file of ["authors.html", "affiliations.html", "abstract.html", "after-abstract.html", "publication-meta.html", "figures.html", "page.css"]) {
    await stat(path.join(ROOT, "src/publications", p.slug, file));
  }
  const route = routes.find((r) => r.path === `/publications/${p.slug}/`);
  assert.ok(route?.source === "generated-publication" && route.index === false, `${p.slug}: publication detail routes must remain noindex portfolio pages`);
}

const featured = publications.find((p) => p.slug === site.homeFeaturedPublication);
assert.ok(featured, "home featured publication must resolve to canonical publication data");
assert.ok(featured.presentation?.homeCitation?.desktopAuthorsHtml && featured.presentation?.homeCitation?.mobileAuthorsHtml, "home featured publication must define its compact citation presentation");
assert.equal(publications.filter((p) => p.kind === "journal").length, 4);
assert.equal(publications.filter((p) => p.kind === "conference").length, 3);

// P2-D has no authored HTML deployment snapshots outside src/. Static verification files/assets are allowed.
const obsoleteSnapshots = ["index.html", "404.html", "profile", "publications", "research", "contact", "archive", "robots.txt", "sitemap.xml"];
const legacyStillPresent = [];
for (const obsolete of obsoleteSnapshots) if (await exists(obsolete)) legacyStillPresent.push(obsolete);
if (legacyStillPresent.length) {
  throw new Error(
    `P2-D one-time migration is not finalized. Obsolete root snapshot(s): ${legacyStillPresent.join(", ")}. ` +
    `Run "npm run migrate:p2d" once; it verifies the replacement src/ tree before deleting only these generated/legacy copies, then runs the full test gate.`
  );
}
for (const requiredStatic of ["assets", "favicon.ico", "CNAME", "googlef5cfb479256c421d.html"]) assert.equal(await exists(requiredStatic), true, `required static source missing: ${requiredStatic}`);

console.log(`PASS: P2-D sources — all ${routes.length} authored routes are source-generated; ${generatedPages.length} content pages, ${publications.length} canonical publications, publication detail routes are noindex portfolio pages, shared identity/site data, and zero legacy HTML deployment snapshots are internally consistent.`);
