import { useState, useEffect, useCallback } from "react";
import { SEED_REVIEWS, SEED_STORIES, type Review, type Story } from "./data";
import { defaultSeo, type SeoSettings } from "./seo";
import { resolveMedia, type MediaOverrides } from "./media";
import { DEFAULT_SETTINGS, syncSettings, waNumber, type SiteSettings } from "./settings";

const KEYS = {
  reviews: "vvr.reviews.v1",
  stories: "vvr.stories.v1",
  seo: "vvr.seo.v1",
  auth: "vvr.admin.v1",
  bookings: "vvr.bookings.v1",
  media: "vvr.media.v1",
  settings: "vvr.settings.v1",
  faqs: "vvr.faqs.v1",
  cred: "vvr.cred.v1",
};

/** Custom question/answer pairs the admin teaches the AI concierge. */
export type BotFaq = {
  id: string;
  keywords: string;
  answer: string;
  chips: string;
  enabled: boolean;
};

export type Credentials = { user: string; pass: string };

export const DEFAULT_CRED: Credentials = { user: "9530429585", pass: "Vrinda@1234" };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

/* ---------------- bookings ---------------- */

export type BookingStatus = "new" | "contacted" | "confirmed" | "cancelled";

export type Booking = {
  id: string;
  name: string;
  contact: string;
  purpose: string;
  dates: string;
  guests: string;
  message?: string;
  source: string;
  status: BookingStatus;
  createdAt: string;
};

export const STATUS_META: Record<BookingStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-amber-100 text-amber-800 border-amber-200" },
  contacted: { label: "Contacted", cls: "bg-sky-100 text-sky-800 border-sky-200" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  cancelled: { label: "Cancelled", cls: "bg-stone-200 text-stone-600 border-stone-300" },
};

/* ---------------- store ---------------- */

