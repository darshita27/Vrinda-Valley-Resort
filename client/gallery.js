/**
 * Media gallery for the accommodation detail pages (banquet/rooms/pool).
 *
 * Each page's grid + lightbox is built entirely from the data arrays below —
 * adding a new photo or video to a page only ever means adding one line
 * here, never touching that page's HTML. The mount point on each page
 * (`#galleryRoot`) carries a `data-gallery-page` attribute that says which
 * array to render.
 *
 * Videos are heavy (some source files here are 20-30MB+), so the grid never
 * autoplays them: cards use `preload="metadata"` (just enough to show a
 * first-frame thumbnail) with a play-button overlay, and the clip only
 * loads/plays once opened in the lightbox.
 */

const GALLERY_MEDIA = {
  banquet: {
    categoryOrder: [
      "Hall Interior", "Stage Decoration", "Wedding Setup", "Reception Setup",
      "Birthday Events", "Corporate Events", "Food & Dining", "Evening Decoration"
    ],
    items: [
      { type: "image", src: "assets/banquet/hall-empty-seating.jpg", alt: "Banquet hall interior with rows of guest seating", category: "Hall Interior" },
      { type: "image", src: "assets/banquet/hall-ceremony-setup.jpg", alt: "Banquet hall set up for a wedding ceremony with floral backdrop", category: "Wedding Setup" },
      { type: "image", src: "assets/banquet/hall-ceremony-stage.png", alt: "Decorated ceremony stage with floral backdrop and seating for the wedding party", category: "Stage Decoration" }
    ]
  },
  rooms: {
    categoryOrder: [
      "Deluxe Rooms", "Premium Rooms", "Luxury Rooms", "Bathroom",
      "Balcony View", "Interior Details", "Amenities"
    ],
    items: [
      { type: "image", src: "assets/rooms/room-bedroom.png", alt: "Premium room with elegant bedding and warm interior lighting", category: "Premium Rooms" },
      { type: "video", src: "assets/rooms/room-edited-video-1.mp4", alt: "Walkthrough video of a resort room", category: "Interior Details" },
      { type: "video", src: "assets/rooms/room-details.mov", alt: "Close-up video of room interior details", category: "Interior Details" },
      { type: "video", src: "assets/rooms/IMG_0614.MOV", alt: "Video tour of a resort room", category: "Interior Details" },
      { type: "video", src: "assets/rooms/IMG_5854.MOV", alt: "Video tour of a resort room", category: "Interior Details" },
      { type: "video", src: "assets/rooms/IMG_5876.MOV", alt: "Video tour of a resort room", category: "Interior Details" },
      { type: "video", src: "assets/rooms/IMG_9857.MOV", alt: "Video tour of a resort room", category: "Interior Details" }
    ]
  },
  pool: {
    categoryOrder: [
      "Day View", "Night View", "Poolside Events", "Lighting",
      "Family Area", "Kids Pool", "Poolside Sitting", "Resort View"
    ],
    items: [
      { type: "image", src: "assets/pool/pool-night-1.jpg", alt: "Swimming pool lit up with blue and purple lighting at night", category: "Lighting" },
      { type: "image", src: "assets/pool/pool-night-2.jpg", alt: "Swimming pool with colourful night lighting and reflections", category: "Lighting" },
      { type: "image", src: "assets/pool/pool-night-3.jpg", alt: "Resort building and pool area lit up at night", category: "Night View" },
      { type: "image", src: "assets/pool/pool-night-4.jpg", alt: "Resort exterior and poolside area illuminated at night", category: "Resort View" },
      { type: "image", src: "assets/pool/pool-night-5.jpg", alt: "Resort and pool area with festive lighting at night", category: "Night View" },
      { type: "image", src: "assets/pool/pool-night-7.jpg", alt: "Resort building and pool with colourful night lighting", category: "Resort View" },
      { type: "image", src: "assets/pool/pool-hero.png", alt: "Swimming pool glowing with blue and purple lights among palm trees", category: "Night View" },
      { type: "video", src: "assets/pool/IMG_9752.MOV", alt: "Video of the swimming pool area", category: "Poolside Events" },
      { type: "video", src: "assets/pool/IMG_9754.MOV", alt: "Video of the swimming pool area", category: "Poolside Events" },
      { type: "video", src: "assets/pool/IMG_9757.MOV", alt: "Video of the swimming pool area", category: "Poolside Events" }
    ]
  },
  garden: {
    categoryOrder: [
      "Garden Views", "Wedding Setup", "Evening Lighting", "Pathways & Landscaping"
    ],
    items: [
      { type: "image", src: "assets/Garden/IMG_0547.PNG", alt: "Landscaped garden lawn with young saplings and a curved pathway", category: "Pathways & Landscaping" },
      { type: "video", src: "assets/Garden/IMG_2002.MOV", alt: "Video of the resort garden", category: "Garden Views" },
      { type: "video", src: "assets/Garden/IMG_2004.MOV", alt: "Video of the resort garden", category: "Garden Views" },
      { type: "video", src: "assets/Garden/IMG_2006.MOV", alt: "Video of the resort garden", category: "Garden Views" },
      { type: "video", src: "assets/Garden/IMG_9766.MOV", alt: "Video of the resort garden", category: "Garden Views" },
      { type: "video", src: "assets/Garden/IMG_9856.MOV", alt: "Video of the resort garden", category: "Garden Views" }
    ]
  }
};

