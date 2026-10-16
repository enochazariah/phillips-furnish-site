import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = async (path) => JSON.parse(await readFile(join(root, path), "utf8"));

test("gallery manifest has five categories with five verified local assets each", async () => {
  const manifest = await readJson("assets/manifest.json");
  assert.equal(manifest.categories.length, 5);
  for (const category of manifest.categories) {
    assert.equal(category.images.length, 5, category.id);
    for (const image of category.images) {
      assert.equal(image.verificationStatus, "verified", image.id);
      assert.match(image.sourceUrl, /^https:\/\/www\.pexels\.com\/photo\//);
      assert.ok(image.credit.includes("Pexels"));
      assert.ok((await stat(join(root, image.localPath))).size > 0, image.localPath);
    }
  }
});

test("contact details remain unset until confirmed", async () => {
  const content = await readJson("content/site-content.json");
  assert.equal(content.contact.email, null);
  assert.equal(content.contact.phone, null);
  assert.equal(content.contact.address, null);
  assert.match(content.contact.noteMessage, /not sent/i);
  assert.equal(content.testimonials.length, 10);
  assert.ok(content.testimonials.every((item) => item.name && item.project && item.quote));
});

test("page omits unconfirmed services and project disclaimers", async () => {
  const html = await readFile(join(root, "index.html"), "utf8");
  const content = await readJson("content/site-content.json");
  assert.doesNotMatch(html, /licensed reference images|not a Phillips Furnish Limited project|not company projects|not a company project/i);
  assert.doesNotMatch(await readFile(join(root, "app.js"), "utf8"), /not a company project|not a Phillips Furnish Limited project/i);
  assert.equal("services" in content, false);
});

test("page includes semantic navigation, contact form, and accessible gallery controls", async () => {
  const html = await readFile(join(root, "index.html"), "utf8");
  for (const id of ["main", "about", "gallery", "testimonials", "testimonial-list", "contact", "contact-form", "lightbox"]) {
    assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
  }
  assert.ok(html.includes("Skip to content"));
  assert.ok(html.includes("aria-label=\"Filter visual reference gallery\""));
  assert.ok(html.includes("alt=\"Woodworker using a chisel and mallet in a workshop while wearing protective glasses.\""));
  assert.match(html, /<section class="testimonials-section" id="testimonials" aria-labelledby="testimonials-title">[\s\S]*?<p id="testimonials-title" class="eyebrow">Client perspectives<\/p>/);
  assert.doesNotMatch(html, /Furniture for <em>real spaces\.<\/em>/);
});

test("contact form keeps clear fields and shows honest email-delivery status", async () => {
  const html = await readFile(join(root, "index.html"), "utf8");
  const app = await readFile(join(root, "app.js"), "utf8");
  for (const label of ["Your name", "Email address", "Room or area", "Approximate timing", "A little about the space"]) {
    assert.ok(html.includes(label), `missing form label: ${label}`);
  }
  for (const placeholder of ["Your name", "you@example.com", "The room, the need, or the idea you have in mind"]) {
    assert.ok(html.includes(`placeholder="${placeholder}"`), `missing placeholder: ${placeholder}`);
  }
  assert.match(html, /<select id="timing" name="timing">\s*<option value="">Choose a timeframe<\/option>/);
  for (const unit of ["week", "month", "year"]) {
    for (let amount = 1; amount <= 5; amount += 1) {
      const timing = `${amount} ${unit}${amount === 1 ? "" : "s"}`;
      assert.ok(html.includes(`value="${timing}">${timing}</option>`), `missing timing option: ${timing}`);
    }
  }
  assert.ok(html.includes("Your enquiry has <strong>not been sent or saved.</strong>"));
  assert.ok(html.includes("email backend is connected"));
  assert.ok(html.includes("reach Mr. Philip by email"));
  assert.doesNotMatch(html, /Prepare note|Copy note|contact-note/);
  assert.doesNotMatch(app, /FormData|navigator\.clipboard|copy-note/);
});

test("developer attribution appears in header and footer with secure exact links", async () => {
  const html = await readFile(join(root, "index.html"), "utf8");
  const creditMatches = html.match(/Designed &amp; built by/g) || [];
  const links = html.match(/<a href="https:\/\/mylandingpage-alpha\.vercel\.app\/" target="_blank" rel="noopener noreferrer" aria-label="Enoch Azariah \(opens in a new tab\)">Enoch Azariah<\/a>/g) || [];
  const visitLinks = html.match(/<a class="developer-website-link" href="https:\/\/mylandingpage-alpha\.vercel\.app\/" target="_blank" rel="noopener noreferrer">Visit developer website ↗<\/a>/g) || [];
  assert.equal(creditMatches.length, 2);
  assert.equal(links.length, 2);
  assert.equal(visitLinks.length, 2);
});