export function useContentStore() {
  const [reviews, setReviews] = useState<Review[]>(() => load(KEYS.reviews, SEED_REVIEWS));
  const [stories, setStories] = useState<Story[]>(() => load(KEYS.stories, SEED_STORIES));
  const [seo, setSeo] = useState<SeoSettings>(() => load(KEYS.seo, defaultSeo()));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => load(KEYS.auth, false));
  const [bookings, setBookings] = useState<Booking[]>(() => load(KEYS.bookings, []));
  const [media, setMedia] = useState<MediaOverrides>(() => load(KEYS.media, {}));
  const [settings, setSettingsState] = useState<SiteSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...load<Partial<SiteSettings>>(KEYS.settings, {}),
  }));
  const [faqs, setFaqs] = useState<BotFaq[]>(() => load(KEYS.faqs, []));
  const [cred, setCred] = useState<Credentials>(() => load(KEYS.cred, DEFAULT_CRED));
  const [otp, setOtp] = useState<string | null>(null);

  useEffect(() => save(KEYS.reviews, reviews), [reviews]);
  useEffect(() => save(KEYS.stories, stories), [stories]);
  useEffect(() => save(KEYS.seo, seo), [seo]);
  useEffect(() => save(KEYS.auth, isAdmin), [isAdmin]);
  useEffect(() => save(KEYS.bookings, bookings), [bookings]);
  useEffect(() => save(KEYS.media, media), [media]);
  useEffect(() => save(KEYS.faqs, faqs), [faqs]);
  useEffect(() => save(KEYS.cred, cred), [cred]);
  useEffect(() => {
    save(KEYS.settings, settings);
    syncSettings(settings); // keep non-React helpers in sync
  }, [settings]);

  /* ---- site settings ---- */
  const setSettings = useCallback((patch: Partial<SiteSettings>) => {
    setSettingsState((s) => ({ ...s, ...patch }));
  }, []);

  const resetSettings = useCallback(() => setSettingsState({ ...DEFAULT_SETTINGS }), []);

  /* ---- bot knowledge ---- */
  const saveFaq = useCallback((f: BotFaq) => {
    setFaqs((list) => (list.some((x) => x.id === f.id) ? list.map((x) => (x.id === f.id ? f : x)) : [f, ...list]));
  }, []);

  const deleteFaq = useCallback((id: string) => {
    setFaqs((list) => list.filter((f) => f.id !== id));
  }, []);

  /* ---- security / OTP ---- */
  const requestOtp = useCallback(() => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtp(code);
    const msg = encodeURIComponent(
      `*Vrinda Valley Resort — Admin Password Reset*\n\nYour One-Time Password is: *${code}*\n\nEnter this code on the admin login screen to set a new password. If you did not request this, please ignore.`
    );
    window.open(`https://wa.me/${waNumber(settings.whatsapp)}?text=${msg}`, "_blank", "noopener");
    return code;
  }, [settings.whatsapp]);

  const verifyOtp = useCallback((code: string) => !!otp && code.trim() === otp, [otp]);

  const resetPassword = useCallback((newPass: string) => {
    setCred((c) => ({ ...c, pass: newPass }));
    setOtp(null);
  }, []);

  const updateCredentials = useCallback((next: Partial<Credentials>) => {
    setCred((c) => ({ ...c, ...next }));
  }, []);

  /* ---- bookings ---- */
  const addBooking = useCallback(
    (b: Omit<Booking, "id" | "status" | "createdAt">) => {
      const booking: Booking = {
        ...b,
        id: `b${Date.now()}`,
        status: "new",
        createdAt: new Date().toISOString(),
      };
      setBookings((list) => [booking, ...list]);
      return booking;
    },
    []
  );

  const setBookingStatus = useCallback((id: string, status: BookingStatus) => {
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status } : b)));
  }, []);

  const deleteBooking = useCallback((id: string) => {
    setBookings((list) => list.filter((b) => b.id !== id));
  }, []);

  const exportBookingsCsv = useCallback(() => {
    const head = ["Date", "Name", "Contact", "Occasion", "Dates", "Guests", "Message", "Source", "Status"];
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const rows = bookings.map((b) =>
      [
        new Date(b.createdAt).toLocaleString("en-IN"),
        b.name, b.contact, b.purpose, b.dates, b.guests, b.message ?? "", b.source,
        STATUS_META[b.status].label,
      ].map(esc).join(",")
    );
    const csv = [head.join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `vrinda-valley-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [bookings]);

  /* ---- media ---- */
  const setMediaOverride = useCallback((id: string, dataUrl: string) => {
    setMedia((m) => ({ ...m, [id]: dataUrl }));
  }, []);

  const clearMediaOverride = useCallback((id: string) => {
    setMedia((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
  }, []);

  const resetMedia = useCallback(() => setMedia({}), []);

  /** Live image resolver used across the site. */
  const img = useCallback((id: string) => resolveMedia(id, media), [media]);

  /* ---- reviews ---- */
  const addReview = useCallback((r: Omit<Review, "id" | "date" | "approved">) => {
    const review: Review = {
      ...r,
      id: `u${Date.now()}`,
      date: new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      approved: false,
    };
    setReviews((list) => [review, ...list]);
    return review;
  }, []);

  const approveReview = useCallback((id: string, approved: boolean) => {
    setReviews((list) => list.map((r) => (r.id === id ? { ...r, approved } : r)));
  }, []);

  const deleteReview = useCallback((id: string) => {
    setReviews((list) => list.filter((r) => r.id !== id));
  }, []);

  /* ---- stories ---- */
  const saveStory = useCallback((s: Story) => {
    setStories((list) => {
      const exists = list.some((x) => x.id === s.id);
      return exists ? list.map((x) => (x.id === s.id ? s : x)) : [s, ...list];
    });
  }, []);

  const deleteStory = useCallback((id: string) => {
    setStories((list) => list.filter((s) => s.id !== id));
  }, []);

  /* ---- admin ---- */
  const login = useCallback(
    (user: string, pass: string) => {
      const u = user.trim().toLowerCase().replace(/[\s+-]/g, "");
      const expected = cred.user.toLowerCase().replace(/[\s+-]/g, "");
      // accept the contact number with or without the 91 country code, or "admin"
      const match = u === expected || u === `91${expected}` || `91${u}` === expected || u === "admin";
      const ok = match && pass === cred.pass;
      if (ok) setIsAdmin(true);
      return ok;
    },
    [cred]
  );

  const logout = useCallback(() => setIsAdmin(false), []);

  return {
    reviews, addReview, approveReview, deleteReview,
    stories, saveStory, deleteStory,
    seo, setSeo,
    bookings, addBooking, setBookingStatus, deleteBooking, exportBookingsCsv,
    media, setMediaOverride, clearMediaOverride, resetMedia, img,
    settings, setSettings, resetSettings,
    faqs, saveFaq, deleteFaq,
    cred, updateCredentials, requestOtp, verifyOtp, resetPassword, otpPending: !!otp,
    isAdmin, login, logout,
  };
}

export type ContentStore = ReturnType<typeof useContentStore>;

/** Reads an image File into a resized base64 data URL so it fits in localStorage. */
export function fileToDataUrl(file: File, maxW = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
