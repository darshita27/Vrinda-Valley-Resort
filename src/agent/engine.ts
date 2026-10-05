import { INTENTS, SYNONYMS, type Intent } from "./knowledge";

export type Lead = {
  name?: string;
  contact?: string;
  purpose?: string;
  dates?: string;
  guests?: string;
  source?: string;
};

export type AgentReply = {
  text: string;
  chips?: string[];
  intent: string;
  confidence: number;
  /** triggers the booking form hand-off */
  action?: "openBooking" | "call" | "whatsapp";
  /** captured enquiry, sent to WhatsApp when action === "whatsapp" */
  lead?: Lead;
};

/* ------------------------------------------------------------------ */
/* Text utilities                                                      */
/* ------------------------------------------------------------------ */

const STOP = new Set([
  "a","an","the","is","are","am","do","does","did","can","could","would","should","i","we","you",
  "my","our","your","me","us","to","of","for","in","on","at","and","or","it","this","that","there",
  "please","pls","kya","hai","ho","ka","ki","ke","mein","me","se","ko","bhi","aur","tell","know","want",
  "need","get","give","show","about","plz","hey",
]);

function normalise(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean)
    .map((w) => SYNONYMS[w] ?? w)
    .map((w) => (w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w));
}

/** Damerau-ish Levenshtein, capped for speed. */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

function fuzzyHas(tokens: string[], target: string): boolean {
  if (tokens.includes(target)) return true;
  if (target.length < 5) return false;
  return tokens.some((t) => t.length > 3 && editDistance(t, target) <= 1);
}

/* ------------------------------------------------------------------ */
/* Entity extraction                                                   */
/* ------------------------------------------------------------------ */

export type Entities = {
  guests?: number;
  phone?: string;
  email?: string;
  dateish?: string;
};

export function extractEntities(raw: string): Entities {
  const e: Entities = {};
  const guestMatch = raw.match(/(\d{1,4})\s*(guest|people|pax|person|member|log)/i);
  if (guestMatch) e.guests = parseInt(guestMatch[1], 10);
  const phone = raw.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
  if (phone) e.phone = phone[0];
  const email = raw.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (email) e.email = email[0];
  const date = raw.match(
    /\b(\d{1,2}[\/.-]\d{1,2}([\/.-]\d{2,4})?|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|tomorrow|weekend|next week|next month)\w*/i
  );
  if (date) e.dateish = date[0];
  return e;
}

/* ------------------------------------------------------------------ */
/* Intent scoring                                                      */
/* ------------------------------------------------------------------ */

function scoreIntent(intent: Intent, raw: string, tokens: string[]): number {
  let score = 0;
  const lower = raw.toLowerCase();

  for (const p of intent.phrases ?? []) {
    if (lower.includes(p)) score += 6;
  }
  for (const k of intent.keywords) {
    if (fuzzyHas(tokens, k)) score += 3;
  }
  for (const h of intent.hints ?? []) {
    if (fuzzyHas(tokens, h)) score += 1;
  }

  // short greetings shouldn't hijack longer questions
  if (intent.id === "greeting" && tokens.filter((t) => !STOP.has(t)).length > 3) {
    score -= 4;
  }
  return score;
}

/* ------------------------------------------------------------------ */
/* Booking flow state machine                                          */
/* ------------------------------------------------------------------ */

export type BookingState = {
  active: boolean;
  step: number;
  data: Record<string, string>;
};

export const emptyBooking = (): BookingState => ({ active: false, step: 0, data: {} });

const BOOKING_STEPS = [
  { key: "name", q: "Wonderful! Let's get this started. ✨\n\nWhat's your **full name**?" },
  { key: "contact", q: "Thanks, {name}! What's the best **phone number or email** to reach you?" },
  { key: "purpose", q: "Got it. What's the occasion — a **room stay**, **wedding/banquet**, **pool party** or **corporate event**?" },
  { key: "dates", q: "Perfect. Which **dates** are you looking at? (e.g. 12 March, or 'next weekend')" },
  { key: "guests", q: "Almost done — roughly **how many guests** should we plan for?" },
];

const BOOK_TRIGGERS = ["book", "reserve", "enquire", "enquiry", "inquiry", "quote", "avail", "available"];

function isBookingIntent(raw: string, tokens: string[]): boolean {
  const lower = raw.toLowerCase();
  if (/\b(book|booking|reserve|reservation)\b/.test(lower)) return true;
  if (/\b(get|send|need|want)\s+a?\s*quote\b/.test(lower)) return true;
  return BOOK_TRIGGERS.some((t) => fuzzyHas(tokens, t)) && tokens.length <= 6;
}

/* ------------------------------------------------------------------ */
/* Main entry                                                          */
/* ------------------------------------------------------------------ */