const CARDS_PER_SECTION_PREVIEW = 8;

function escapeHtmlGallery(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function groupByCategory(items, categoryOrder) {
  const groups = new Map();
  items.forEach((item) => {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  });

  // Known categories first, in the page's declared order; anything with an
  // unrecognised category name (future media that doesn't fit the list yet)
  // still renders, appended at the end instead of silently disappearing.
  const ordered = categoryOrder.filter((name) => groups.has(name));
  const extra = Array.from(groups.keys()).filter((name) => !categoryOrder.includes(name));
  return [...ordered, ...extra].map((name) => ({ name, items: groups.get(name) }));
}

function cardMarkup(item, globalIndex, isExtra) {
  const label = item.type === "video" ? "Play video" : "View photo";
  const media = item.type === "video"
    ? `<video src="${escapeHtmlGallery(item.src)}" muted playsinline preload="metadata"></video>
       <span class="gallery-card__play" aria-hidden="true"><i class="ri-play-fill"></i></span>`
    : `<img src="${escapeHtmlGallery(item.src)}" alt="${escapeHtmlGallery(item.alt)}" loading="lazy">`;

  return `
    <button type="button" class="gallery-card${isExtra ? " gallery-card--extra" : ""}" data-index="${globalIndex}" data-type="${item.type}" aria-label="${escapeHtmlGallery(label)}: ${escapeHtmlGallery(item.alt)}">
      ${media}
      <span class="gallery-card__overlay" aria-hidden="true"><i class="ri-zoom-in-line"></i></span>
    </button>
  `;
}

function sectionMarkup(section, items) {
  const cards = section.items
    .map((item, i) => cardMarkup(item, items.indexOf(item), i >= CARDS_PER_SECTION_PREVIEW))
    .join("");

  const viewAllBtn = section.items.length > CARDS_PER_SECTION_PREVIEW
    ? `<button type="button" class="gallery-view-all" data-label-more="View All (${section.items.length})" data-label-less="Show Less" aria-expanded="false">View All (${section.items.length})</button>`
    : "";

  return `
    <div class="gallery-section" data-section="${escapeHtmlGallery(section.name)}">
      <h3 class="gallery-section__title">${escapeHtmlGallery(section.name)}</h3>
      <div class="gallery-grid">${cards}</div>
      ${viewAllBtn}
    </div>
  `;
}

function renderToolbar(root, items) {
  const photoCount = items.filter((item) => item.type === "image").length;
  const videoCount = items.filter((item) => item.type === "video").length;

  root.insertAdjacentHTML("beforebegin", `
    <div class="gallery-toolbar">
      <p class="gallery-toolbar__count">${items.length} items &mdash; ${photoCount} photos, ${videoCount} videos</p>
      <div class="gallery-filters" role="group" aria-label="Filter gallery by media type">
        <button type="button" class="gallery-filter is-active" data-filter="all">All</button>
        <button type="button" class="gallery-filter" data-filter="image">Photos</button>
        <button type="button" class="gallery-filter" data-filter="video">Videos</button>
      </div>
    </div>
  `);
}

function initGalleryFilters(root) {
  const filterButtons = document.querySelectorAll(".gallery-filter");
  if (!filterButtons.length) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const filter = btn.dataset.filter;

      root.querySelectorAll(".gallery-card").forEach((card) => {
        const matches = filter === "all" || card.dataset.type === filter;
        card.classList.toggle("is-hidden", !matches);
      });

      root.querySelectorAll(".gallery-section").forEach((section) => {
        const anyVisible = Array.from(section.querySelectorAll(".gallery-card")).some(
          (card) => !card.classList.contains("is-hidden")
        );
        section.classList.toggle("is-hidden", !anyVisible);
      });
    });
  });
}

