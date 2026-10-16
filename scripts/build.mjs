import { cp, mkdir, readFile, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");
const manifest = JSON.parse(await readFile(join(root, "assets/manifest.json"), "utf8"));
const requiredFiles = ["index.html", "styles.css", "app.js", "content/site-content.json", "assets/manifest.json"];

for (const file of requiredFiles) await stat(join(root, file));

for (const category of manifest.categories) {
  for (const image of category.images) {
    const imageInfo = await stat(join(root, image.localPath));
    if (!imageInfo.isFile() || imageInfo.size === 0) throw new Error(`Missing or empty gallery image: ${image.localPath}`);
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const item of ["index.html", "styles.css", "app.js", "content", "assets"]) {
  await cp(join(root, item), join(output, item), { recursive: true });
}

const count = manifest.categories.reduce((sum, category) => sum + category.images.length, 0);
console.log(`Built ${manifest.categories.length} gallery categories and ${count} local images into dist/.`);