const FALLBACKS = [
  "I want to make sure I get this right. 🤔 I didn't quite catch that.\n\nI'm best at answering questions about **rooms, weddings & the banquet hall, the pool, dining, pricing, location and bookings**. Could you rephrase it?",
  "Hmm, that one's outside what I know. 💭\n\nTry asking me about **room availability, wedding packages, pool parties, food menus, directions** — or I can connect you to our team directly.",
];

export function respond(
  raw: string,
  booking: BookingState
): { reply: AgentReply; booking: BookingState } {
  const text = raw.trim();
  const tokens = normalise(text);
  const entities = extractEntities(text);

  /* ---- active booking flow ---- */
  if (booking.active) {
    const lower = text.toLowerCase();
    if (/\b(cancel|stop|nevermind|never mind|exit|quit)\b/.test(lower)) {
      return {
        booking: emptyBooking(),
        reply: {
          text: "No problem, I've cancelled that. 👍 Ask me anything else whenever you're ready!",
          chips: ["Room options", "Wedding venue", "Contact"],
          intent: "booking.cancel",
          confidence: 1,
        },
      };
    }

    const step = BOOKING_STEPS[booking.step];
    const data = { ...booking.data, [step.key]: text };
    if (entities.guests) data.guests = String(entities.guests);

    const nextIdx = booking.step + 1;
    if (nextIdx < BOOKING_STEPS.length) {
      const q = BOOKING_STEPS[nextIdx].q.replace("{name}", (data.name ?? "").split(" ")[0] || "there");
      const chipsByStep: Record<string, string[]> = {
        purpose: ["Room stay", "Wedding / Banquet", "Pool party", "Corporate event"],
        dates: ["This weekend", "Next month", "Not decided yet"],
        guests: ["2 guests", "50 guests", "200 guests", "500 guests"],
      };
      return {
        booking: { active: true, step: nextIdx, data },
        reply: {
          text: q,
          chips: chipsByStep[BOOKING_STEPS[nextIdx].key],
          intent: "booking.step",
          confidence: 1,
        },
      };
    }

    /* completed */
    const summary = [
      `• **Name:** ${data.name ?? "—"}`,
      `• **Contact:** ${data.contact ?? "—"}`,
      `• **Occasion:** ${data.purpose ?? "—"}`,
      `• **Dates:** ${data.dates ?? "—"}`,
      `• **Guests:** ${data.guests ?? "—"}`,
    ].join("\n");

    return {
      booking: emptyBooking(),
      reply: {
        text: `Perfect — I have everything I need! 🌸\n\n${summary}\n\nI'm sending this straight to our reservations team on **WhatsApp** now. Just tap *Send* in WhatsApp and they'll reply with availability and the best offer.\n\nIf WhatsApp doesn't open automatically, use the button below. 👇`,
        chips: ["📲 Send on WhatsApp", "📞 Call instead", "Ask something else"],
        intent: "booking.complete",
        confidence: 1,
        action: "whatsapp",
        lead: {
          name: data.name,
          contact: data.contact,
          purpose: data.purpose,
          dates: data.dates,
          guests: data.guests,
          source: "AI Concierge (Vrinda)",
        },
      },
    };
  }

  /* ---- start booking ---- */
  if (isBookingIntent(text, tokens)) {
    return {
      booking: { active: true, step: 0, data: {} },
      reply: {
        text: BOOKING_STEPS[0].q,
        intent: "booking.start",
        confidence: 0.95,
      },
    };
  }

  /* ---- normal intent matching ---- */
  let best: Intent | null = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    const s = scoreIntent(intent, text, tokens);
    if (s > bestScore) {
      bestScore = s;
      best = intent;
    }
  }

  if (!best || bestScore < 3) {
    // capacity shortcut: user typed just a number of guests
    if (entities.guests) {
      return {
        booking,
        reply: {
          text: `For around **${entities.guests} guests**, our banquet hall and landscaped gardens together give you plenty of flexibility. 🎉\n\nI'd recommend a combined hall + garden layout, with on-site rooms for close family. Shall I take a few quick details and send your enquiry to our events team on WhatsApp?`,
          chips: ["Yes, start booking", "Catering options", "📲 WhatsApp us"],
          intent: "capacity.number",
          confidence: 0.7,
        },
      };
    }
    return {
      booking,
      reply: {
        text: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
        chips: ["Room options", "Wedding venue", "Pricing", "📲 WhatsApp us"],
        intent: "fallback",
        confidence: 0.2,
      },
    };
  }

  const answer = typeof best.answer === "function" ? best.answer({}) : best.answer;
  const confidence = Math.min(0.99, 0.45 + bestScore / 20);

  let action: AgentReply["action"];
  if (best.id === "contact") action = undefined;

  return {
    booking,
    reply: { text: answer, chips: best.chips, intent: best.id, confidence, action },
  };
}

/** Converts a very small subset of markdown to HTML (bold + line breaks + bullets). */
export function renderRich(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export const SUGGESTIONS = [
  "What rooms do you have?",
  "Tell me about the banquet hall",
  "Pool party packages?",
  "Where are you located?",
  "What's the price?",
  "I want to book",
];
