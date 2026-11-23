// Downloads media referenced by the reference site that the first mirror pass missed (puppy videos).
// Run: node scripts/fetch-missing.mjs
import fs from "node:fs/promises";
import path from "node:path";
const list = (await fs.readFile("scripts/missing.txt", "utf8")).split("\n").filter(Boolean);
for (const p of list) {
  const dest = path.join("public", p);
  try { await fs.access(dest); continue; } catch {}
  const r = await fetch("https://puppy.instabizweb.com" + p);
  if (!r.ok) { console.log("FAILED", r.status, p); continue; }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, Buffer.from(await r.arrayBuffer()));
  console.log("saved", p);
}