function initViewAllButtons(root) {
  root.querySelectorAll(".gallery-view-all").forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.closest(".gallery-section");
      const expanded = section.classList.toggle("is-expanded");
      btn.textContent = expanded ? btn.dataset.labelLess : btn.dataset.labelMore;
      btn.setAttribute("aria-expanded", String(expanded));

      // These cards were display:none until now, so the fade-in observer may
      // never have caught them — reveal them directly instead of leaving
      // them stuck at opacity:0.
      if (expanded) {
        section.querySelectorAll(".gallery-card--extra.gallery-card--pending").forEach((card) => {
          card.classList.add("is-visible");
          card.classList.remove("gallery-card--pending");
        });
      }
    });
  });
}

/* ------------------------------------------------------------------ *
 * Fade-in on scroll — cards default to fully visible in CSS, so if
 * IntersectionObserver isn't available (or this script fails to run)
 * nothing is ever stuck hidden; the animation is a pure enhancement.
 * ------------------------------------------------------------------ */
function initGalleryFadeIn(root) {
  if (!("IntersectionObserver" in window)) return;

  const cards = root.querySelectorAll(".gallery-card");
  cards.forEach((card) => card.classList.add("gallery-card--pending"));

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          entry.target.classList.remove("gallery-card--pending");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  cards.forEach((card) => observer.observe(card));
}

/* ------------------------------------------------------------------ *
 * Lightbox — supports both images and videos, keyboard nav, and touch
 * swipe. Reuses the existing #lightbox markup, extended with a <video>.
 * ------------------------------------------------------------------ */
function initGalleryLightbox(root, items) {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;

  const imgEl = lightbox.querySelector(".lightbox__img");
  const videoEl = lightbox.querySelector(".lightbox__video");
  const counter = lightbox.querySelector(".lightbox__counter");
  const closeBtn = lightbox.querySelector(".lightbox__close");
  const prevBtn = lightbox.querySelector(".lightbox__prev");
  const nextBtn = lightbox.querySelector(".lightbox__next");

  let currentIndex = 0;

  function show(index) {
    currentIndex = (index + items.length) % items.length;
    const item = items[currentIndex];

    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();

    if (item.type === "video") {
      imgEl.hidden = true;
      videoEl.hidden = false;
      videoEl.src = item.src;
      videoEl.play().catch(() => {
        /* Autoplay-with-sound can be blocked by the browser; controls stay visible so the guest can press play. */
      });
    } else {
      videoEl.hidden = true;
      imgEl.hidden = false;
      imgEl.src = item.src;
      imgEl.alt = item.alt;
    }

    if (counter) counter.textContent = `${currentIndex + 1} / ${items.length}`;
  }

  function open(index) {
    show(index);
    lightbox.classList.add("is-open");
    document.body.classList.add("lightbox-open");
  }

  function close() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    videoEl.pause();
    videoEl.removeAttribute("src");
    videoEl.load();
  }

  root.addEventListener("click", (event) => {
    const card = event.target.closest(".gallery-card");
    if (!card) return;
    open(Number(card.dataset.index));
  });

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (prevBtn) prevBtn.addEventListener("click", () => show(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => show(currentIndex + 1));

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(currentIndex - 1);
    if (event.key === "ArrowRight") show(currentIndex + 1);
  });

  // Swipe support on mobile: a horizontal drag over 40px navigates, a
  // mostly-vertical drag (scroll intent) is ignored.
  let touchStartX = 0;
  let touchStartY = 0;
  lightbox.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  }, { passive: true });

  lightbox.addEventListener("touchend", (event) => {
    const dx = event.changedTouches[0].clientX - touchStartX;
    const dy = event.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    show(dx < 0 ? currentIndex + 1 : currentIndex - 1);
  }, { passive: true });
}

/* ------------------------------------------------------------------ *
 * Video preview cards: clicking anywhere opens the lightbox (handled by
 * initGalleryLightbox's root click listener), so the in-grid <video> only
 * needs to show a first frame — no in-grid playback controls to wire up.
 * ------------------------------------------------------------------ */

function initGallery() {
  const root = document.getElementById("galleryRoot");
  if (!root) return;

  const pageKey = root.dataset.galleryPage;
  const config = GALLERY_MEDIA[pageKey];
  if (!config) return;

  const sections = groupByCategory(config.items, config.categoryOrder);
  root.innerHTML = sections.map((section) => sectionMarkup(section, config.items)).join("");
  renderToolbar(root, config.items);

  initGalleryFilters(root);
  initViewAllButtons(root);
  initGalleryFadeIn(root);
  initGalleryLightbox(root, config.items);
}

document.addEventListener("DOMContentLoaded", initGallery);
