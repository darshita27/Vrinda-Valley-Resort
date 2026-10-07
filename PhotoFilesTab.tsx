import { useState, useEffect } from "react";
import { LOCAL_NAMES, IMG, IMG_CHAIN } from "../../data";
import { PHOTOS } from "../../settings";
import SmartImg from "../SmartImg";

type Key = keyof typeof LOCAL_NAMES;
type Row = { key: Key; label: string; where: string };

const GROUPS: { title: string; icon: string; rows: Row[] }[] = [
  {
    title: "Branding",
    icon: "🏷️",
    rows: [
      { key: "logo", label: "Resort Logo", where: "Header & footer" },
      { key: "logoAlt", label: "Logo (Alternate)", where: "Spare / print use" },
      { key: "logoMark", label: "Logo Mark", where: "Small icon use" },
    ],
  },
  {
    title: "Main Banner",
    icon: "🖼️",
    rows: [{ key: "hero", label: "Hero Photo", where: "Full-screen top banner" }],
  },
  {
    title: "About Section",
    icon: "✨",
    rows: [
      { key: "about1", label: "About Main", where: "About photo + Rooms card + Gallery 1" },
      { key: "about3", label: "About Inset", where: "Small overlap photo + Gallery 5" },
      { key: "about2", label: "Team Photo", where: "Hospitality card + Gallery 8" },
    ],
  },
  {
    title: "Banquet Hall",
    icon: "💍",
    rows: [
      { key: "banquetSetup", label: "Ceremony Setup", where: "Banquet card · Event 1 · Gallery 2" },
      { key: "banquetStage", label: "Stage / Evening", where: "Event 3 · CTA background · Gallery 12" },
      { key: "banquetSeating", label: "Hall Seating", where: "Event 2 · Gallery 6" },
    ],
  },
  {
    title: "Swimming Pool",
    icon: "🏊",
    rows: [
      { key: "poolHero", label: "Pool — Daytime", where: "Pool card · Gallery 9 · Moments" },
      { key: "poolNight1", label: "Pool Night 1", where: "Spare" },
      { key: "poolNight2", label: "Pool Night 2", where: "Gallery 10 · Moments" },
      { key: "poolNight3", label: "Pool Night 3", where: "Features background · Gallery 11" },
      { key: "poolNight5", label: "Pool Night 4", where: "Spare" },
      { key: "poolNight7", label: "Pool Night 5", where: "Spare" },
    ],
  },
  {
    title: "Kitchen",
    icon: "🍽️",
    rows: [
      { key: "kitchen1", label: "Kitchen 1", where: "Kitchen card · Gallery 3" },
      { key: "kitchen2", label: "Kitchen 2", where: "Gallery 7 · Moments" },
    ],
  },
  {
    title: "Gardens",
    icon: "🌿",
    rows: [{ key: "garden", label: "Landscaped Gardens", where: "Garden card · Gallery 4 · Moments" }],
  },
];

const ALL = GROUPS.flatMap((g) => g.rows);

