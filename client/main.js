// Local dev (served from localhost/127.0.0.1) talks to the local API instead
// of production, so no manual switch is needed before deploying this file.
const API_BASE_URL =
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:5000"
    : "https://vrinda-backend-h8oz.onrender.com";

document.addEventListener("DOMContentLoaded", function () {
  initBookingForm();
  initNavMenu();
  initActiveNav();
  initAutoHideNav();
  initScrollReveal();
  initPopupBanner();
  initDetailGallery();
});

/* ------------------------------------------------------------------ *
 * Booking form
 * ------------------------------------------------------------------ */

function initBookingForm() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const submitBtn = document.getElementById("bookingSubmitBtn");

  /**
   * Guards against the duplicate-booking bug: the backend is on a free tier
   * that can cold-start for 30-60s, and with no visible feedback guests used to
   * click submit repeatedly, sending one POST per click. This flag rejects
   * every submit until the in-flight request settles.
   */
  let isSubmitting = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = toISODate(today);

  const arrivalInput = document.getElementById("arrival");
  const departureInput = document.getElementById("departure");
  const roomCheckbox = document.getElementById("accommodationType-room");
  const numberOfRoomsGroup = document.getElementById("numberOfRoomsGroup");
  const numberOfRoomsInput = document.getElementById("numberOfRooms");

  // Stop past dates from being pickable at all, not just rejected after the fact.
  arrivalInput.min = todayISO;
  departureInput.min = todayISO;

  // "Number of Rooms" only makes sense (and is only shown) when Room is checked.
  function toggleNumberOfRooms() {
    const show = roomCheckbox.checked;
    numberOfRoomsGroup.hidden = !show;
    if (!show) {
      numberOfRoomsInput.value = "";
      clearFieldError("numberOfRooms");
    }
  }
  roomCheckbox.addEventListener("change", toggleNumberOfRooms);
  toggleNumberOfRooms();

  // Each checkbox has its own id, but they all share one error slot
  // (data-error-for="accommodationType") — the generic per-field listener
  // below clears errors by matching a field's own id, which would miss this.
  document.querySelectorAll('input[name="accommodationType"]').forEach((checkbox) => {
    checkbox.addEventListener("change", () => clearFieldError("accommodationType"));
  });

  arrivalInput.addEventListener("change", () => {
    // Check-out must follow check-in, so raise its floor to the day after.
    const nextDay = arrivalInput.value ? addDays(arrivalInput.value, 1) : todayISO;
    departureInput.min = nextDay;

    if (departureInput.value && departureInput.value < nextDay) {
      departureInput.value = "";
    }
    clearFieldError("departure");
  });

  // Clear a field's error as soon as the guest starts correcting it.
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field.id));
  });

  applyBookingTypePreselection(form);

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (isSubmitting) return;

    const data = {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      arrival: arrivalInput.value,
      departure: departureInput.value,
      guests: document.getElementById("guests").value,
      accommodationType: Array.from(
        document.querySelectorAll('input[name="accommodationType"]:checked')
      ).map((el) => el.value),
      numberOfRooms: numberOfRoomsInput.value,
      specialRequest: document.getElementById("specialRequest").value.trim()
    };

    const errors = validateBooking(data, todayISO);
    if (Object.keys(errors).length > 0) {
      showFieldErrors(errors);
      focusFirstError(errors);
      return;
    }

    isSubmitting = true;
    setLoading(submitBtn, true);

    try {
      const payload = { ...data, guests: Number(data.guests) };
      if (payload.accommodationType.includes("Room")) {
        payload.numberOfRooms = Number(payload.numberOfRooms);
      } else {
        delete payload.numberOfRooms;
      }
      if (!payload.specialRequest) delete payload.specialRequest;

      const response = await postJSON(`${API_BASE_URL}/api/bookings`, payload);
      const result = response.body;

      if (!response.ok) {
        handleServerError(response.status, result);
        return;
      }

      // Owner notification and guest confirmation emails are sent by the
      // backend (Nodemailer) as part of creating the booking — nothing to
      // trigger from here.

      const reference = result?.data?.bookingId;
      showToast(
        "success",
        "Booking Request Received",
        reference
          ? `Thank you, ${data.name}! Your reference is ${reference}. We will contact you shortly to confirm.`
          : `Thank you, ${data.name}! We will contact you shortly to confirm your booking.`
      );

      form.reset();
      clearAllFieldErrors();
      departureInput.min = todayISO;
      toggleNumberOfRooms(); // form.reset() unchecks Room but doesn't fire "change"
    } catch (error) {
      console.error("Booking request failed:", error);
      showToast(
        "error",
        error.name === "AbortError" ? "Request Timed Out" : "Connection Problem",
        error.name === "AbortError"
          ? "The server is taking too long to respond. Please check your connection and try again."
          : "We could not reach our booking server. Please check your internet connection and try again, or call us directly."
      );
    } finally {
      isSubmitting = false;
      setLoading(submitBtn, false);
    }
  });
}

