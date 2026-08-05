/**
 * Offers page data + rendering.
 *
 * Deliberately data-driven (one OFFERS array + one render pass) rather than
 * six hand-written card blocks, specifically so this can later be swapped
 * for a `fetch("/api/offers")` call returning the same shape — the render
 * function and card template wouldn't need to change, only where OFFERS
 * comes from. Field names here are chosen as a reasonable first draft of
 * what a MongoDB "Offer" document / admin-panel form would look like.
 *
 * NOTE: prices/discounts below are as specified by the resort; testimonials,
 * validity dates, and terms are placeholder content and should be replaced
 * with real guest reviews and confirmed dates/policies before this goes live —
 * presenting invented quotes as genuine reviews would be misleading.
 */
const OFFERS = [
  {
    id: "weekend-escape",
    title: "Weekend Escape",
    badge: { text: "Best Seller", type: "status" },
    image: "assets/rooms/premium-room-bed.jpg",
    price: "₹4,999",
    priceNote: "onwards",
    duration: "2 Days / 1 Night",
    features: [
      { icon: "ri-cup-line", text: "Complimentary Breakfast" },
      { icon: "ri-drop-line", text: "Swimming Pool Access" },
      { icon: "ri-goblet-line", text: "Welcome Drink" }
    ],
    rating: 5,
    testimonial: { text: "A perfect quick getaway — the pool and breakfast alone were worth it.", author: "Priya S." },
    validity: "Valid till 31 Dec 2026",
    terms: "Rate is per room, per stay, subject to availability. Taxes as applicable. Cannot be combined with other offers.",
    cta: "Book Now"
  },
  {
    id: "wedding-package",
    title: "Wedding Package",
    badge: { text: "Most Popular", type: "status" },
    image: "assets/banquet/hall-ceremony-setup.jpg",
    price: "Contact for Pricing",
    priceNote: "",
    duration: "Full-Day Venue",
    features: [
      { icon: "ri-building-4-line", text: "Banquet Hall" },
      { icon: "ri-flower-line", text: "Decoration Included" },
      { icon: "ri-hotel-bed-line", text: "Complimentary Bridal Suite" },
      { icon: "ri-calendar-check-line", text: "Event Planning Support" },
      { icon: "ri-restaurant-line", text: "Catering Available" }
    ],
    rating: 5,
    testimonial: { text: "Our wedding day was flawless — the team handled every detail beautifully.", author: "Ankit & Riya" },
    validity: "Valid year-round, subject to date availability",
    terms: "Final pricing depends on guest count and customisation. Advance booking strongly recommended for peak wedding season.",
    cta: "Enquire Now"
  },
  {
    id: "family-holiday",
    title: "Family Holiday",
    badge: { text: "Up to 25% OFF", type: "discount" },
    image: "assets/pool/pool-night-1.jpg",
    price: "Up to 25% Off",
    priceNote: "on room rates",
    duration: "Flexible Stay",
    features: [
      { icon: "ri-parent-line", text: "Kids Stay Free" },
      { icon: "ri-gamepad-line", text: "Indoor & Outdoor Games" },
      { icon: "ri-drop-line", text: "Swimming Pool" },
      { icon: "ri-cup-line", text: "Breakfast Included" }
    ],
    rating: 4,
    testimonial: { text: "The kids didn't want to leave the pool! Great value for a family trip.", author: "The Malhotra Family" },
    validity: "Valid till 30 Nov 2026",
    terms: "Discount applies to base room rate only. Kids-stay-free applies to children under 10 sharing existing bedding.",
    cta: "Book Now"
  },
  {
    id: "corporate-package",
    title: "Corporate Package",
    badge: null,
    image: "assets/banquet/hall-empty-seating.jpg",
    price: "Contact for Pricing",
    priceNote: "",
    duration: "Full / Half Day",
    features: [
      { icon: "ri-presentation-line", text: "Conference Hall" },
      { icon: "ri-wifi-line", text: "Wi-Fi" },
      { icon: "ri-projector-2-line", text: "Projector" },
      { icon: "ri-restaurant-2-line", text: "Lunch & Tea" },
      { icon: "ri-group-line", text: "Group Discounts" }
    ],
    rating: 5,
    testimonial: { text: "Smooth, professional setup for our offsite — great facilities and support.", author: "Corporate Guest" },
    validity: "Valid year-round, weekdays preferred",
    terms: "Group discounts apply for bookings above 15 attendees. Equipment subject to availability.",
    cta: "Enquire Now"
  },
  {
    id: "birthday-anniversary",
    title: "Birthday & Anniversary",
    badge: { text: "Limited Time", type: "status" },
    image: "assets/pool/pool-night-2.jpg",
    price: "Contact for Pricing",
    priceNote: "",
    duration: "Evening Package",
    features: [
      { icon: "ri-flower-line", text: "Romantic Decoration" },
      { icon: "ri-cake-3-line", text: "Complimentary Cake" },
      { icon: "ri-goblet-line", text: "Candlelight Dinner" },
      { icon: "ri-arrow-up-circle-line", text: "Room Upgrade (Subject to Availability)" }
    ],
    rating: 5,
    testimonial: { text: "Such a beautiful, thoughtful setup for our anniversary — highly recommend.", author: "Sana & Vivek" },
    validity: "Valid till 31 Dec 2026",
    terms: "48 hours' advance notice required. Room upgrade subject to availability at time of stay.",
    cta: "Book Now"
  },
  {
    id: "seasonal-special",
    title: "Seasonal Special",
    badge: { text: "30% OFF", type: "discount" },
    image: "assets/pool/pool-night-4.jpg",
    price: "Flat 30% Off",
    priceNote: "on all bookings",
    duration: "Limited Time Only",
    features: [
      { icon: "ri-price-tag-3-line", text: "Flat 30% OFF" },
      { icon: "ri-timer-flash-line", text: "Limited Time Offer" }
    ],
    rating: 5,
    testimonial: { text: "Booked last minute for the seasonal deal — incredible value.", author: "Rohit K." },
    validity: "Valid till 30 Sep 2026",
    terms: "Discount applies to the base room rate only. Cannot be combined with other offers. Blackout dates may apply.",
    cta: "Book Before Offer Ends",
    // Countdown target — update this to match the real promotion window.
    countdownUntil: "2026-09-30T23:59:59"
  }
];

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** e.g. rating=4 -> "★★★★☆", with an aria-label for screen readers. */
function starRatingHtml(rating) {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  return `<div class="offer-card__rating" aria-label="${rating} out of 5 stars">${stars}</div>`;
}

