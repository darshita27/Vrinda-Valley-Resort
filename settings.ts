/* ------------------------------------------------------------------ */
/* Image sources                                                       */
/* ------------------------------------------------------------------ */

const REPO = "darshita27/Vrinda-Valley-Resort";

/**
 * IMPORTANT — why this is pinned to a commit instead of `main`.
 *
 * The commit "Replace existing project with new structure" removed the whole
 * `client/` folder from the repo, which deleted every resort photo from `main`.
 * The images still exist in git history, so we read them from the last commit
 * that contained them. This is why the site showed placeholders.
 *
 * Permanent fix: drop your photos into `public/photos/` (see the Photo Files
 * tab in the admin panel) — those always take priority over these URLs.
 */
const PHOTO_COMMIT = "0f2bd2973816362575679a1b6b6c881c62c0c274";

/** jsDelivr CDN — fast and cached */
const CDN = `https://cdn.jsdelivr.net/gh/${REPO}@${PHOTO_COMMIT}/client/assets`;
/** GitHub raw — fallback */
const RAW = `https://raw.githubusercontent.com/${REPO}/${PHOTO_COMMIT}/client/assets`;
/** Your own photos — drop files into `public/photos/` and they win automatically */
export const PHOTOS = "/photos";

/**
 * Resilient source chain for a resort photo.
 *
 * Order: your `public/photos/<name>` file → CDN copy → GitHub raw → stock backup.
 * This means simply dropping a file into `public/photos/` replaces that photo
 * site-wide, with no code changes at all.
 */
export function asset(
  path: string,
  stock?: string,
  localName?: string
): { src: string; fallback: string[] } {
  const local = localName ? `${PHOTOS}/${localName}` : null;
  const chain = [`${CDN}/${path}`, `${RAW}/${path}`, ...(stock ? [stock] : [])];
  return local ? { src: local, fallback: chain } : { src: chain[0], fallback: chain.slice(1) };
}

/* ------------------------------------------------------------------ */
/* Editable site settings                                              */
/* ------------------------------------------------------------------ */

export type SiteSettings = {
  resortName: string;
  tagline: string;
  phone: string;
  phoneAlt: string;
  whatsapp: string;
  email: string;
  address: string;
  addressShort: string;
  hours: string;
  checkIn: string;
  checkOut: string;
  instagram: string;
  facebook: string;
  youtube: string;
  mapQuery: string;
  lat: number;
  lng: number;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  resortName: "Vrinda Valley Resort",
  tagline: "Luxury Resort · Jaipur, Rajasthan",
  phone: "+91 95304 29585",
  phoneAlt: "+91 95711 98339",
  whatsapp: "+91 95304 29585",
  email: "vrindavalleyjaipur@gmail.com",
  address:
    "Vrinda Valley, Diggi Malpura Rd, Bagran Ka Bam, Balawala, Hargun Ki Nangal at Charanwala, Rajasthan 303904",
  addressShort: "Diggi Malpura Rd, Balawala, Jaipur, Rajasthan 303904",
  hours: "Reception open 24 × 7",
  checkIn: "2:00 PM",
  checkOut: "11:00 AM",
  instagram: "vrindavalleyresort",
  facebook: "",
  youtube: "",
  mapQuery:
    "Vrinda Valley, Diggi Malpura Rd, Bagran Ka Bam, Balawala, Hargun Ki Nangal at Charanwala, Rajasthan 303904",
  lat: 26.6184,
  lng: 75.6421,
};

/** Digits-only phone, suitable for tel: and wa.me links. */
export const digits = (s: string) => s.replace(/[^\d]/g, "");

export const telHref = (s: string) => `tel:+${digits(s).replace(/^91/, "91")}`;

export const waNumber = (s: string) => {
  const d = digits(s);
  return d.startsWith("91") ? d : `91${d}`;
};

export const instaUrl = (h: string) =>
  h.startsWith("http") ? h : `https://instagram.com/${h.replace(/^@/, "")}`;

export const mapLinks = (s: SiteSettings) => {
  const q = encodeURIComponent(s.mapQuery);
  return {
    embed: `https://www.google.com/maps?q=${q}&output=embed&z=14`,
    directions: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    search: `https://www.google.com/maps/search/?api=1&query=${q}`,
  };
};

/* ------------------------------------------------------------------ */
/* Live mirror — lets non-React helpers read current settings          */
/* ------------------------------------------------------------------ */

let live: SiteSettings = { ...DEFAULT_SETTINGS };
export const getSettings = () => live;
export const syncSettings = (s: SiteSettings) => {
  live = s;
};
