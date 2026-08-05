/**
 * Customer Support page: contact form submission, FAQ accordion, and a
 * rule-based chat widget. All three share one FAQS knowledge base so the
 * FAQ list and the chatbot never give contradictory answers.
 *
 * The chatbot is deliberately NOT a general-purpose AI — it matches guest
 * questions against FAQS by keyword and falls back to "please contact us
 * directly" when nothing matches. Relies on API_BASE_URL, already declared
 * by main.js (loaded first — classic scripts on one page share one global
 * scope, so no re-declaration is needed here).
 */

const FAQS = [
  {
    id: "checkin-checkout",
    question: "What are your check-in and check-out timings?",
    answer: "Check-in is from 12:00 PM and check-out is by 11:00 AM. Early check-in or late check-out may be arranged on request, subject to availability.",
    keywords: ["check-in", "checkin", "check in", "checkout", "check-out", "check out", "timing", "time"]
  },
  {
    id: "how-to-book",
    question: "How do I book a room, banquet hall, or pool?",
    answer: "You can book directly on our Booking page — choose Room, Pool, and/or Banquet Hall, pick your dates, and submit the form. Our team will confirm shortly by phone or email.",
    keywords: ["book", "booking", "reserve", "reservation", "how to book"]
  },
  {
    id: "room-availability",
    question: "How can I check room availability?",
    answer: "Submit a booking request with your preferred dates on our Booking page, and our team will confirm availability with you directly.",
    keywords: ["availability", "available", "vacancy", "vacant", "free rooms"]
  },
  {
    id: "wedding-packages",
    question: "Do you offer wedding packages?",
    answer: "Yes! Our Wedding Package includes the banquet hall, decoration, a complimentary bridal suite, event planning support, and catering. See our Offers page or the Banquet Hall page for details.",
    keywords: ["wedding", "marriage", "shaadi", "bridal"]
  },
  {
    id: "pool-party",
    question: "Can I book a pool party?",
    answer: "Yes — our Luxury Swimming Pool is available for poolside celebrations as well as a regular swim. Check the Pool page for facilities, timings, and features.",
    keywords: ["pool party", "pool", "swim", "swimming"]
  },
  {
    id: "banquet-hall",
    question: "What is the capacity of your banquet hall?",
    answer: "Our Royal Banquet Hall accommodates guests with flexible seating layouts, and is fully air-conditioned with decoration and catering support available. See the Banquet Hall page for full details.",
    keywords: ["banquet", "hall", "capacity", "seating", "guests", "event venue"]
  },
  {
    id: "facilities",
    question: "What facilities does the resort offer?",
    answer: "We offer premium rooms, a grand banquet hall, a luxury swimming pool, Wi-Fi, parking, catering, and beautifully landscaped gardens.",
    keywords: ["facilities", "amenities", "features", "wifi", "wi-fi", "parking"]
  },
  {
    id: "contact-info",
    question: "How can I contact the resort directly?",
    answer: "Call us at +91 98290 43311 or +91 93141 90300, email vrindavalleyjaipur@gmail.com, or message us on WhatsApp — all listed on this page.",
    keywords: ["contact", "phone", "number", "email", "whatsapp", "call"]
  },
  {
    id: "location",
    question: "Where is Vrinda Valley Resort located?",
    answer: "We're located at Diggi Malpura Rd, Bagran Ka Bam, Balawala, Hargun Ki Nangal at Charanwala, Rajasthan 303904. See the map on this page for directions.",
    keywords: ["location", "address", "where", "directions", "map", "jaipur"]
  },
  {
    id: "cancellation",
    question: "What is your cancellation policy?",
    answer: "Please contact us directly by phone or email as soon as possible to discuss cancellations or changes to your booking — our team will guide you through it.",
    keywords: ["cancel", "cancellation", "refund", "policy"]
  }
];

