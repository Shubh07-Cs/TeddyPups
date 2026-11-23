// Mirrors the reference site (HTML, CSS, JS, images, videos, fonts) into ./_reference
// Run from the project folder:  node scripts/mirror.mjs
import fs from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://puppy.instabizweb.com";
const OUT = path.resolve("_reference");
const START = ["/", "/puppies", "/happy-families", "/gone-home", "/how-it-works", "/faq", "/contact"];
const MAX_PAGES = 120;

const pages = new Set(), assets = new Set(), failed = [];
const queue = [...START];
const ASSET_RE = /(?:["'(\s,]|^)(\/(?!\/)[^"'()\s,<>]*?\.(?:png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|mov|m4v|woff2?|ttf|otf|css|js|json|webmanifest|txt|xml))(?=["')\s,?#])/gi;
const IMG_RE = /\/_next\/image\?url=([^&"'\s]+)/g;
const LINK_RE = /href="(\/[^"#?]*)"/g;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130 Safari/537.36" } });
      if (r.ok) return r;
      if (r.status === 404) return null;
    } catch {}
    await sleep(800 * (i + 1));
  }
  return null;
}
async function save(rel, buf) {
  const file = path.join(OUT, "site", rel.split("?")[0]);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buf);
}
function harvest(text) {
  for (const m of text.matchAll(ASSET_RE)) assets.add(m[1]);
  for (const m of text.matchAll(IMG_RE)) assets.add(decodeURIComponent(m[1]));
}

await fs.mkdir(path.join(OUT, "pages"), { recursive: true });
while (queue.length && pages.size < MAX_PAGES) {
  const p = queue.shift();
  if (pages.has(p)) continue;
  pages.add(p);
  const r = await get(ORIGIN + p);
  if (!r || !(r.headers.get("content-type") || "").includes("text/html")) { failed.push(p); continue; }
  const html = await r.text();
  const name = p === "/" ? "index" : p.slice(1).replace(/\//g, "__");
  await fs.writeFile(path.join(OUT, "pages", name + ".html"), html);
  console.log("page", p);
  harvest(html);
  for (const m of html.matchAll(LINK_RE)) {
    const l = m[1].replace(/\/$/, "") || "/";
    if (!pages.has(l) && !/^\/(_next|cdn-cgi|brand|images?|media|videos?)\//.test(l) && !/\.[a-z0-9]{2,5}$/i.test(l)) queue.push(l);
  }
}

// assets (CSS/JS can reference more assets, so loop until stable)
const done = new Set();
for (let round = 0; round < 4; round++) {
  const todo = [...assets].filter((a) => !done.has(a));
  if (!todo.length) break;
  for (let i = 0; i < todo.length; i += 6) {
    await Promise.all(todo.slice(i, i + 6).map(async (a) => {
      done.add(a);
      const r = await get(ORIGIN + a);
      if (!r) { failed.push(a); return; }
      const buf = Buffer.from(await r.arrayBuffer());
      await save(a, buf);
      if (/\.(css|js|json|webmanifest)$/i.test(a.split("?")[0])) harvest(buf.toString("utf8"));
      process.stdout.write(".");
    }));
  }
}
await fs.writeFile(path.join(OUT, "manifest.json"), JSON.stringify({ pages: [...pages], assets: [...done], failed }, null, 2));
console.log(`\nDone: ${pages.size} pages, ${done.size - failed.length} assets saved, ${failed.length} failed -> _reference/manifest.json`);
