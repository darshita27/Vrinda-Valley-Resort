import { useState, useEffect } from "react";
import type { ContentStore, BookingStatus } from "../store";
import { fileToDataUrl, STATUS_META } from "../store";
import { SEO_KEYWORDS, type Story } from "../data";
import { MEDIA_SLOTS, MEDIA_GROUPS } from "../media";
import { whatsappLink } from "../whatsapp";
import SettingsTab from "./admin/SettingsTab";
import BotTab from "./admin/BotTab";
import PublishTab from "./admin/PublishTab";
import PhotoFilesTab from "./admin/PhotoFilesTab";
import Login from "./admin/Login";

const blank = (): Story => ({
  id: `s${Date.now()}`,
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  keywords: [],
  cover: "",
  author: "Vrinda Valley Team",
  date: new Date().toISOString().slice(0, 10),
  published: true,
});

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 70);

export default function AdminPanel({
  store,
  open,
  onClose,
}: {
  store: ContentStore;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<
    "bookings" | "media" | "files" | "settings" | "bot" | "publish" | "seo" | "stories" | "reviews"
  >("bookings");


  // SEO draft
  const [title, setTitle] = useState(store.seo.title);
  const [desc, setDesc] = useState(store.seo.description);
  const [kw, setKw] = useState(store.seo.keywords.join("\n"));
  const [saved, setSaved] = useState(false);

  // Story editor
  const [draft, setDraft] = useState<Story | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTitle(store.seo.title);
    setDesc(store.seo.description);
    setKw(store.seo.keywords.join("\n"));
  }, [store.seo]);

  if (!open) return null;

  /* ---------------- login gate ---------------- */
  if (!store.isAdmin) {
    return (
      <Shell onClose={onClose}>
        <Login store={store} />
      </Shell>
    );
  }

  const pending = store.reviews.filter((r) => !r.approved);
  const newBookings = store.bookings.filter((b) => b.status === "new").length;
  // local edits that differ from the live, published version
  const unpublished =
    !store.published ||
    JSON.stringify(store.published.media) !== JSON.stringify(store.media) ||
    JSON.stringify(store.published.settings) !== JSON.stringify(store.settings);

  /* ---------------- dashboard ---------------- */
  return (
    <Shell onClose={onClose} wide>
      <div className="flex flex-col h-full">
        {/* header */}
        <div className="bg-emerald-950 text-white px-7 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-200 to-gold-500 flex items-center justify-center font-serif text-emerald-950">V</div>
            <div>
              <div className="font-serif text-xl leading-tight">Admin Dashboard</div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-gold-200/80">Vrinda Valley Resort</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={store.logout} className="text-[12px] px-4 py-2 rounded-full glass hover:bg-white/15">Logout</button>
            <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-white/10 text-lg">✕</button>
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-1 px-7 pt-4 bg-stone-50 border-b border-stone-200 shrink-0">
          {([
            ["bookings", `📋 Bookings${newBookings ? ` · ${newBookings} new` : ""}`],
            ["settings", "⚙️ Settings"],
            ["files", "📁 Photo Files"],
            ["media", `🖼️ Quick Edit (${MEDIA_SLOTS.length})`],
            ["bot", `🤖 AI Bot${store.faqs.length ? ` (${store.faqs.length})` : ""}`],
            ["seo", "🔍 SEO"],
            ["stories", `📝 Stories (${store.stories.length})`],
            ["reviews", `⭐ Reviews${pending.length ? ` · ${pending.length} new` : ""}`],
            ["publish", unpublished ? "🚀 Publish ●" : "🚀 Publish"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-5 py-3 text-[13px] font-medium rounded-t-xl transition-all ${
                tab === k ? "bg-white text-emerald-900 border border-b-white border-stone-200" : "text-stone-500 hover:text-emerald-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto chat-scroll bg-white p-7">
          {/* ---------- Bookings ---------- */}
          {tab === "bookings" && <BookingsTab store={store} />}

          {/* ---------- Settings ---------- */}
          {tab === "settings" && <SettingsTab store={store} />}

          {/* ---------- AI Bot ---------- */}
          {tab === "bot" && <BotTab store={store} />}

          {/* ---------- Publish ---------- */}
          {tab === "publish" && <PublishTab store={store} />}

          {/* ---------- Photo files ---------- */}
          {tab === "files" && <PhotoFilesTab />}

          {/* ---------- Media ---------- */}
          {tab === "media" && <MediaTab store={store} />}

          {/* ---------- SEO ---------- */}
          {tab === "seo" && (
            <div className="max-w-3xl space-y-6">
              <Note>
                These values update the page title, meta description, keywords and Google
                structured data instantly.
              </Note>

              <Field label={`Page Title (${title.length}/60 recommended)`}>
                <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} />
              </Field>

              <Field label={`Meta Description (${desc.length}/160 recommended)`}>
                <textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} className={inp} />
              </Field>

              <Field label="Target Keywords (one per line)">
                <textarea rows={10} value={kw} onChange={(e) => setKw(e.target.value)} className={`${inp} font-mono text-[12.5px]`} />
              </Field>

              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">Suggested High-Intent Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {SEO_KEYWORDS.filter((k) => !kw.includes(k)).map((k) => (
                    <button
                      key={k}
                      onClick={() => setKw((v) => (v ? v + "\n" + k : k))}
                      className="text-[11.5px] px-3 py-1.5 rounded-full border border-stone-300 text-stone-600 hover:border-gold-400 hover:text-emerald-900 transition-all"
                    >
                      + {k}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    store.setSeo({
                      title,
                      description: desc,
                      keywords: kw.split("\n").map((s) => s.trim()).filter(Boolean),
                    });
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2500);
                  }}
                  className="bg-emerald-900 hover:bg-emerald-800 text-white font-semibold px-8 py-3 rounded-full text-sm"
                >
                  Save & Apply SEO
                </button>
                {saved && <span className="text-emerald-700 text-sm self-center">✓ Applied to the live page</span>}
              </div>
            </div>
          )}

          {/* ---------- Stories ---------- */}
          {tab === "stories" && (
            <div className="max-w-4xl">
              {draft ? (
                <div className="space-y-5">
                  <h3 className="font-serif text-2xl text-stone-900">
                    {store.stories.some((s) => s.id === draft.id) ? "Edit Story" : "New Story"}
                  </h3>

                  <Field label="Title">
                    <input
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: slugify(e.target.value) })}
                      placeholder="e.g. Top 5 Wedding Venues in Jaipur"
                      className={inp}
                    />
                  </Field>

                  <Field label="URL Slug">
                    <input value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} className={`${inp} font-mono text-[12.5px]`} />
                  </Field>

                  <Field label="Excerpt (shows in search results & cards)">
                    <textarea rows={2} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} className={inp} />
                  </Field>

                  <Field label="Story Body">
                    <textarea rows={10} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className={inp} placeholder="Write your SEO story here…" />
                  </Field>

                  <Field label="Keywords (comma separated)">
                    <input
                      value={draft.keywords.join(", ")}
                      onChange={(e) => setDraft({ ...draft, keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                      placeholder="wedding venue Jaipur, destination wedding"
                      className={inp}
                    />
                  </Field>

                  <Field label="Cover Image">
                    {draft.cover ? (
                      <div className="relative h-44 rounded-xl overflow-hidden">
                        <img src={draft.cover} alt="cover" className="w-full h-full object-cover" />
                        <button onClick={() => setDraft({ ...draft, cover: "" })} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white">✕</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-stone-300 rounded-xl cursor-pointer hover:border-gold-400 transition-all">
                        <span className="text-xl mb-1">{busy ? "⏳" : "🖼️"}</span>
                        <span className="text-[12px] text-stone-500">{busy ? "Processing…" : "Upload cover image"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setBusy(true);
                            try { setDraft({ ...draft, cover: await fileToDataUrl(file, 1100) }); } catch { /* ignore */ }
                            setBusy(false);
                          }}
                        />
                      </label>
                    )}
                  </Field>

                  <label className="flex items-center gap-2.5 text-sm text-stone-700">
                    <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} className="w-4 h-4 accent-emerald-800" />
                    Publish immediately (visible on website)
                  </label>

                  <div className="flex gap-3">
                    <button
                      onClick={() => { store.saveStory(draft); setDraft(null); }}
                      disabled={!draft.title}
                      className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-full text-sm"
                    >
                      Save Story
                    </button>
                    <button onClick={() => setDraft(null)} className="px-7 py-3 rounded-full border border-stone-300 text-stone-600 text-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <Note className="!mb-0 flex-1 mr-4">
                      Publish keyword-rich stories to improve your Google ranking for searches like
                      "wedding resort in Jaipur".
                    </Note>
                    <button onClick={() => setDraft(blank())} className="bg-emerald-900 hover:bg-emerald-800 text-white font-semibold px-6 py-3 rounded-full text-sm shrink-0">
                      + New Story
                    </button>
                  </div>

                  <div className="space-y-3">
                    {store.stories.map((s) => (
                      <div key={s.id} className="flex gap-4 items-center bg-stone-50 border border-stone-200 rounded-2xl p-4">
                        {s.cover && <img src={s.cover} alt="" className="w-20 h-16 rounded-lg object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-stone-900 text-sm truncate">{s.title}</div>
                          <div className="text-[12px] text-stone-500 truncate">{s.excerpt}</div>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {s.keywords.slice(0, 3).map((k) => (
                              <span key={k} className="text-[10px] bg-gold-50 text-gold-600 px-2 py-0.5 rounded-full">{k}</span>
                            ))}
                          </div>
                        </div>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full shrink-0 ${s.published ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}>
                          {s.published ? "Live" : "Draft"}
                        </span>
                        <button onClick={() => setDraft(s)} className="text-[12px] px-3 py-1.5 rounded-full border border-stone-300 hover:border-emerald-700 text-stone-600">Edit</button>
                        <button onClick={() => store.deleteStory(s.id)} className="text-[12px] px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ---------- Reviews ---------- */}
          {tab === "reviews" && (
            <div className="max-w-4xl">
              <Note>Approve guest reviews to publish them on the website and in Google rich results.</Note>
              <div className="space-y-3">
                {store.reviews.map((r) => (
                  <div key={r.id} className={`flex gap-4 items-start border rounded-2xl p-4 ${r.approved ? "bg-white border-stone-200" : "bg-amber-50/60 border-amber-200"}`}>
                    {r.photo && <img src={r.photo} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-stone-900 text-sm">{r.name}</span>
                        <span className="text-[11px] text-stone-500">· {r.city}</span>
                        <span className="text-gold-400 text-[12px]">{"★".repeat(r.rating)}</span>
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{r.occasion}</span>
                      </div>
                      <p className="text-[12.5px] text-stone-600 mt-1.5 line-clamp-3">{r.text}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => store.approveReview(r.id, !r.approved)}
                        className={`text-[12px] px-4 py-1.5 rounded-full font-medium ${r.approved ? "bg-emerald-100 text-emerald-800" : "bg-emerald-800 text-white"}`}
                      >
                        {r.approved ? "✓ Approved" : "Approve"}
                      </button>
                      <button onClick={() => store.deleteReview(r.id)} className="text-[12px] px-4 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ---------- Bookings tab ---------- */

function BookingsTab({ store }: { store: ContentStore }) {
  const [filter, setFilter] = useState<"all" | BookingStatus>("all");
  const [q, setQ] = useState("");

  const list = store.bookings.filter((b) => {
    if (filter !== "all" && b.status !== filter) return false;
    if (!q) return true;
    const hay = `${b.name} ${b.contact} ${b.purpose} ${b.dates} ${b.guests}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const counts = {
    all: store.bookings.length,
    new: store.bookings.filter((b) => b.status === "new").length,
    contacted: store.bookings.filter((b) => b.status === "contacted").length,
    confirmed: store.bookings.filter((b) => b.status === "confirmed").length,
    cancelled: store.bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div>
      {/* stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {([
          ["Total Enquiries", counts.all, "bg-stone-50 border-stone-200 text-stone-900"],
          ["New", counts.new, "bg-amber-50 border-amber-200 text-amber-800"],
          ["Contacted", counts.contacted, "bg-sky-50 border-sky-200 text-sky-800"],
          ["Confirmed", counts.confirmed, "bg-emerald-50 border-emerald-200 text-emerald-800"],
        ] as const).map(([label, n, cls]) => (
          <div key={label} className={`rounded-2xl border p-5 ${cls}`}>
            <div className="font-serif text-3xl leading-none">{n}</div>
            <div className="text-[10px] tracking-[0.25em] uppercase mt-2 opacity-70">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone, occasion…"
          className={`${inp} max-w-xs`}
        />
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "new", "contacted", "confirmed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-[12px] px-3.5 py-2 rounded-full capitalize transition-all ${
                filter === s ? "bg-emerald-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={store.exportBookingsCsv}
          disabled={!store.bookings.length}
          className="ml-auto text-[12.5px] px-4 py-2 rounded-full border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white disabled:opacity-40 transition-all"
        >
          ⬇ Export CSV
        </button>
      </div>

      {!list.length ? (
        <div className="text-center py-20 text-stone-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-sm">
            {store.bookings.length ? "No enquiries match this filter." : "No booking enquiries yet."}
          </p>
          <p className="text-[12px] mt-1">
            Every enquiry from the AI concierge, booking form and contact form appears here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <div key={b.id} className="border border-stone-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2.5 flex-wrap mb-2">
                    <span className="font-semibold text-stone-900">{b.name}</span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border ${STATUS_META[b.status].cls}`}>
                      {STATUS_META[b.status].label}
                    </span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{b.source}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] text-stone-600">
                    <div>📞 {b.contact}</div>
                    <div>🎉 {b.purpose}</div>
                    <div>📅 {b.dates}</div>
                    <div>👥 {b.guests}</div>
                  </div>
                  {b.message && <div className="text-[12.5px] text-stone-500 mt-2 italic">"{b.message}"</div>}
                  <div className="text-[11px] text-stone-400 mt-2">
                    {new Date(b.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                  <select
                    value={b.status}
                    onChange={(e) => store.setBookingStatus(b.id, e.target.value as BookingStatus)}
                    className="text-[12px] border border-stone-300 rounded-full px-3 py-1.5 outline-none focus:border-emerald-700 bg-white"
                  >
                    {(Object.keys(STATUS_META) as BookingStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <a
                      href={whatsappLink({
                        name: b.name, contact: b.contact, purpose: b.purpose,
                        dates: b.dates, guests: b.guests, message: b.message, source: b.source,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center text-[12px] px-3 py-1.5 rounded-full bg-[#25D366] text-white hover:bg-[#1fb757]"
                    >
                      📲 WhatsApp
                    </a>
                    <button
                      onClick={() => store.deleteBooking(b.id)}
                      className="text-[12px] px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Media tab ---------- */

function MediaTab({ store }: { store: ContentStore }) {
  const [group, setGroup] = useState<string>(MEDIA_GROUPS[0]);
  const [busy, setBusy] = useState<string | null>(null);
  const [urlFor, setUrlFor] = useState<string | null>(null);
  const [urlVal, setUrlVal] = useState("");

  const slots = MEDIA_SLOTS.filter((s) => s.group === group);
  const changed = Object.keys(store.media).length;

  const upload = async (id: string, file?: File | null) => {
    if (!file) return;
    setBusy(id);
    try {
      store.setMediaOverride(id, await fileToDataUrl(file, 1400));
    } catch {
      /* ignore */
    }
    setBusy(null);
  };

  return (
    <div>
      <Note>
        Replace any photo on the website with your own. Recommended: landscape JPG, at least
        1200px wide.
      </Note>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[12.5px] rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5">
        <span className="shrink-0">⚠️</span>
        <span>
          Photos you upload are saved <strong>on this device only</strong>. To show them on other
          phones and to your customers, open the <strong>🚀 Publish</strong> tab and follow the
          3 steps.
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 items-center">
        {MEDIA_GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`text-[12.5px] px-4 py-2 rounded-full transition-all ${
              group === g ? "bg-emerald-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {g}
          </button>
        ))}
        {changed > 0 && (
          <button
            onClick={() => confirm(`Reset all ${changed} changed photo(s) to original?`) && store.resetMedia()}
            className="ml-auto text-[12px] px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
          >
            Reset all ({changed})
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {slots.map((s) => {
          const custom = !!store.media[s.id];
          const src = store.img(s.id);
          return (
            <div key={s.id} className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
              <div className="relative h-40 bg-stone-100">
                <img src={src} alt={s.label} className="w-full h-full object-cover" />
                {custom && (
                  <span className="absolute top-2 left-2 text-[9px] tracking-widest uppercase bg-emerald-800 text-white px-2 py-1 rounded-full">
                    Custom
                  </span>
                )}
                {busy === s.id && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center text-sm text-stone-500">
                    ⏳ Processing…
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="text-[13px] font-medium text-stone-900 leading-tight">{s.label}</div>
                {s.note && <div className="text-[11px] text-stone-500 mt-0.5">{s.note}</div>}

                {urlFor === s.id ? (
                  <div className="mt-3 flex gap-2">
                    <input
                      autoFocus
                      value={urlVal}
                      onChange={(e) => setUrlVal(e.target.value)}
                      placeholder="https://image-url.jpg"
                      className="flex-1 min-w-0 border border-stone-300 rounded-full px-3 py-1.5 text-[11.5px] outline-none focus:border-gold-400"
                    />
                    <button
                      onClick={() => { if (urlVal.trim()) store.setMediaOverride(s.id, urlVal.trim()); setUrlFor(null); setUrlVal(""); }}
                      className="text-[11.5px] px-3 py-1.5 rounded-full bg-emerald-800 text-white shrink-0"
                    >
                      Set
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-3">
                    <label className="flex-1 text-center text-[11.5px] px-3 py-1.5 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 cursor-pointer transition-colors">
                      ⬆ Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(s.id, e.target.files?.[0])} />
                    </label>
                    <button
                      onClick={() => { setUrlFor(s.id); setUrlVal(""); }}
                      title="Use an image URL"
                      className="text-[11.5px] px-3 py-1.5 rounded-full border border-stone-300 text-stone-600 hover:border-emerald-700"
                    >
                      🔗
                    </button>
                    {custom && (
                      <button
                        onClick={() => store.clearMediaOverride(s.id)}
                        title="Restore original"
                        className="text-[11.5px] px-3 py-1.5 rounded-full border border-stone-300 text-stone-600 hover:border-red-400 hover:text-red-600"
                      >
                        ↺
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- small pieces ---------- */

function Shell({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-3xl shadow-2xl overflow-hidden w-full ${wide ? "max-w-5xl h-[88vh]" : "max-w-md"}`}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">{label}</span>
      {children}
    </label>
  );
}

function Note({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-emerald-50 border border-emerald-100 text-emerald-900 text-[12.5px] rounded-xl px-4 py-3 mb-6 ${className}`}>
      💡 {children}
    </div>
  );
}

const inp =
  "w-full border border-stone-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 bg-white transition-all placeholder:text-stone-400";
