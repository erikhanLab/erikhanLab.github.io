import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const routes = JSON.parse(await readFile(path.join(ROOT, "src/content/routes.json"), "utf8"));

const routeFile = (route) => route === "/"
  ? path.join(DIST, "index.html")
  : path.join(DIST, route.replace(/^\//, ""), "index.html");

const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi"))].map((m) => m[0]);
const attr = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i"));
  return match ? (match[1] ?? match[2] ?? "") : null;
};

let imageCount = 0;
let lazyImageCount = 0;
let externalBlankCount = 0;

for (const route of routes) {
  const html = await readFile(routeFile(route.path), "utf8");
  const label = route.path;

  const mains = tags(html, "main").filter((tag) => attr(tag, "id") === "main-content");
  assert.equal(mains.length, 1, `${label}: exactly one #main-content landmark required`);

  const h1s = tags(html, "h1");
  assert.equal(h1s.length, 1, `${label}: exactly one h1 required`);

  const skip = '<a class="skip-link" href="#main-content">Skip to main content</a>';
  assert.ok(html.includes(skip), `${label}: skip-to-content link missing`);
  assert.ok(html.indexOf(skip) < html.indexOf('<main'), `${label}: skip link must precede main content`);

  const divNav = tags(html, "div").some((tag) => (attr(tag, "class") || "").split(/\s+/).includes("nav"));
  assert.ok(!divNav, `${label}: primary .nav must use semantic <nav>`);

  for (const tag of tags(html, "img")) {
    imageCount += 1;
    assert.notEqual(attr(tag, "alt"), null, `${label}: img missing alt attribute: ${tag}`);
    assert.ok(attr(tag, "width") && attr(tag, "height"), `${label}: img missing intrinsic dimensions: ${tag}`);
    assert.equal(attr(tag, "decoding"), "async", `${label}: img should use decoding=async: ${tag}`);
    if (attr(tag, "loading") === "lazy") lazyImageCount += 1;
  }

  for (const tag of tags(html, "a")) {
    if (attr(tag, "target") !== "_blank") continue;
    externalBlankCount += 1;
    const rel = (attr(tag, "rel") || "").split(/\s+/);
    assert.ok(rel.includes("noopener"), `${label}: target=_blank link missing rel=noopener: ${tag}`);
  }

  assert.ok(!/\.gif(?:["'?#<])/i.test(html), `${label}: production HTML must not reference animated GIF assets`);
}

const shellCss = await readFile(path.join(DIST, "assets/css/site-shell.css"), "utf8");
assert.match(shellCss, /\.skip-link\s*\{/, "site-shell.css: skip-link styling missing");
assert.match(shellCss, /prefers-reduced-motion:\s*reduce/, "site-shell.css: reduced-motion safeguard missing");

const home = await readFile(path.join(DIST, "index.html"), "utf8");
assert.match(home, /Home-spain\.webp/, "home: WebP portrait source missing");
assert.match(home, /Home-spain\.png[^>]*width="1303"[^>]*height="1207"/, "home: portrait dimensions missing");
assert.match(home, /prefers-reduced-motion:\s*reduce/, "home: reduced-motion safeguard missing");

const profile = await readFile(path.join(DIST, "profile/index.html"), "utf8");
assert.match(profile, /profile-portrait\.webp/, "profile: WebP portrait source missing");
assert.match(profile, /profile-portrait\.png[^>]*width="348"[^>]*height="478"/, "profile: portrait dimensions missing");

const contact = await readFile(path.join(DIST, "contact/index.html"), "utf8");
assert.match(contact, /contact-snh36\.webp/, "contact: WebP portrait source missing");
assert.match(contact, /contact-snh36\.png[^>]*width="323"[^>]*height="323"/, "contact: portrait dimensions missing");
const videos = tags(contact, "video");
assert.equal(videos.length, 2, "contact: expected two optimized motion videos");
for (const video of videos) {
  assert.equal(attr(video, "preload"), "none", "contact: motion video must use preload=none");
  assert.equal(attr(video, "width"), "1440", "contact: motion video width missing");
  assert.equal(attr(video, "height"), "1080", "contact: motion video height missing");
  assert.ok(attr(video, "poster")?.endsWith("-poster.jpg"), "contact: motion video poster missing");
}
assert.equal((contact.match(/type="video\/webm"/g) || []).length, 2, "contact: WebM sources missing");
assert.equal((contact.match(/type="video\/mp4"/g) || []).length, 2, "contact: MP4 fallback sources missing");

for (const route of routes.filter((r) => r.source === "generated-publication")) {
  const html = await readFile(routeFile(route.path), "utf8");
  const figures = tags(html, "img").filter((tag) => (attr(tag, "src") || "").startsWith("/assets/publications/"));
  for (const tag of figures) {
    assert.equal(attr(tag, "loading"), "lazy", `${route.path}: publication figure must lazy-load`);
    assert.equal(attr(tag, "decoding"), "async", `${route.path}: publication figure must decode asynchronously`);
  }
}

const favicon = await readFile(path.join(DIST, "assets/favicon-32.png"));
assert.ok(favicon.length < 10_000, `favicon-32.png unexpectedly large: ${favicon.length} bytes`);
assert.equal(favicon.toString("ascii", 1, 4), "PNG", "favicon-32.png is not PNG");
assert.equal(favicon.readUInt32BE(16), 32, "favicon-32.png width must be 32");
assert.equal(favicon.readUInt32BE(20), 32, "favicon-32.png height must be 32");

for (const obsolete of ["fowt-pitch.gif", "wec-cfd-mbd.gif"]) {
  try {
    await stat(path.join(DIST, "assets/research", obsolete));
    assert.fail(`obsolete production GIF still present: ${obsolete}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

for (const rel of [
  "assets/research/fowt-pitch.webm",
  "assets/research/fowt-pitch.mp4",
  "assets/research/fowt-pitch-poster.jpg",
  "assets/research/wec-cfd-mbd.webm",
  "assets/research/wec-cfd-mbd.mp4",
  "assets/research/wec-cfd-mbd-poster.jpg",
  "assets/Home-spain.webp",
  "assets/etc/profile-portrait.webp",
  "assets/etc/contact-snh36.webp",
]) {
  const info = await stat(path.join(DIST, rel));
  assert.ok(info.size > 0, `${rel}: optimized asset is empty`);
}

const researchAssetDir = path.join(DIST, "assets/research");
const optimizedVideoBytes = (await Promise.all([
  stat(path.join(researchAssetDir, "fowt-pitch.webm")),
  stat(path.join(researchAssetDir, "wec-cfd-mbd.webm")),
])).reduce((sum, x) => sum + x.size, 0);
assert.ok(optimizedVideoBytes < 2_000_000, `preferred WebM motion payload too large: ${optimizedVideoBytes} bytes`);

console.log(
  `PASS: quality audit — ${routes.length} routes have main landmarks, skip links, single h1s and safe external links; ` +
  `${imageCount} images have alt text (${lazyImageCount} lazy-loaded); two large GIFs are replaced by lazy video delivery; ` +
  `32px favicon and modern portrait sources verified.`
);