/**
 * Footer links like "Wedding Booking" and "Parties & Events Booking" send
 * guests here as booking?type=wedding#booking / ?type=event#booking (the
 * clean URL, not booking.html — the static server 301s .html URLs to the
 * clean path and drops the query string in that redirect, which would
 * silently break this preselection).
 * There's no separate "booking type" field in the schema — both map onto
 * the existing Banquet Hall accommodation checkbox, since that's the venue
 * either kind of event actually uses. This just pre-checks it, prefills a
 * matching special request, and scrolls the form into view; the guest can
 * still change anything before submitting.
 */
function applyBookingTypePreselection(form) {
  const type = new URLSearchParams(window.location.search).get("type");
  if (!type) return;

  const presets = {
    wedding: { checkboxId: "accommodationType-banquetHall", note: "Wedding booking enquiry" },
    event: { checkboxId: "accommodationType-banquetHall", note: "Party / Event booking enquiry" }
  };

  const preset = presets[type];
  if (!preset) return;

  const checkbox = document.getElementById(preset.checkboxId);
  const specialRequest = document.getElementById("specialRequest");

  if (checkbox && !checkbox.checked) {
    checkbox.checked = true;
    // Let every other "accommodationType changed" listener (error-clearing,
    // Number of Rooms visibility) react exactly as if the guest had clicked it.
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (specialRequest && !specialRequest.value.trim()) {
    specialRequest.value = preset.note;
  }

  // Wait a tick for layout (e.g. the drawer/hero) to settle before measuring
  // scroll position.
  window.requestAnimationFrame(() => {
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/**
 * POST helper with an explicit timeout. Returns the parsed body alongside the
 * status so callers can branch without a second await.
 */
async function postJSON(url, payload, timeoutMs = 90000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    // A non-JSON body (gateway HTML error page) must not throw past the caller.
    let body = null;
    try {
      body = await response.json();
    } catch (_) {
      body = null;
    }

    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function handleServerError(status, result) {
  if (status === 409) {
    showToast(
      "success",
      "Booking Already Received",
      result?.message || "We have already received this booking request. Our team will contact you shortly."
    );
    return;
  }

  if (status === 400 && Array.isArray(result?.errors)) {
    const errors = {};
    result.errors.forEach((item) => {
      errors[item.field] = item.message;
    });
    showFieldErrors(errors);
    focusFirstError(errors);
    showToast("error", "Please Check Your Details", "Some information needs to be corrected.");
    return;
  }

  if (status === 429) {
    showToast("error", "Too Many Attempts", result?.message || "Please wait a few minutes before trying again.");
    return;
  }

  showToast("error", "Booking Failed", result?.message || "Something went wrong. Please try again or call us directly.");
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/**
 * Mirrors the server's phone normalisation (server/middleware/validateBooking.js)
 * so the two never disagree about what counts as a valid number.
 */
function normalizePhone(value) {
  let digits = String(value).replace(/\D/g, "");

  while (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);

  return digits;
}

function validateBooking(data, todayISO) {
  const errors = {};

  if (!data.name) {
    errors.name = "Please enter your name";
  } else if (data.name.length < 2) {
    errors.name = "Name must be at least 2 characters";
  } else if (!/^[a-zA-Z\s.'-]+$/.test(data.name)) {
    errors.name = "Name can only contain letters and spaces";
  }

  const phoneDigits = normalizePhone(data.phone);
  if (!data.phone) {
    errors.phone = "Please enter your phone number";
  } else if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
    errors.phone = "Enter a valid 10-digit mobile number";
  }

  if (!data.email) {
    errors.email = "Please enter your email address";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
    errors.email = "Enter a valid email address";
  }

  if (!data.arrival) {
    errors.arrival = "Please select your arrival date";
  } else if (data.arrival < todayISO) {
    errors.arrival = "Arrival date cannot be in the past";
  }

  if (!data.departure) {
    errors.departure = "Please select your departure date";
  } else if (data.arrival && data.departure <= data.arrival) {
    errors.departure = "Departure must be after the arrival date";
  }

  const guests = Number(data.guests);
  if (!data.guests) {
    errors.guests = "Please enter the number of guests";
  } else if (!Number.isInteger(guests) || guests < 1) {
    errors.guests = "Enter a valid number of guests";
  } else if (guests > 50) {
    errors.guests = "For more than 50 guests, please call us directly";
  }

  if (!data.accommodationType || data.accommodationType.length === 0) {
    errors.accommodationType = "Please select at least one accommodation type";
  }

  if (data.accommodationType && data.accommodationType.includes("Room")) {
    const rooms = Number(data.numberOfRooms);
    if (!data.numberOfRooms) {
      errors.numberOfRooms = "Please enter the number of rooms";
    } else if (!Number.isInteger(rooms) || rooms < 1) {
      errors.numberOfRooms = "Enter a valid number of rooms";
    }
  }

  if (data.specialRequest && data.specialRequest.length > 500) {
    errors.specialRequest = "Special request cannot exceed 500 characters";
  }

  return errors;
}

/* ------------------------------------------------------------------ *
 * UI helpers
 * ------------------------------------------------------------------ */

function setLoading(button, loading) {
  if (!button) return;

  button.disabled = loading;
  button.classList.toggle("btn--loading", loading);
  button.setAttribute("aria-busy", String(loading));

  const label = button.querySelector(".btn__label");
  if (label) label.textContent = loading ? "Checking Availability..." : "Check Availability";
}

function showFieldErrors(errors) {
  clearAllFieldErrors();

  Object.entries(errors).forEach(([field, message]) => {
    const target = document.querySelector(`[data-error-for="${field}"]`);
    const input = document.getElementById(field);

    if (target) {
      target.textContent = message;
      target.classList.add("is-visible");
    }
    if (input) input.classList.add("has-error");
  });
}

function clearFieldError(fieldId) {
  const target = document.querySelector(`[data-error-for="${fieldId}"]`);
  const input = document.getElementById(fieldId);

  if (target) {
    target.textContent = "";
    target.classList.remove("is-visible");
  }
  if (input) input.classList.remove("has-error");
}

function clearAllFieldErrors() {
  document.querySelectorAll(".field__error").forEach((el) => {
    el.textContent = "";
    el.classList.remove("is-visible");
  });
  document.querySelectorAll(".has-error").forEach((el) => el.classList.remove("has-error"));
}

function focusFirstError(errors) {
  const first = document.getElementById(Object.keys(errors)[0]);
  if (first) first.focus();
}

let toastTimer;

function showToast(type, title, message) {
  const toast = document.getElementById("bookingToast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.querySelector(".toast__title").textContent = title;
  toast.querySelector(".toast__message").textContent = message;
  toast.className = `toast toast--${type} is-visible`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, type === "success" ? 8000 : 10000);

  const closeBtn = document.getElementById("bookingToastClose");
  if (closeBtn) closeBtn.onclick = hideToast;
}

function hideToast() {
  const toast = document.getElementById("bookingToast");
  if (toast) toast.classList.remove("is-visible");
  clearTimeout(toastTimer);
}

function toISODate(date) {
  // Local-date safe: toISOString() would shift the day for IST users.
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split("T")[0];
}

function addDays(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/* ------------------------------------------------------------------ *
 * Navigation, reveal animations, promo banner
 * ------------------------------------------------------------------ */

/**
 * Marks the nav link for the current page with .active + aria-current.
 * Only page-level links participate — in-page section anchors on the
 * homepage (#about, #room, #feature, #news) are parts of the current page,
 * not separate destinations, so they're intentionally left alone. #home is
 * the one exception, since that's how "Home" refers to this same page.
 */
function initActiveNav() {
  const navLinks = document.querySelectorAll("#nav-links a");
  if (!navLinks.length) return;

  function pageNameFromPath(pathname) {
    const last = pathname.split("/").filter(Boolean).pop() || "index";
    return last.replace(/\.html$/, "").toLowerCase();
  }

  const currentPage = pageNameFromPath(window.location.pathname);

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("#") && href !== "#home") return;

    const path = href.split("#")[0].split("?")[0];
    const linkedPage = path ? pageNameFromPath(path) : "index"; // "" only for exactly "#home"

    if (linkedPage === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
}

function initNavMenu() {
  const menuBtn = document.getElementById("menu-btn");
  const navLinks = document.getElementById("nav-links");
  if (!menuBtn || !navLinks) return;

  const backdrop = document.getElementById("nav-backdrop");
  const menuBtnIcon = menuBtn.querySelector("i");

  // Open/closed state lives on <body> so CSS can drive the drawer, the
  // backdrop, and the background-scroll lock from one shared flag.
  function setOpen(isOpen) {
    document.body.classList.toggle("nav-open", isOpen);
    menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
  }

  menuBtn.addEventListener("click", () => {
    setOpen(!document.body.classList.contains("nav-open"));
  });

  // Tapping a link closes the drawer instead of leaving it open behind
  // the page the link navigates to (or the section it jumps to).
  navLinks.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  if (backdrop) {
    backdrop.addEventListener("click", () => setOpen(false));
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

/**
 * Smart auto-hide nav (Adidas-style): slides up out of view on scroll down,
 * reappears on the slightest scroll up, and always stays visible near the
 * top of the page. Toggles a class + CSS transition — layout is untouched
 * since nav is `position: fixed` and was already out of document flow.
 */
function initAutoHideNav() {
  const nav = document.querySelector("nav");
  if (!nav) return;

  // Stay visible until the guest has actually scrolled past the nav itself;
  // otherwise the very first pixel of scroll would hide it immediately.
  const REVEAL_THRESHOLD = 10;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateNavHeight() {
    nav.style.setProperty("--nav-height", nav.offsetHeight + "px");
  }
  updateNavHeight();
  window.addEventListener("resize", updateNavHeight);

  function onScroll() {
    const currentScrollY = window.scrollY;

    if (currentScrollY <= REVEAL_THRESHOLD) {
      nav.classList.remove("nav--hidden");
    } else if (currentScrollY > lastScrollY) {
      nav.classList.add("nav--hidden"); // scrolling down
    } else {
      nav.classList.remove("nav--hidden"); // scrolling up, even slightly
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  // rAF-throttled so this never fires more than once per frame.
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
}

function initScrollReveal() {
  if (typeof ScrollReveal === "undefined") return;

  const scrollRevealOption = { distance: "50px", origin: "bottom", duration: 1000 };

  ScrollReveal().reveal(".header__container .section__subheader", { ...scrollRevealOption });
  ScrollReveal().reveal(".header__container h1", { ...scrollRevealOption, delay: 500 });
  ScrollReveal().reveal(".header__container .btn", { ...scrollRevealOption, delay: 1000 });
  ScrollReveal().reveal(".room__card", { ...scrollRevealOption, interval: 500 });
  ScrollReveal().reveal(".feature__card", { ...scrollRevealOption, interval: 500 });
  ScrollReveal().reveal(".news__card", { ...scrollRevealOption, interval: 500 });

  // Accommodation detail pages (banquet/rooms/pool) — selectors simply don't
  // match on other pages, so this is a harmless no-op everywhere else.
  ScrollReveal().reveal(".detail-hero__content .section__subheader", { ...scrollRevealOption });
  ScrollReveal().reveal(".detail-hero__content h1", { ...scrollRevealOption, delay: 300 });
  ScrollReveal().reveal(".detail-hero__content p", { ...scrollRevealOption, delay: 500 });
  ScrollReveal().reveal(".detail-gallery__item", { ...scrollRevealOption, interval: 150 });
  ScrollReveal().reveal(".feature-item", { ...scrollRevealOption, interval: 100 });
  ScrollReveal().reveal(".spec-chip", { ...scrollRevealOption, interval: 100 });
}

/**
 * Lightbox for .detail-gallery__item thumbnails, shared by banquet.html,
 * rooms.html and pool.html. No-ops if the page has no gallery/lightbox.
 */
function initDetailGallery() {
  const galleryItems = document.querySelectorAll(".detail-gallery__item");
  const lightbox = document.getElementById("lightbox");
  if (galleryItems.length === 0 || !lightbox) return;

  const lightboxImg = lightbox.querySelector(".lightbox__img");
  const counter = lightbox.querySelector(".lightbox__counter");
  const closeBtn = lightbox.querySelector(".lightbox__close");
  const prevBtn = lightbox.querySelector(".lightbox__prev");
  const nextBtn = lightbox.querySelector(".lightbox__next");

  const images = Array.from(galleryItems).map((item) => {
    const img = item.querySelector("img");
    return { src: item.dataset.full || img.src, alt: img.alt || "" };
  });

  let currentIndex = 0;

  function show(index) {
    currentIndex = (index + images.length) % images.length;
    lightboxImg.src = images[currentIndex].src;
    lightboxImg.alt = images[currentIndex].alt;
    if (counter) counter.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  function open(index) {
    show(index);
    lightbox.classList.add("is-open");
    document.body.classList.add("lightbox-open");
  }

  function close() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => open(index));
  });

  if (closeBtn) closeBtn.addEventListener("click", close);
  if (prevBtn) prevBtn.addEventListener("click", () => show(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => show(currentIndex + 1));

  // Click on the dark backdrop (not the image or controls) closes it.
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(currentIndex - 1);
    if (event.key === "ArrowRight") show(currentIndex + 1);
  });
}

function initPopupBanner() {
  const banner = document.getElementById("popup-banner");
  if (!banner) return;

  const closeBtn = banner.querySelector(".close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      banner.style.display = "none";
    });
  }

  // Opt-in only, so the current behaviour (banner hidden) is unchanged.
  if (banner.dataset.autoshow === "true") {
    banner.style.display = "block";
  }
}
