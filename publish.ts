import type { Review, Story } from "./data";
import type { SeoSettings } from "./seo";
import type { SiteSettings } from "./settings";
import type { MediaOverrides } from "./media";
import type { BotFaq } from "./store";

/** Everything the admin can change, in one portable bundle. */
export type ContentPack = {
  version: 1;
  publishedAt: string;
  settings: Partial<SiteSettings>;
  media: MediaOverrides;
  reviews: Review[];
  stories: Story[];
  faqs: BotFaq[];
  seo: SeoSettings;
};

/** Where the published pack lives once committed to the repo. */
export const CONTENT_URL = "/content.json";

/** Loads the published content pack. Returns null if none is deployed yet. */
export async function fetchPublished(): Promise<ContentPack | null> {
  try {
    const res = await fetch(`${CONTENT_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as ContentPack;
    return data && data.version === 1 ? data : null;
  } catch {
    return null;
  }
}

/** Approximate byte size of the pack, for the admin UI. */
export function packSize(pack: ContentPack): string {
  const bytes = new Blob([JSON.stringify(pack)]).size;
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export function downloadPack(pack: ContentPack) {
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "content.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function readPackFile(file: File): Promise<ContentPack> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Could not read file"));
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result)) as ContentPack;
        if (data?.version !== 1) throw new Error("Not a valid content.json");
        resolve(data);
      } catch (e) {
        reject(e);
      }
    };
    r.readAsText(file);
  });
}
