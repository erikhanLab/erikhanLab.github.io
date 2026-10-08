import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const port = Number(process.env.PORT || 4173);
const mime = new Map([[".html","text/html; charset=utf-8"],[".css","text/css; charset=utf-8"],[".js","text/javascript; charset=utf-8"],[".svg","image/svg+xml"],[".png","image/png"],[".jpg","image/jpeg"],[".jpeg","image/jpeg"],[".ico","image/x-icon"],[".xml","application/xml; charset=utf-8"],[".txt","text/plain; charset=utf-8"]]);

const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    let rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    let file = path.join(ROOT, rel);
    const s = await stat(file).catch(() => null);
    if (!s || s.isDirectory()) file = path.join(file, "index.html");
    const safe = path.resolve(file);
    if (!safe.startsWith(ROOT)) throw new Error("unsafe path");
    const body = await readFile(safe);
    res.writeHead(200, { "content-type": mime.get(path.extname(safe).toLowerCase()) || "application/octet-stream" });
    res.end(body);
  } catch {
    const body = await readFile(path.join(ROOT, "404.html"));
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
  }
});
server.listen(port, () => console.log(`Preview: http://localhost:${port}`));