function offerCardHtml(offer) {
  const badge = offer.badge
    ? `<span class="offer-badge offer-badge--${offer.badge.type}">${escapeHtml(offer.badge.text)}</span>`
    : "";

  const features = offer.features
    .map((f) => `<li><i class="${f.icon}"></i> ${escapeHtml(f.text)}</li>`)
    .join("");

  const priceNote = offer.priceNote
    ? `<span class="offer-card__price-note">${escapeHtml(offer.priceNote)}</span>`
    : "";

  const countdown = offer.countdownUntil
    ? `<div class="offer-card__countdown" id="countdown-${offer.id}"></div>`
    : "";

  return `
    <article class="offer-card" data-reveal>
      <div class="offer-card__media">
        <img src="${offer.image}" alt="${escapeHtml(offer.title)}" loading="lazy">
        ${badge}
      </div>
      <div class="offer-card__body">
        <h3>${escapeHtml(offer.title)}</h3>
        <div class="offer-card__price">
          <span class="offer-card__price-amount">${escapeHtml(offer.price)}</span>
          ${priceNote}
        </div>
        <p class="offer-card__duration"><i class="ri-calendar-line"></i> ${escapeHtml(offer.duration)}</p>
        <ul class="offer-card__features">${features}</ul>
        ${starRatingHtml(offer.rating)}
        <blockquote class="offer-card__testimonial">
          &ldquo;${escapeHtml(offer.testimonial.text)}&rdquo;
          <cite>— ${escapeHtml(offer.testimonial.author)}</cite>
        </blockquote>
        <p class="offer-card__validity"><i class="ri-time-line"></i> ${escapeHtml(offer.validity)}</p>
        ${countdown}
        <details class="offer-card__terms">
          <summary>Terms & Conditions</summary>
          <p>${escapeHtml(offer.terms)}</p>
        </details>
        <a href="booking.html" class="btn offer-card__cta">${escapeHtml(offer.cta)}</a>
      </div>
    </article>
  `;
}

/** Live countdown for any offer with a countdownUntil date; stops cleanly once it passes. */
function startCountdown(offerId, targetIso) {
  const el = document.getElementById("countdown-" + offerId);
  if (!el) return;

  const target = new Date(targetIso).getTime();

  function tick() {
    const remaining = target - Date.now();

    if (remaining <= 0) {
      el.innerHTML = '<span style="color: rgba(255,255,255,0.6); font-size: 0.85rem;">Offer has ended</span>';
      clearInterval(timer);
      return;
    }

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining / 3600000) % 24);
    const minutes = Math.floor((remaining / 60000) % 60);
    const seconds = Math.floor((remaining / 1000) % 60);

    el.innerHTML = [
      ["Days", days],
      ["Hrs", hours],
      ["Min", minutes],
      ["Sec", seconds]
    ]
      .map(([label, value]) => `<div><strong>${value}</strong><span>${label}</span></div>`)
      .join("");
  }

  tick();
  const timer = setInterval(tick, 1000);
}

function renderOffers() {
  const grid = document.getElementById("offersGrid");
  if (!grid) return;

  grid.innerHTML = OFFERS.map(offerCardHtml).join("");

  OFFERS.forEach((offer) => {
    if (offer.countdownUntil) startCountdown(offer.id, offer.countdownUntil);
  });

  // Cards are built after DOMContentLoaded, so give ScrollReveal (already
  // initialised by main.js) a pass over the ones that just appeared.
  if (typeof ScrollReveal !== "undefined") {
    ScrollReveal().reveal(".offer-card", { distance: "40px", origin: "bottom", duration: 800, interval: 120 });
  }
}

document.addEventListener("DOMContentLoaded", renderOffers);
