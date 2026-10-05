import { IMG, FALLBACK, MOMENTS } from "./data";

/**
 * Central registry of every editable photo on the website.
 * Admin can override any of these — overrides are stored by `id`.
 */
export type MediaSlot = {
  id: string;
  label: string;
  group: string;
  note?: string;
  src: string;
  fallback?: string;
};

export const MEDIA_SLOTS: MediaSlot[] = [
  /* ---- hero ---- */
  { id: "hero", label: "Hero Background", group: "Homepage", note: "Full-screen banner image", src: IMG.hero, fallback: FALLBACK.hero },

  /* ---- about ---- */
  { id: "about.main", label: "About — Main Photo", group: "About", src: IMG.about1, fallback: FALLBACK.room },
  { id: "about.inset", label: "About — Inset Photo", group: "About", src: IMG.about3, fallback: FALLBACK.pool },

  /* ---- spaces ---- */
  { id: "space.rooms", label: "Luxury Rooms", group: "Accommodations", src: IMG.about1, fallback: FALLBACK.room },
  { id: "space.banquet", label: "Banquet Hall", group: "Accommodations", src: IMG.banquetSetup, fallback: FALLBACK.banquet },
  { id: "space.pool", label: "Swimming Pool", group: "Accommodations", src: IMG.about3, fallback: FALLBACK.pool },
  { id: "space.kitchen", label: "Gourmet Kitchen", group: "Accommodations", src: IMG.kitchen1, fallback: FALLBACK.kitchen },
  { id: "space.garden", label: "Landscaped Gardens", group: "Accommodations", src: IMG.garden, fallback: FALLBACK.garden },
  { id: "space.team", label: "Our Team", group: "Accommodations", src: IMG.about2, fallback: FALLBACK.room },

  /* ---- features bg ---- */
  { id: "features.bg", label: "Features Section Background", group: "Sections", src: IMG.banquetSeating, fallback: FALLBACK.banquet },

  /* ---- events ---- */
  { id: "event.1", label: "Event 1 — Celebration Venue", group: "Events", src: IMG.banquetSetup, fallback: FALLBACK.banquet },
  { id: "event.2", label: "Event 2 — Wedding Setup", group: "Events", src: IMG.banquetSeating, fallback: FALLBACK.banquet },
  { id: "event.3", label: "Event 3 — Evening Ambience", group: "Events", src: IMG.banquetStage, fallback: FALLBACK.banquet },

  /* ---- gallery ---- */
  { id: "gallery.1", label: "Gallery 1 (large)", group: "Gallery", src: IMG.about1, fallback: FALLBACK.room },
  { id: "gallery.2", label: "Gallery 2", group: "Gallery", src: IMG.banquetSetup, fallback: FALLBACK.banquet },
  { id: "gallery.3", label: "Gallery 3", group: "Gallery", src: IMG.kitchen1, fallback: FALLBACK.kitchen },
  { id: "gallery.4", label: "Gallery 4", group: "Gallery", src: IMG.garden, fallback: FALLBACK.garden },
  { id: "gallery.5", label: "Gallery 5", group: "Gallery", src: IMG.about3, fallback: FALLBACK.pool },
  { id: "gallery.6", label: "Gallery 6 (large)", group: "Gallery", src: IMG.banquetSeating, fallback: FALLBACK.banquet },
  { id: "gallery.7", label: "Gallery 7", group: "Gallery", src: IMG.kitchen2, fallback: FALLBACK.kitchen },
  { id: "gallery.8", label: "Gallery 8", group: "Gallery", src: IMG.about2, fallback: FALLBACK.room },

  /* ---- cta ---- */
  { id: "cta.bg", label: "Call-to-Action Background", group: "Sections", src: IMG.banquetStage, fallback: FALLBACK.banquet },

  /* ---- moments ---- */
  ...MOMENTS.map((m, i) => ({
    id: `moment.${i + 1}`,
    label: `Moment ${i + 1} — ${m.caption}`,
    group: "Resort Moments",
    note: m.tag,
    src: m.src,
  })),
];

export const MEDIA_GROUPS = Array.from(new Set(MEDIA_SLOTS.map((s) => s.group)));

/** Overrides: { slotId: dataUrl | externalUrl } */
export type MediaOverrides = Record<string, string>;

/** Resolves the live image URL for a slot, honouring admin overrides. */
export function resolveMedia(id: string, overrides: MediaOverrides): string {
  if (overrides[id]) return overrides[id];
  return MEDIA_SLOTS.find((s) => s.id === id)?.src ?? "";
}

export function slotFallback(id: string): string | undefined {
  return MEDIA_SLOTS.find((s) => s.id === id)?.fallback;
}
