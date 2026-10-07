import { IMG, IMG_CHAIN, FALLBACK, MOMENTS } from "./data";

export type MediaSlot = {
  id: string;
  label: string;
  group: string;
  note?: string;
  src: string;
  fallback: string[];
};

type Key = keyof typeof IMG;

/** Slot builder: repo photo + its CDN/raw/local chain + optional stock backup. */
const slot = (
  id: string,
  label: string,
  group: string,
  key: Key,
  stock?: string,
  note?: string
): MediaSlot => ({
  id,
  label,
  group,
  note,
  src: IMG[key],
  fallback: [...IMG_CHAIN[key], ...(stock ? [stock] : [])],
});

export const MEDIA_SLOTS: MediaSlot[] = [
  /* ---- branding ---- */
  slot("brand.logo", "Resort Logo", "Branding", "logo", undefined, "Header & footer — transparent PNG works best"),

  /* ---- homepage ---- */
  slot("hero", "Hero Background", "Homepage", "hero", FALLBACK.hero, "Full-screen banner"),

  /* ---- about ---- */
  slot("about.main", "About — Main Photo", "About", "about1", FALLBACK.room),
  slot("about.inset", "About — Inset Photo", "About", "about3", FALLBACK.pool),

  /* ---- accommodations ---- */
  slot("space.rooms", "Luxury Rooms", "Accommodations", "about1", FALLBACK.room),
  slot("space.banquet", "Banquet Hall", "Accommodations", "banquetSetup", FALLBACK.banquet),
  slot("space.pool", "Swimming Pool", "Accommodations", "poolHero", FALLBACK.pool),
  slot("space.kitchen", "Gourmet Kitchen", "Accommodations", "kitchen1", FALLBACK.kitchen),
  slot("space.garden", "Landscaped Gardens", "Accommodations", "garden", FALLBACK.garden),
  slot("space.team", "Our Team", "Accommodations", "about2", FALLBACK.room),

  /* ---- section backgrounds ---- */
  slot("features.bg", "Features Section Background", "Sections", "poolNight3", FALLBACK.banquet),
  slot("cta.bg", "Call-to-Action Background", "Sections", "banquetStage", FALLBACK.banquet),

  /* ---- events ---- */
  slot("event.1", "Event 1 — Celebration Venue", "Events", "banquetSetup", FALLBACK.banquet),
  slot("event.2", "Event 2 — Wedding Setup", "Events", "banquetSeating", FALLBACK.banquet),
  slot("event.3", "Event 3 — Evening Ambience", "Events", "banquetStage", FALLBACK.banquet),

  /* ---- gallery ---- */
  slot("gallery.1", "Gallery 1 (large)", "Gallery", "about1", FALLBACK.room),
  slot("gallery.2", "Gallery 2", "Gallery", "banquetSetup", FALLBACK.banquet),
  slot("gallery.3", "Gallery 3", "Gallery", "kitchen1", FALLBACK.kitchen),
  slot("gallery.4", "Gallery 4", "Gallery", "garden", FALLBACK.garden),
  slot("gallery.5", "Gallery 5", "Gallery", "about3", FALLBACK.pool),
  slot("gallery.6", "Gallery 6 (large)", "Gallery", "banquetSeating", FALLBACK.banquet),
  slot("gallery.7", "Gallery 7", "Gallery", "kitchen2", FALLBACK.kitchen),
  slot("gallery.8", "Gallery 8", "Gallery", "about2", FALLBACK.room),
  slot("gallery.9", "Gallery 9", "Gallery", "poolHero", FALLBACK.pool),
  slot("gallery.10", "Gallery 10", "Gallery", "poolNight2", FALLBACK.pool),
  slot("gallery.11", "Gallery 11 (large)", "Gallery", "poolNight3", FALLBACK.pool),
  slot("gallery.12", "Gallery 12", "Gallery", "banquetStage", FALLBACK.banquet),

  /* ---- moments ---- */
  ...MOMENTS.map((m, i) => ({
    id: `moment.${i + 1}`,
    label: `Moment ${i + 1}`,
    group: "Resort Moments",
    note: m.caption,
    src: m.src,
    fallback: [] as string[],
  })),
];

export const MEDIA_GROUPS = Array.from(new Set(MEDIA_SLOTS.map((s) => s.group)));

export type MediaOverrides = Record<string, string>;

export function resolveMedia(id: string, overrides: MediaOverrides): string {
  return overrides[id] || MEDIA_SLOTS.find((s) => s.id === id)?.src || "";
}

export function slotFallback(id: string, overrides: MediaOverrides = {}): string[] {
  // a custom upload shouldn't fall back to the stock chain
  if (overrides[id]) return [];
  return MEDIA_SLOTS.find((s) => s.id === id)?.fallback ?? [];
}