export default function PhotoFilesTab() {
  const [found, setFound] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState("");
  const [preview, setPreview] = useState<Row | null>(null);

  /* detect which custom files already exist in public/photos/ */
  useEffect(() => {
    let alive = true;
    Promise.all(
      ALL.map(
        (r) =>
          new Promise<[string, boolean]>((res) => {
            const img = new Image();
            img.onload = () => res([r.key, true]);
            img.onerror = () => res([r.key, false]);
            img.src = `${PHOTOS}/${LOCAL_NAMES[r.key]}?probe=${Date.now()}`;
          })
      )
    ).then((pairs) => alive && setFound(Object.fromEntries(pairs)));
    return () => { alive = false; };
  }, []);

  const live = Object.values(found).filter(Boolean).length;

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    setCopied(t);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="max-w-4xl space-y-7">
      {/* how-to */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
        <h3 className="font-serif text-lg text-emerald-900 mb-2">
          📁 Every photo on the website — and its file name
        </h3>
        <ol className="text-[13px] text-emerald-900/85 leading-relaxed space-y-1 list-decimal list-inside">
          <li>Find the photo you want to change below.</li>
          <li>Rename your new photo to that exact file name.</li>
          <li>
            Drop it into{" "}
            <code className="bg-white/70 px-1.5 py-0.5 rounded font-mono text-[12px]">
              public/photos/
            </code>{" "}
            then commit &amp; push.
          </li>
        </ol>
      </div>

      {/* counter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-3 shrink-0">
          <span className="font-serif text-2xl text-emerald-900">{live}</span>
          <span className="text-stone-400"> / {ALL.length}</span>
          <div className="text-[10px] tracking-[0.25em] uppercase text-stone-500 mt-1">
            Replaced by you
          </div>
        </div>
        <p className="text-[12.5px] text-stone-500 flex-1 min-w-[220px]">
          Thumbnails below show the photo <strong>currently live</strong> on the website. Files you
          haven't replaced keep using the original resort photos.
        </p>
      </div>

      {/* groups */}
      {GROUPS.map((g) => (
        <section key={g.title}>
          <h4 className="font-serif text-lg text-stone-900 mb-3 flex items-center gap-2">
            <span>{g.icon}</span> {g.title}
            <span className="text-[11px] font-sans text-stone-400 font-normal">
              ({g.rows.length})
            </span>
          </h4>

          <div className="grid sm:grid-cols-2 gap-4">
            {g.rows.map((r) => {
              const file = LOCAL_NAMES[r.key];
              const custom = found[r.key];
              return (
                <div
                  key={r.key}
                  className="border border-stone-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow"
                >
                  {/* live photo */}
                  <button
                    onClick={() => setPreview(r)}
                    className="relative block w-full h-36 group"
                    title="Click to enlarge"
                  >
                    <SmartImg
                      src={custom ? `${PHOTOS}/${file}` : IMG[r.key]}
                      fallback={IMG_CHAIN[r.key]}
                      alt={r.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className={`absolute top-2.5 left-2.5 text-[9.5px] tracking-wider uppercase px-2.5 py-1 rounded-full font-semibold ${
                        custom
                          ? "bg-emerald-600 text-white"
                          : "bg-white/90 text-stone-600 backdrop-blur"
                      }`}
                    >
                      {custom ? "✓ Your photo" : "Original"}
                    </span>
                  </button>

                  {/* name + info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="flex-1 min-w-0 truncate font-mono text-[12.5px] text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
                        {file}
                      </code>
                      <button
                        onClick={() => copy(file)}
                        className="text-[11px] px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:border-emerald-700 hover:text-emerald-800 shrink-0 transition-colors"
                      >
                        {copied === file ? "✓" : "Copy"}
                      </button>
                    </div>
                    <div className="text-[12.5px] text-stone-800 font-medium">{r.label}</div>
                    <div className="text-[11.5px] text-stone-500 mt-0.5">{r.where}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* sizes */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 text-[12.5px] text-stone-600 leading-relaxed">
        <strong className="text-stone-900">Recommended sizes:</strong> hero 1920×1080px · all other
        photos 1400×900px · logo 400×400px transparent PNG. Keep each file under{" "}
        <strong>500 KB</strong> — compress free at{" "}
        <a href="https://squoosh.app" target="_blank" rel="noopener noreferrer" className="text-emerald-800 underline">
          squoosh.app
        </a>
        .
        <br />
        <br />
        <strong className="text-stone-900">Tip:</strong> keep the file name exactly as shown even if
        your image is a PNG — browsers read the actual image data, not the extension.
      </div>

      {/* lightbox */}
      {preview && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 gap-4"
          onClick={() => setPreview(null)}
        >
          <img
            src={found[preview.key] ? `${PHOTOS}/${LOCAL_NAMES[preview.key]}` : IMG[preview.key]}
            alt={preview.label}
            className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl"
          />
          <div className="text-center">
            <code className="font-mono text-sm text-gold-200">{LOCAL_NAMES[preview.key]}</code>
            <div className="text-white/60 text-[12.5px] mt-1">
              {preview.label} · {preview.where}
            </div>
          </div>
          <button className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 text-white text-lg hover:bg-white/20">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
