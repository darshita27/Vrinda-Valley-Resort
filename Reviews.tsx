import { useState, useMemo } from "react";
import { MOMENTS } from "../data";
import type { ContentStore } from "../store";
import { fileToDataUrl } from "../store";
import Reveal from "./Reveal";
import SmartImg from "./SmartImg";

function Stars({ n, size = "text-sm" }: { n: number; size?: string }) {
  return (
    <span className={`${size} text-gold-400 tracking-[0.15em]`}>
      {"★".repeat(n)}
      <span className="text-stone-300">{"★".repeat(5 - n)}</span>
    </span>
  );
}

/* ---------------- share-your-moment form ---------------- */

function ReviewForm({ store, onDone }: { store: ContentStore; onDone: () => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [occasion, setOccasion] = useState("Destination Wedding");
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const pick = async (f?: File | null) => {
    if (!f) return;
    setBusy(true);
    try {
      setPhoto(await fileToDataUrl(f, 900));
    } catch {
      /* ignore */
    }
    setBusy(false);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        store.addReview({ name, city, occasion, rating, text, photo });
        onDone();
      }}
      className="bg-white rounded-[1.75rem] p-8 md:p-10 border border-stone-200 shadow-xl space-y-5"
    >
      <div>
        <h3 className="font-serif text-2xl text-stone-900">Share Your Experience</h3>
        <p className="text-stone-500 text-[13px] mt-1">
          Tell us about your stay or celebration — and add a photo of your favourite moment.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={f} />
        <input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (e.g. Jaipur, Rajasthan)" className={f} />
      </div>

      <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className={f}>
        {["Destination Wedding", "Reception", "Engagement", "Pool Party", "Birthday Party", "Corporate Event", "Family Function", "Weekend Stay", "Anniversary Getaway"].map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>

      <div>
        <label className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">Your Rating</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setRating(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              className={`text-3xl leading-none transition-all hover:scale-125 ${
                i <= (hover || rating) ? "text-gold-400" : "text-stone-300"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <textarea
        required
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What made your experience special? (English or Hinglish — both welcome)"
        className={f}
      />

      <div>
        <label className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">
          Add a Photo (optional)
        </label>
        {photo ? (
          <div className="relative rounded-xl overflow-hidden h-44">
            <img src={photo} alt="Your moment" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setPhoto(undefined)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white text-sm"
            >
              ✕
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-gold-400 hover:bg-gold-50/40 transition-all">
            <span className="text-2xl mb-1">{busy ? "⏳" : "📷"}</span>
            <span className="text-[12px] text-stone-500">
              {busy ? "Processing…" : "Click to upload your moment"}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button className="btn-gold relative flex-1 text-emerald-950 font-semibold py-3.5 rounded-full">
          <span className="relative z-10">Submit Review</span>
        </button>
        <button type="button" onClick={onDone} className="px-7 rounded-full border border-stone-300 text-stone-600 text-sm hover:bg-stone-50">
          Cancel
        </button>
      </div>
      <p className="text-[11px] text-stone-400 text-center">
        Reviews appear on the site once approved by our team.
      </p>
    </form>
  );
}

const f =
  "w-full border border-stone-300 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 bg-white transition-all placeholder:text-stone-400";

/* ---------------- main section ---------------- */

export default function Reviews({ store }: { store: ContentStore }) {
  const [tab, setTab] = useState<"reviews" | "moments">("reviews");
  const [writing, setWriting] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const approved = useMemo(() => store.reviews.filter((r) => r.approved), [store.reviews]);
  const avg = approved.length
    ? (approved.reduce((a, r) => a + r.rating, 0) / approved.length).toFixed(1)
    : "5.0";

  const guestPhotos = approved.filter((r) => r.photo).map((r) => ({
    src: r.photo!,
    caption: `${r.occasion} — ${r.name}`,
    tag: "Guest Photo",
  }));
  // admin-managed moment photos take priority over the defaults
  const curated = MOMENTS.map((m, i) => ({ ...m, src: store.img(`moment.${i + 1}`) || m.src }));
  const allMoments = [...curated, ...guestPhotos];

  const shown = showAll ? approved : approved.slice(0, 6);

  return (
    <section id="reviews" className="py-28 md:py-36 bg-gradient-to-b from-emerald-50/50 to-stone-50">
      <div className="max-w-[1340px] mx-auto px-6">
        <Reveal className="text-center mb-12">
          <div className="flex items-center gap-4 mb-6 justify-center">
            <span className="h-px w-12 bg-gold-400" />
            <span className="tracking-[0.4em] text-[10px] uppercase font-medium text-gold-500">
              Guest Love
            </span>
            <span className="h-px w-12 bg-gold-400" />
          </div>
          <h2 className="display text-4xl md:text-[3.4rem] text-stone-900">Reviews & Moments</h2>

          <div className="flex items-center justify-center gap-5 mt-7">
            <div className="flex items-center gap-2.5 bg-white rounded-full pl-2 pr-5 py-2 shadow-sm border border-stone-200">
              <span className="w-10 h-10 rounded-full bg-emerald-900 text-gold-200 font-serif text-lg flex items-center justify-center">
                {avg}
              </span>
              <div className="text-left">
                <Stars n={Math.round(Number(avg))} />
                <div className="text-[10.5px] text-stone-500">
                  {approved.length} verified guest reviews
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Tabs */}
        <Reveal className="flex justify-center gap-2 mb-12">
          <div className="inline-flex bg-white rounded-full p-1.5 border border-stone-200 shadow-sm">
            {(["reviews", "moments"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-7 py-2.5 rounded-full text-[13px] font-medium capitalize transition-all ${
                  tab === t ? "bg-emerald-900 text-white shadow" : "text-stone-600 hover:text-emerald-900"
                }`}
              >
                {t === "reviews" ? "Guest Reviews" : "Resort Moments"}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Write-a-review panel */}
        {writing ? (
          <Reveal className="max-w-2xl mx-auto mb-16">
            <ReviewForm
              store={store}
              onDone={() => {
                setWriting(false);
                setThanks(true);
                setTimeout(() => setThanks(false), 6000);
              }}
            />
          </Reveal>
        ) : (
          <div className="text-center mb-14">
            {thanks ? (
              <div className="inline-flex items-center gap-3 bg-emerald-900 text-white px-7 py-4 rounded-full">
                <span className="text-xl">🌸</span>
                <span className="text-sm">
                  Thank you! Your review has been submitted for approval.
                </span>
              </div>
            ) : (
              <button
                onClick={() => setWriting(true)}
                className="btn-gold relative text-emerald-950 font-semibold px-9 py-4 rounded-full"
              >
                <span className="relative z-10">✍️ Share Your Review & Photo</span>
              </button>
            )}
          </div>
        )}

        {/* Reviews grid */}
        {tab === "reviews" && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
              {shown.map((r, i) => (
                <Reveal key={r.id} delay={(i % 3) * 100}>
                  <article className="h-full bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-stone-100 lift flex flex-col">
                    {r.photo && (
                      <button
                        onClick={() => setLightbox(r.photo!)}
                        className="h-48 overflow-hidden group relative block"
                      >
                        <SmartImg src={r.photo} alt={`${r.name} moment`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <span className="absolute inset-0 bg-emerald-950/0 group-hover:bg-emerald-950/20 transition-colors" />
                      </button>
                    )}
                    <div className="p-7 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <Stars n={r.rating} />
                        <span className="text-[9.5px] tracking-[0.2em] uppercase text-gold-600 bg-gold-50 px-2.5 py-1 rounded-full">
                          {r.occasion}
                        </span>
                      </div>
                      <p className="text-stone-700 text-[13.5px] leading-[1.85] font-light flex-1">
                        "{r.text}"
                      </p>
                      <div className="pt-5 mt-5 border-t border-stone-100 flex items-center gap-3">
                        {r.avatar ? (
                          <img src={r.avatar} alt={r.name} className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-emerald-900 text-gold-200 font-serif flex items-center justify-center">
                            {r.name[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-serif text-[17px] text-stone-900 leading-tight truncate">{r.name}</div>
                          <div className="text-[10.5px] text-stone-500">📍 {r.city} · {r.date}</div>
                        </div>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>

            {approved.length > 6 && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className="border border-emerald-900/30 text-emerald-900 hover:bg-emerald-900 hover:text-white px-8 py-3 rounded-full text-sm font-medium transition-all"
                >
                  {showAll ? "Show Less" : `View All ${approved.length} Reviews`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Moments masonry */}
        {tab === "moments" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allMoments.map((m, i) => (
              <Reveal key={i} delay={(i % 4) * 80} className={i % 7 === 0 ? "col-span-2 row-span-2" : ""}>
                <button
                  onClick={() => setLightbox(m.src)}
                  className="group relative w-full h-full overflow-hidden rounded-2xl block"
                  style={{ aspectRatio: i % 7 === 0 ? "4/3" : "1/1" }}
                >
                  <SmartImg src={m.src} alt={m.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.1s]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  <span className="absolute top-3 left-3 text-[9px] tracking-[0.2em] uppercase bg-gold-400 text-emerald-950 px-2.5 py-1 rounded-full font-semibold">
                    {m.tag}
                  </span>
                  <span className="absolute bottom-0 left-0 right-0 p-4 text-left text-white text-[12.5px] font-light translate-y-1 group-hover:translate-y-0 transition-transform">
                    {m.caption}
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Moment" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
          <button className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white text-xl hover:bg-white/20">
            ✕
          </button>
        </div>
      )}
    </section>
  );
}