function escapeHtmlSupport(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderFaqs() {
  const list = document.getElementById("faqList");
  if (!list) return;

  list.innerHTML = FAQS.map(
    (faq) => `
      <details class="faq-item">
        <summary>${escapeHtmlSupport(faq.question)}</summary>
        <p>${escapeHtmlSupport(faq.answer)}</p>
      </details>
    `
  ).join("");
}

/* ------------------------------------------------------------------ *
 * Contact form
 * ------------------------------------------------------------------ */

function initContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const messageBox = document.getElementById("contactMessage");
  const submitBtn = document.getElementById("contactSubmitBtn");
  // Maps API field names to this form's input ids (the message textarea's id
  // isn't "message" — that would have collided with #contactMessage, the
  // feedback banner above the form).
  const fieldToInputId = {
    name: "contactName",
    email: "contactEmail",
    phone: "contactPhone",
    subject: "contactSubject",
    message: "contactMessageInput"
  };

  let isSubmitting = false;

  function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = "form__message form__message--" + (type || "error");
  }

  function clearMessage() {
    messageBox.textContent = "";
    messageBox.className = "form__message";
  }

  function clearFieldError(inputId) {
    const target = document.querySelector(`[data-error-for="${inputId}"]`);
    const input = document.getElementById(inputId);
    if (target) {
      target.textContent = "";
      target.classList.remove("is-visible");
    }
    if (input) input.classList.remove("has-error");
  }

  function clearAllFieldErrors() {
    form.querySelectorAll(".field__error").forEach((el) => {
      el.textContent = "";
      el.classList.remove("is-visible");
    });
    form.querySelectorAll(".has-error").forEach((el) => el.classList.remove("has-error"));
  }

  function showFieldErrors(apiErrors) {
    clearAllFieldErrors();
    apiErrors.forEach(({ field, message }) => {
      const inputId = fieldToInputId[field] || field;
      const target = document.querySelector(`[data-error-for="${inputId}"]`);
      const input = document.getElementById(inputId);
      if (target) {
        target.textContent = message;
        target.classList.add("is-visible");
      }
      if (input) input.classList.add("has-error");
    });
  }

  form.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", () => clearFieldError(field.id));
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      name: document.getElementById("contactName").value.trim(),
      email: document.getElementById("contactEmail").value.trim(),
      phone: document.getElementById("contactPhone").value.trim(),
      subject: document.getElementById("contactSubject").value.trim(),
      message: document.getElementById("contactMessageInput").value.trim()
    };

    isSubmitting = true;
    submitBtn.disabled = true;
    submitBtn.classList.add("btn--loading");
    clearMessage();

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 400 && Array.isArray(body?.errors)) {
          showFieldErrors(body.errors);
          showMessage("Please check the highlighted fields.", "error");
        } else if (response.status === 429) {
          showMessage(body?.message || "Too many messages sent. Please try again in a few minutes.", "error");
        } else {
          showMessage(body?.message || "Something went wrong. Please try again or contact us directly.", "error");
        }
        return;
      }

      showMessage(body.message || "Thank you for reaching out. Our team will get back to you shortly.", "success");
      form.reset();
      clearAllFieldErrors();
    } catch (error) {
      showMessage("We could not reach our server. Please check your connection and try again.", "error");
    } finally {
      isSubmitting = false;
      submitBtn.disabled = false;
      submitBtn.classList.remove("btn--loading");
    }
  });
}

/* ------------------------------------------------------------------ *
 * Chatbot — rule-based FAQ matching, not a general-purpose AI
 * ------------------------------------------------------------------ */

function findFaqMatch(userText) {
  const text = userText.toLowerCase();
  let best = null;
  let bestScore = 0;

  FAQS.forEach((faq) => {
    let score = 0;
    faq.keywords.forEach((keyword) => {
      if (text.includes(keyword)) score += 1;
    });
    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  });

  return bestScore > 0 ? best : null;
}

function initChatbot() {
  const toggle = document.getElementById("chatbotToggle");
  const toggleIcon = document.getElementById("chatbotToggleIcon");
  const panel = document.getElementById("chatbotPanel");
  const closeBtn = document.getElementById("chatbotClose");
  const messagesEl = document.getElementById("chatbotMessages");
  const quickRepliesEl = document.getElementById("chatbotQuickReplies");
  const form = document.getElementById("chatbotForm");
  const input = document.getElementById("chatbotInput");
  if (!toggle || !panel) return;

  let greeted = false;

  function addMessage(text, sender) {
    const bubble = document.createElement("div");
    bubble.className = "chatbot__msg chatbot__msg--" + sender;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showQuickReplies() {
    quickRepliesEl.innerHTML = "";
    FAQS.slice(0, 4).forEach((faq) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = faq.question;
      btn.addEventListener("click", () => handleUserQuestion(faq.question));
      quickRepliesEl.appendChild(btn);
    });
  }

  function handleUserQuestion(text) {
    if (!text.trim()) return;
    addMessage(text, "user");
    input.value = "";

    // Small delay so the reply doesn't feel like an instant lookup table —
    // this is cosmetic only; the matching itself is synchronous.
    setTimeout(() => {
      const match = findFaqMatch(text);
      if (match) {
        addMessage(match.answer, "bot");
      } else {
        addMessage(
          "I'm not sure about that one — please call us at +91 98290 43311, email vrindavalleyjaipur@gmail.com, or use the contact form on this page and our team will help.",
          "bot"
        );
      }
    }, 450);
  }

  function open() {
    panel.hidden = false;
    // Add the transition-triggering class on the next frame so the browser
    // registers the "hidden -> visible" state before animating from it.
    requestAnimationFrame(() => panel.classList.add("is-open"));
    toggle.setAttribute("aria-expanded", "true");
    toggleIcon.setAttribute("class", "ri-close-line");

    if (!greeted) {
      greeted = true;
      addMessage(
        "Hi! I'm the Vrinda Valley Resort assistant. Ask me about rooms, booking, weddings, pool parties, the banquet hall, facilities, or how to reach us.",
        "bot"
      );
      showQuickReplies();
    }

    input.focus();
  }

  function close() {
    panel.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggleIcon.setAttribute("class", "ri-chat-3-line");
    setTimeout(() => {
      panel.hidden = true;
    }, 250);
  }

  toggle.addEventListener("click", () => {
    if (panel.classList.contains("is-open")) close();
    else open();
  });

  closeBtn.addEventListener("click", close);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) close();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    handleUserQuestion(input.value);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initContactForm();
  renderFaqs();
  initChatbot();
});
