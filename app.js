const contentPath = "content/site-content.json";
const manifestPath = "assets/manifest.json";
const galleryGrid = document.querySelector("#gallery-grid");
const galleryFilters = document.querySelector("#gallery-filters");
const galleryStatus = document.querySelector("#gallery-status");
const galleryEmpty = document.querySelector("#gallery-empty");
const galleryCount = document.querySelector("#gallery-count");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightbox-image");
const lightboxFallback = document.querySelector("#lightbox-fallback");
let galleryItems = [];
let activeCategory = "";
let activeIndex = 0;
let lastOpenedButton = null;

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status}).`);
  return response.json();
}

function showLoadError(element, message) {
  element.classList.add("load-error");
  element.textContent = message;
}

function flattenGallery(manifest) {
  return manifest.categories.flatMap((category) => category.images.map((image) => ({
    ...image,
    categoryId: category.id,
    categoryTitle: category.title
  })));
}

function renderGalleryFilters(categories) {
  galleryFilters.replaceChildren(...[
    { id: "all", title: "All references" },
    ...categories
  ].map((category, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.dataset.category = category.id;
    button.setAttribute("aria-pressed", String(index === 0));
    button.textContent = category.title;
    button.addEventListener("click", () => selectCategory(category.id));
    return button;
  }));
}

function makePhotoCard(item, index) {
  const figure = document.createElement("figure");
  figure.className = "photo-card";
  figure.dataset.category = item.categoryId;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "photo-open";
  button.setAttribute("aria-label", `Open ${item.title}`);
  button.dataset.galleryIndex = String(index);

  const imageWrap = document.createElement("span");
  imageWrap.className = "photo-image-wrap";
  const image = document.createElement("img");
  image.src = item.localPath;
  image.alt = item.title;
  image.loading = "lazy";
  image.decoding = "async";
  const fallback = document.createElement("span");
  fallback.className = "image-fallback";
  fallback.textContent = "Reference image unavailable";
  fallback.hidden = true;
  image.addEventListener("error", () => {
    image.hidden = true;
    fallback.hidden = false;
  }, { once: true });

  const overlay = document.createElement("span");
  overlay.className = "photo-overlay";
  const title = document.createElement("span");
  title.textContent = item.title;
  const openIcon = document.createElement("span");
  openIcon.setAttribute("aria-hidden", "true");
  openIcon.textContent = "+";
  overlay.append(title, openIcon);
  imageWrap.append(image, fallback, overlay);
  button.append(imageWrap);
  button.addEventListener("click", () => openLightbox(index, button));

  const meta = document.createElement("figcaption");
  meta.className = "photo-meta";
  const category = document.createElement("span");
  category.textContent = item.categoryTitle;
  const credit = document.createElement("span");
  credit.textContent = `Pexels · ${item.credit.split(" / ")[0]}`;
  meta.append(category, credit);
  figure.append(button, meta);
  return figure;
}

function renderGallery(manifest) {
  galleryItems = flattenGallery(manifest);
  activeCategory = "all";
  renderGalleryFilters(manifest.categories);
  galleryGrid.replaceChildren(...galleryItems.map(makePhotoCard));
  galleryStatus.hidden = true;
  updateGalleryVisibility();
}

function renderTestimonials(testimonials) {
  const status = document.querySelector("#testimonials-status");
  const list = document.querySelector("#testimonial-list");
  status.hidden = true;
  list.replaceChildren(...testimonials.map((testimonial) => {
    const article = document.createElement("article");
    article.className = "testimonial-entry";
    const quote = document.createElement("blockquote");
    quote.textContent = `“${testimonial.quote}”`;
    const attribution = document.createElement("p");
    attribution.className = "testimonial-attribution";
    const name = document.createElement("strong");
    name.textContent = testimonial.name;
    const project = document.createElement("span");
    project.textContent = testimonial.project;
    attribution.append(name, project);
    article.append(quote, attribution);
    return article;
  }));
}

function selectCategory(categoryId) {
  activeCategory = categoryId;
  galleryFilters.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.category === categoryId));
  });
  updateGalleryVisibility();
}

function updateGalleryVisibility() {
  let visibleCount = 0;
  galleryGrid.querySelectorAll(".photo-card").forEach((card) => {
    const visible = activeCategory === "all" || card.dataset.category === activeCategory;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  galleryEmpty.hidden = visibleCount > 0;
  galleryCount.textContent = `${visibleCount} ${visibleCount === 1 ? "reference" : "references"}`;
}

function currentItems() {
  return activeCategory === "all"
    ? galleryItems
    : galleryItems.filter((item) => item.categoryId === activeCategory);
}

function setLightboxImage() {
  const items = currentItems();
  if (!items.length) return;
  const item = items[activeIndex];
  lightboxImage.hidden = false;
  lightboxFallback.hidden = true;
  lightboxImage.src = item.localPath;
  lightboxImage.alt = item.title;
  lightboxImage.onerror = () => {
    lightboxImage.hidden = true;
    lightboxFallback.hidden = false;
  };
  document.querySelector("#lightbox-title").textContent = item.title;
  document.querySelector("#lightbox-category").textContent = item.categoryTitle;
  document.querySelector("#lightbox-credit").textContent = item.credit;
  document.querySelector("#lightbox-counter").textContent = `${activeIndex + 1} / ${items.length}`;
}

function openLightbox(index, button) {
  const visibleItems = currentItems();
  const itemId = galleryItems[index].id;
  activeIndex = visibleItems.findIndex((item) => item.id === itemId);
  lastOpenedButton = button;
  setLightboxImage();
  lightbox.showModal();
  document.querySelector("#lightbox-close").focus();
}

function moveLightbox(direction) {
  const items = currentItems();
  if (!items.length) return;
  activeIndex = (activeIndex + direction + items.length) % items.length;
  setLightboxImage();
}

function showEnquiryStatus(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  form.reset();
  document.querySelector("#contact-fields").hidden = true;
  const status = document.querySelector("#form-result");
  status.hidden = false;
  status.focus();
}

function setupNavigation() {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#primary-nav");
  menuButton.addEventListener("click", () => {
    const expanded = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!expanded));
    menuButton.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");
    nav.classList.toggle("is-open", !expanded);
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    nav.classList.remove("is-open");
  }));
}

function setupLightbox() {
  document.querySelector("#lightbox-close").addEventListener("click", () => lightbox.close());
  document.querySelector("#lightbox-prev").addEventListener("click", () => moveLightbox(-1));
  document.querySelector("#lightbox-next").addEventListener("click", () => moveLightbox(1));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("close", () => lastOpenedButton?.focus());
  document.addEventListener("keydown", (event) => {
    if (!lightbox.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      lightbox.close();
      return;
    }
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });
}

function setupEnquiryForm() {
  const form = document.querySelector("#contact-form");
  form.addEventListener("submit", showEnquiryStatus);
  document.querySelector("#new-enquiry").addEventListener("click", () => {
    form.reset();
    document.querySelector("#form-result").hidden = true;
    document.querySelector("#contact-fields").hidden = false;
    document.querySelector("#name").focus();
  });
}

function setupReveal() {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
}

async function start() {
  document.querySelector("#year").textContent = String(new Date().getFullYear());
  setupNavigation();
  setupLightbox();
  setupEnquiryForm();
  try {
    const [content, manifest] = await Promise.all([loadJson(contentPath), loadJson(manifestPath)]);
    renderGallery(manifest);
    renderTestimonials(content.testimonials);
    setupReveal();
  } catch (error) {
    showLoadError(galleryStatus, `The gallery could not be loaded. ${error.message}`);
    showLoadError(document.querySelector("#testimonials-status"), "Client comments could not be loaded.");
    const contactStatus = document.querySelector("#contact-status");
    contactStatus.hidden = false;
    showLoadError(contactStatus, `The contact form could not be loaded. ${error.message}`);
    document.querySelector("#contact-form button[type=submit]").disabled = true;
  }
}

start();