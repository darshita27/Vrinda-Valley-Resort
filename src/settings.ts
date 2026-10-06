/* ------------------------------------------------------------------ */
/* Image sources                                                       */
/* ------------------------------------------------------------------ */

const REPO = "darshita27/Vrinda-Valley-Resort";
/** jsDelivr CDN — fast, cached, CORS-friendly (primary) */
const CDN = `https://cdn.jsdelivr.net/gh/${REPO}@main/client/assets`;
/** GitHub raw (secondary) */
const RAW = `https://raw.githubusercontent.com/${REPO}/main/client/assets`;
/** Local copy — if you place files in `public/assets/...` these win offline */
const LOCAL = "/assets";

/**
 * Builds a resilient source chain for a repo asset.
 * Tries CDN → raw GitHub → local public folder → optional stock fallback.
 */
export function asset(path: string, stock?: string): { src: string; fallback: string[] } {
  return {
    src: `${CDN}/${path}`,
    fallback: [`${RAW}/${path}`, `${LOCAL}/${path}`, ...(stock ? [stock] : [])],
  };
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
  instagram: "vrindavalleyresortjaipur",
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
