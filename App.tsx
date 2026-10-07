import { useState, useEffect } from "react";
import { NAV, FEATURES, EVENTS, SPACES, IMG } from "./data";

const IMG_LOGO = IMG.logo;
import BookingModal from "./components/BookingModal";
import AiConcierge from "./components/AiConcierge";
import Reveal from "./components/Reveal";
import MapSection from "./components/MapSection";
import Reviews from "./components/Reviews";
import Stories from "./components/Stories";
import AdminPanel from "./components/AdminPanel";
import { useContentStore, type ContentStore } from "./store";
import { applySeo } from "./seo";
import { whatsappChat, sendToWhatsApp } from "./whatsapp";
import MediaImg from "./components/MediaImg";
import { instaUrl, telHref } from "./settings";

/* ---------------- shared bits ---------------- */

function Kicker({ text, light, center }: { text: string; light?: boolean; center?: boolean }) {
  return (
    <div className={`flex items-center gap-4 mb-6 ${center ? "justify-center" : ""}`}>
      <span className="h-px w-12 bg-gold-400" />
      <span
        className={`tracking-[0.4em] text-[10px] uppercase font-medium ${
          light ? "text-gold-200" : "text-gold-500"
        }`}
      >
        {text}
      </span>
      {center && <span className="h-px w-12 bg-gold-400" />}
    </div>
  );
}

function GoldBtn({
  children,
  onClick,
  href,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const cls = `btn-gold relative inline-flex items-center justify-center text-emerald-950 font-semibold text-sm tracking-wide px-9 py-4 rounded-full transition-transform duration-300 hover:scale-[1.04] active:scale-95 shadow-[0_10px_30px_-10px_rgba(212,175,55,.75)] ${className}`;
  const inner = <span className="relative z-10">{children}</span>;
  return href ? (
    <a href={href} className={cls}>{inner}</a>
  ) : (
    <button onClick={onClick} className={cls}>{inner}</button>
  );
}

function GhostBtn({
  children, href, onClick, className = "",
}: { children: React.ReactNode; href?: string; onClick?: () => void; className?: string }) {
  const cls = `inline-flex items-center justify-center glass text-white text-sm tracking-wide px-9 py-4 rounded-full transition-all duration-300 hover:bg-white/15 hover:border-white/40 ${className}`;
  return href ? <a href={href} className={cls}>{children}</a> : <button onClick={onClick} className={cls}>{children}</button>;
}

/** Official resort logo, with a graceful monogram fallback. */
function Logo({ dark = false, store }: { dark?: boolean; store?: ContentStore }) {
  const [failed, setFailed] = useState(false);
  const src = store ? store.img("brand.logo") : IMG_LOGO;

  return (
    <a href="#home" className="flex items-center gap-3 group">
      {failed ? (
        <div className="rounded-full p-[1.5px] bg-gradient-to-br from-gold-200 via-gold-400 to-gold-500 shrink-0 w-[46px] h-[46px]">
          <div className="w-full h-full rounded-full bg-emerald-950 flex items-center justify-center">
            <span className="font-serif text-gold-200 text-xl">V</span>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt="Vrinda Valley Resort logo"
          onError={() => setFailed(true)}
          className="w-[46px] h-[46px] object-contain shrink-0 drop-shadow-[0_2px_6px_rgba(0,0,0,.4)]"
        />
      )}
      <div className="leading-none">
        <div className={`font-serif text-[22px] tracking-wide ${dark ? "text-stone-900" : "text-white"}`}>
          Vrinda Valley
        </div>
        <div className="text-[8.5px] tracking-[0.42em] uppercase text-gold-400 mt-1">
          Resort · Jaipur
        </div>
      </div>
    </a>
  );
}

/* ---------------- nav ---------------- */

function Nav({ onBook, store }: { onBook: () => void; store: ContentStore }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const h = document.body.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
      const ids = NAV.map((n) => n.href.slice(1));
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) setActive(id);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // lock background scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-[80] transition-all duration-500 ${
        scrolled
          ? "bg-emerald-950/92 backdrop-blur-xl py-3 shadow-[0_10px_40px_-12px_rgba(0,0,0,.6)]"
          : "bg-gradient-to-b from-black/55 via-black/20 to-transparent py-6"
      }`}
    >
      <div className="max-w-[1340px] mx-auto px-6 flex items-center justify-between">
        <Logo store={store} />

        <nav className="hidden lg:flex items-center gap-9">
          {NAV.map((l) => {
            const isActive = active === l.href.slice(1);
            return (
              <a
                key={l.label}
                href={l.href}
                className={`text-[13px] tracking-wide transition-colors relative group ${
                  isActive ? "text-gold-200" : "text-white/85 hover:text-gold-200"
                }`}
              >
                {l.label}
                <span
                  className={`absolute -bottom-1.5 left-0 h-px bg-gold-400 transition-all duration-400 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </a>
            );
          })}
          <GoldBtn onClick={onBook} className="!px-7 !py-3 !text-[13px]">Book Now</GoldBtn>
        </nav>

        <button onClick={() => setOpen(!open)} className="lg:hidden text-white text-2xl w-10 h-10" aria-label="menu">
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* scroll progress */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-gold-200 to-gold-500 transition-[width] duration-150" style={{ width: `${progress}%` }} />

      {open && (
        <div className="lg:hidden bg-emerald-950/98 backdrop-blur-xl mt-3 px-6 py-6 border-t border-emerald-800/60 flex flex-col gap-1 max-h-[calc(100svh-5rem)] overflow-y-auto chat-scroll">
          {NAV.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-white/90 active:text-gold-200 tracking-wide py-3 border-b border-white/5 text-[15px]"
            >
              {l.label}
            </a>
          ))}
          <div className="flex gap-3 pt-5">
            <a
              href={whatsappChat()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-3.5 rounded-full text-sm"
            >
              <WaIcon className="w-4 h-4 fill-current" /> WhatsApp
            </a>
            <GoldBtn onClick={() => { setOpen(false); onBook(); }} className="flex-1 !px-4">Book Now</GoldBtn>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------- hero ---------------- */

function Hero({ onBook, store }: { onBook: () => void; store: ContentStore }) {
  const s = store.settings;
  return (
    <section id="home" className="relative min-h-[100svh] flex items-center grain overflow-hidden">
      <div className="absolute inset-0 kenburns">
        <MediaImg store={store} id="hero" alt="Vrinda Valley Resort Jaipur" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/85 via-emerald-950/55 to-emerald-950/96" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(2,22,16,.8)_100%)]" />

      <div className="relative z-10 max-w-[1340px] mx-auto px-5 sm:px-6 pt-28 sm:pt-36 pb-32 sm:pb-44 w-full">
        <div className="max-w-4xl">
          <Reveal>
            <Kicker text={s.tagline} light />
          </Reveal>

          <Reveal delay={120}>
            <h1 className="display text-white text-[2.9rem] xs:text-5xl sm:text-6xl lg:text-[6rem] leading-[1.02] sm:leading-[0.98] mb-6 sm:mb-8 drop-shadow-[0_4px_24px_rgba(0,0,0,.55)]">
              Where Celebrations
              <br />
              <span className="italic gold-text">Become Legacy</span>
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="text-base sm:text-lg md:text-xl text-white/85 max-w-2xl mb-8 sm:mb-11 leading-relaxed font-light">
              From luxurious rooms to a grand banquet hall and poolside celebrations — your perfect
              getaway is just a booking away.
            </p>
          </Reveal>

          <Reveal delay={340}>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
              <GoldBtn onClick={onBook} className="w-full sm:w-auto">Reserve Your Stay</GoldBtn>
              <GhostBtn href="#events" className="w-full sm:w-auto">Plan an Event</GhostBtn>
            </div>
          </Reveal>

          {/* Social badges */}
          <Reveal delay={420}>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <a
                href={instaUrl(s.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="group flex items-center gap-2.5 rounded-full pl-1.5 pr-4 py-1.5 glass hover:bg-white/15 transition-all"
              >
                <span className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#962fbf] shrink-0">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white">
                    <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.13 1.38A5.9 5.9 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z" />
                  </svg>
                </span>
                <span className="text-white text-[13px] font-medium">@{s.instagram}</span>
              </a>

              <a
                href={whatsappChat()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex items-center gap-2.5 rounded-full pl-1.5 pr-4 py-1.5 glass hover:bg-white/15 transition-all"
              >
                <span className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center shrink-0">
                  <WaIcon className="w-[18px] h-[18px] fill-white" />
                </span>
                <span className="text-white text-[13px] font-medium">WhatsApp</span>
              </a>
            </div>
          </Reveal>

          <Reveal delay={520}>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-8 sm:gap-x-14 gap-y-5 mt-10 sm:mt-14 pt-7 sm:pt-9 border-t border-white/15">
              {[
                ["16", "Elegant Rooms"],
                ["01", "Banquet Hall"],
                ["24×7", "Hospitality"],
                ["5★", "Guest Rating"],
              ].map(([n, l]) => (
                <div key={l}>
                  <div className="font-serif text-3xl sm:text-4xl gold-text">{n}</div>
                  <div className="text-[9.5px] sm:text-[10px] tracking-[0.25em] uppercase text-white/60 mt-1.5">{l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2 text-white/50">
        <span className="text-[9px] tracking-[0.35em] uppercase">Scroll</span>
        <span className="w-px h-10 bg-gradient-to-b from-gold-400 to-transparent" />
      </div>
    </section>
  );
}

/** Reusable WhatsApp glyph. */
function WaIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.99 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/* ---------------- quick availability bar ---------------- */

function QuickBook({ onBook }: { onBook: () => void }) {
  return (
    <div className="relative z-30 -mt-20 mb-6 px-6 hidden md:block">
      <Reveal>
        <div className="max-w-5xl mx-auto bg-white/97 backdrop-blur-xl rounded-2xl shadow-[0_30px_70px_-25px_rgba(6,42,30,.55)] p-7 grid grid-cols-4 gap-6 border border-stone-100">
          {[
            { l: "Check In", el: <input type="date" className="field" /> },
            { l: "Check Out", el: <input type="date" className="field" /> },
            {
              l: "Guests",
              el: (
                <select className="field">
                  <option>1 Guest</option>
                  <option>2 Guests</option>
                  <option>3–4 Guests</option>
                  <option>5+ Guests</option>
                </select>
              ),
            },
          ].map((f, i) => (
            <div key={f.l} className={i < 2 ? "border-r border-stone-200 pr-6" : ""}>
              <label className="block text-[9px] tracking-[0.3em] uppercase text-gold-500 mb-2">{f.l}</label>
              <div className="[&_.field]:w-full [&_.field]:bg-transparent [&_.field]:outline-none [&_.field]:text-stone-800 [&_.field]:font-medium [&_.field]:text-sm">
                {f.el}
              </div>
            </div>
          ))}
          <GoldBtn onClick={onBook} className="!rounded-xl !px-4">Check Availability</GoldBtn>
        </div>
      </Reveal>
    </div>
  );
}

/* ---------------- about ---------------- */

function About({ store }: { store: ContentStore }) {
  return (
    <section id="about" className="py-28 md:py-40 bg-stone-50 relative">
      <div className="max-w-[1340px] mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
        <Reveal className="relative">
          <div className="rounded-[2rem] overflow-hidden shadow-[0_40px_80px_-30px_rgba(6,42,30,.5)] h-[520px]">
            <MediaImg store={store} id="about.main" alt="Luxury room at Vrinda Valley Resort" className="w-full h-full object-cover" />
          </div>
          <div className="hidden md:block absolute -bottom-14 -right-10 w-60 h-72 rounded-[1.5rem] overflow-hidden shadow-2xl border-[10px] border-stone-50">
            <MediaImg store={store} id="about.inset" alt="Resort grounds" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -top-7 -left-7 bg-emerald-950 px-7 py-5 rounded-2xl shadow-2xl border border-gold-400/25">
            <div className="font-serif text-4xl gold-text leading-none">16</div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-emerald-200/80 mt-2">Elegant Rooms</div>
          </div>
        </Reveal>

        <div>
          <Reveal><Kicker text="About the Resort" /></Reveal>
          <Reveal delay={80}>
            <h2 className="display text-4xl md:text-[3.4rem] text-stone-900 leading-[1.08] mb-7">
              A luxury destination for <em className="text-emerald-800">weddings, events</em> & serene getaways.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-stone-600 leading-[1.9] mb-5 font-light">
              Whether you're seeking a serene escape or planning a grand celebration, Vrinda Valley
              Resort invites you to experience refined luxury and warm hospitality.
            </p>
            <p className="text-stone-600 leading-[1.9] mb-10 font-light">
              With 16 elegantly crafted rooms, a magnificent banquet hall, a refreshing swimming
              pool, a spacious gourmet kitchen, and beautifully landscaped gardens — every moment
              here is designed to create comfort, elegance, and lasting memories.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="grid sm:grid-cols-2 gap-5 mb-10">
              {[
                ["👥", "Strong Team", "Unlocking hospitality excellence and ensuring your perfect stay"],
                ["✨", "Luxury Rooms", "Experience unrivalled luxury at our exquisite luxury rooms"],
              ].map(([icon, t, d]) => (
                <div key={t} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 lift">
                  <div className="text-2xl mb-3">{icon}</div>
                  <h4 className="font-serif text-xl text-stone-900 mb-1.5">{t}</h4>
                  <p className="text-[13px] text-stone-500 leading-relaxed">{d}</p>
                </div>
              ))}
            </div>
            <a href="#accommodations" className="inline-flex items-center gap-3 text-emerald-900 font-medium tracking-wide group">
              Explore Our Spaces
              <span className="w-10 h-px bg-gold-400 transition-all group-hover:w-16" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- accommodations ---------------- */

const SPACE_SLOTS = ["space.rooms", "space.banquet", "space.pool", "space.kitchen", "space.garden", "space.team"];

function Accommodations({ onBook, store }: { onBook: () => void; store: ContentStore }) {
  return (
    <section id="accommodations" className="py-28 md:py-36 bg-white">
      <div className="max-w-[1340px] mx-auto px-6">
        <Reveal className="text-center mb-20">
          <Kicker text="Accommodations & Spaces" center />
          <h2 className="display text-4xl md:text-[3.4rem] text-stone-900">Everything Under One Roof</h2>
          <p className="text-stone-600 mt-5 max-w-2xl mx-auto font-light leading-relaxed">
            Elegant rooms, a grand banquet hall, swimming pool, gourmet kitchen and lush gardens —
            perfect for unforgettable celebrations and premium stays.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SPACES.map((s, i) => (
            <Reveal key={s.title} delay={(i % 3) * 110}>
              <article className="group h-full bg-white rounded-[1.75rem] overflow-hidden border border-stone-200/70 shadow-[0_2px_20px_-8px_rgba(0,0,0,.1)] lift">
                <div className="relative h-64 overflow-hidden">
                  <MediaImg
                    store={store}
                    id={SPACE_SLOTS[i]}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-[1.12] transition-transform duration-[1.1s] ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent" />
                  <span className="absolute top-5 left-5 z-10 text-[9.5px] tracking-[0.25em] uppercase bg-emerald-950/85 backdrop-blur text-gold-200 px-3.5 py-1.5 rounded-full border border-gold-400/25">
                    {s.tag}
                  </span>
                </div>
                <div className="p-8">
                  <h3 className="font-serif text-[1.6rem] text-stone-900 mb-3">{s.title}</h3>
                  <p className="text-[13.5px] text-stone-600 leading-relaxed mb-6 font-light">{s.desc}</p>
                  <ul className="space-y-2 mb-7">
                    {s.points.map((p) => (
                      <li key={p} className="text-[13px] text-stone-600 flex items-center gap-2.5">
                        <span className="text-gold-500 text-[10px]">◆</span> {p}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={onBook}
                    className="w-full border border-emerald-900/25 text-emerald-900 hover:bg-emerald-900 hover:text-white hover:border-emerald-900 py-3 rounded-full text-[13px] font-medium tracking-wide transition-all duration-400"
                  >
                    Enquire Now
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- features ---------------- */

function Features({ store }: { store: ContentStore }) {
  return (
    <section id="features" className="relative py-28 md:py-36 bg-emerald-950 text-white overflow-hidden grain">
      <div className="absolute inset-0 opacity-[0.1]">
        <MediaImg store={store} id="features.bg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,.14),transparent_60%)]" />

      <div className="relative z-10 max-w-[1340px] mx-auto px-6">
        <Reveal className="text-center mb-20">
          <Kicker text="Why Choose Us" light center />
          <h2 className="display text-4xl md:text-[3.4rem]">Features & Amenities</h2>
          <p className="text-white/65 mt-5 max-w-xl mx-auto font-light">
            Thoughtful touches and premium facilities that make every stay effortless.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 110}>
              <div className="group h-full p-9 rounded-[1.5rem] glass hover:bg-white/[0.13] hover:border-gold-400/35 transition-all duration-500 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gold-400/0 group-hover:bg-gold-400/10 blur-2xl transition-all duration-700" />
                <div className="relative">
                  <div className="text-[2.2rem] mb-5 group-hover:scale-110 transition-transform duration-500 origin-left">{f.icon}</div>
                  <h3 className="font-serif text-2xl mb-3">{f.title}</h3>
                  <p className="text-white/65 text-[13.5px] leading-relaxed font-light">{f.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- events ---------------- */

function Events({ store }: { store: ContentStore }) {
  return (
    <section id="events" className="py-28 md:py-36 bg-stone-50">
      <div className="max-w-[1340px] mx-auto px-6">
        <Reveal className="text-center mb-20">
          <Kicker text="Weddings & Celebrations" center />
          <h2 className="display text-4xl md:text-[3.4rem] text-stone-900">Events at Vrinda Valley</h2>
          <p className="text-stone-600 mt-5 max-w-2xl mx-auto font-light leading-relaxed">
            A grand banquet hall, landscaped gardens and poolside venues — crafted for celebrations
            that stay in memory forever.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-10">
          {EVENTS.map((e, i) => (
            <Reveal key={e.title} delay={i * 130}>
              <article className="group">
                <div className="rounded-[1.75rem] overflow-hidden h-80 mb-7 shadow-xl relative">
                  <MediaImg
                    store={store}
                    id={`event.${i + 1}`}
                    alt={e.title}
                    className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-[1.1s]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <div className="text-[9.5px] tracking-[0.28em] uppercase text-gold-500 mb-3">{e.kicker}</div>
                <h3 className="font-serif text-[1.7rem] text-stone-900 mb-3">{e.title}</h3>
                <p className="text-stone-600 text-[13.5px] leading-relaxed font-light">{e.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={150}>
          <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Weddings & Receptions", "Corporate Events", "Birthday Parties", "Pool Parties"].map((t) => (
              <div
                key={t}
                className="bg-white border border-stone-200 rounded-2xl px-6 py-6 text-center text-[13.5px] font-medium text-stone-700 hover:border-gold-400 hover:text-emerald-900 hover:shadow-lg transition-all duration-400 cursor-default"
              >
                {t}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- gallery ---------------- */

function Gallery({ store }: { store: ContentStore }) {
  const shots = [
    { id: "gallery.1", big: true },
    { id: "gallery.2" },
    { id: "gallery.3" },
    { id: "gallery.4" },
    { id: "gallery.5" },
    { id: "gallery.6", big: true },
    { id: "gallery.7" },
    { id: "gallery.8" },
    { id: "gallery.9" },
    { id: "gallery.10" },
    { id: "gallery.11", big: true },
    { id: "gallery.12" },
  ];
  return (
    <section className="py-28 md:py-36 bg-white">
      <div className="max-w-[1340px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <Kicker text="Moments" center />
          <h2 className="display text-4xl md:text-[3.4rem] text-stone-900">Resort Gallery</h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[190px] gap-4">
          {shots.map((s, i) => (
            <Reveal key={i} delay={(i % 4) * 80} className={s.big ? "row-span-2" : ""}>
              <div className="h-full w-full overflow-hidden rounded-2xl group cursor-pointer relative">
                <MediaImg store={store} id={s.id} alt="Vrinda Valley Resort" className="w-full h-full object-cover group-hover:scale-[1.14] transition-transform duration-[1.2s]" />
                <div className="absolute inset-0 bg-emerald-950/0 group-hover:bg-emerald-950/25 transition-colors duration-500" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}



/* ---------------- CTA ---------------- */

function CTA({ onBook, store }: { onBook: () => void; store: ContentStore }) {
  return (
    <section className="relative py-36 grain overflow-hidden">
      <div className="absolute inset-0">
        <MediaImg store={store} id="cta.bg" alt="" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-emerald-950/85" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,.16),transparent_65%)]" />
      <Reveal className="relative z-10 max-w-3xl mx-auto px-6 text-center text-white">
        <div className="gold-rule w-36 mx-auto mb-9" />
        <h2 className="display text-4xl md:text-[3.8rem] leading-[1.08] mb-7">
          Your Perfect Getaway is <em className="gold-text">Just a Booking Away</em>
        </h2>
        <p className="text-white/75 text-lg mb-11 max-w-xl mx-auto font-light">
          Reserve your stay or plan your celebration at Vrinda Valley Resort, Jaipur.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <GoldBtn onClick={onBook}>Book Now</GoldBtn>
          <GhostBtn href={whatsappChat()}>📲 WhatsApp Us</GhostBtn>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- contact ---------------- */

function Contact({ store }: { store: ContentStore }) {
  const [sent, setSent] = useState(false);
  const [cf, setCf] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "Room Booking",
    message: "",
  });
  return (
    <section id="contact" className="py-28 md:py-36 bg-white">
      <div className="max-w-[1340px] mx-auto px-6 grid lg:grid-cols-2 gap-16">
        <Reveal>
          <Kicker text="Get in Touch" />
          <h2 className="display text-4xl md:text-[3.4rem] text-stone-900 mb-7">Contact Us</h2>
          <p className="text-stone-600 mb-10 leading-[1.9] font-light">
            Have a question about rooms, the banquet hall or planning your event? Our team is happy
            to help — or ask our AI concierge for an instant answer.
          </p>
          <div className="space-y-6">
            {[
              { i: "📍", l: "Address", v: store.settings.address },
              { i: "📞", l: "Phone", v: store.settings.phone, href: telHref(store.settings.phone) },
              ...(store.settings.phoneAlt
                ? [{ i: "☎️", l: "Alternate", v: store.settings.phoneAlt, href: telHref(store.settings.phoneAlt) }]
                : []),
              { i: "💬", l: "WhatsApp", v: store.settings.whatsapp, href: whatsappChat() },
              { i: "✉️", l: "Email", v: store.settings.email, href: `mailto:${store.settings.email}` },
              { i: "📷", l: "Instagram", v: `@${store.settings.instagram}`, href: instaUrl(store.settings.instagram) },
              { i: "🕐", l: "Reception", v: store.settings.hours },
            ].map((c) => (
              <div key={c.l} className="flex items-start gap-5 group">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-900 transition-colors duration-400">
                  {c.i}
                </div>
                <div className="min-w-0">
                  <div className="text-[9.5px] tracking-[0.3em] uppercase text-gold-500 mb-1">{c.l}</div>
                  {c.href ? (
                    <a
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="text-stone-800 font-medium hover:text-emerald-800 transition-colors break-words"
                    >
                      {c.v}
                    </a>
                  ) : (
                    <div className="text-stone-800 font-medium break-words">{c.v}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={140}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const lead = {
                name: cf.name,
                contact: [cf.phone, cf.email].filter(Boolean).join(" · "),
                purpose: cf.purpose,
                dates: "Not specified",
                guests: "Not specified",
                message: cf.message,
                source: "Contact form",
              };
              store.addBooking(lead);
              sendToWhatsApp(lead);
              setSent(true);
            }}
            className="bg-stone-50 rounded-[1.75rem] p-9 border border-stone-200/70 space-y-4 shadow-sm"
          >
            <h3 className="font-serif text-2xl text-stone-900 mb-1">Send an Enquiry</h3>
            {sent ? (
              <div className="py-12 text-center">
                <div className="text-5xl mb-4">📲</div>
                <p className="font-serif text-xl text-stone-900 mb-2">Opening WhatsApp…</p>
                <p className="text-stone-600 text-sm mb-5">
                  Just tap <strong>Send</strong> and our team will reply shortly.
                </p>
                <button type="button" onClick={() => setSent(false)} className="text-emerald-800 text-sm underline">
                  Send another enquiry
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 bg-[#25D366]/10 border border-[#25D366]/25 rounded-xl px-4 py-3 text-[12.5px] text-[#0f6b52]">
                  <span>📲</span> Goes straight to our team on WhatsApp.
                </div>
                <input required placeholder="Full Name" value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} className={fieldCls} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <input type="email" placeholder="Email" value={cf.email} onChange={(e) => setCf({ ...cf, email: e.target.value })} className={fieldCls} />
                  <input required type="tel" placeholder="Phone" value={cf.phone} onChange={(e) => setCf({ ...cf, phone: e.target.value })} className={fieldCls} />
                </div>
                <select value={cf.purpose} onChange={(e) => setCf({ ...cf, purpose: e.target.value })} className={fieldCls}>
                  <option>Room Booking</option>
                  <option>Banquet Hall / Wedding</option>
                  <option>Pool Party</option>
                  <option>Corporate Event</option>
                  <option>Other</option>
                </select>
                <textarea rows={4} placeholder="Your message…" value={cf.message} onChange={(e) => setCf({ ...cf, message: e.target.value })} className={fieldCls} />
                <button className="w-full bg-[#25D366] hover:bg-[#1fb757] text-white font-semibold py-4 rounded-full tracking-wide transition-all text-sm shadow-lg shadow-[#25D366]/25">
                  📲 Send on WhatsApp
                </button>
              </>
            )}
          </form>
        </Reveal>
      </div>
    </section>
  );
}

const fieldCls =
  "w-full border border-stone-300 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 bg-white transition-all placeholder:text-stone-400";

/* ---------------- footer ---------------- */

function Footer({ onAdmin, store }: { onAdmin: () => void; store: ContentStore }) {
  return (
    <footer className="bg-emerald-950 text-white/75 pt-16 sm:pt-20 pb-24 md:pb-8 relative grain overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(212,175,55,.1),transparent_55%)]" />
      <div className="relative max-w-[1340px] mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 pb-14 border-b border-white/10">
          <div>
            <Logo store={store} />
            <p className="text-[13.5px] leading-relaxed text-white/55 mt-6 font-light">
              Vrinda Valley Resort Jaipur — a luxury destination for weddings, events, and serene
              getaways.
            </p>
          </div>
          <div>
            <h4 className="font-serif text-white text-lg mb-6">Quick Links</h4>
            <ul className="space-y-2.5 text-[13.5px]">
              {NAV.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-gold-200 transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-white text-lg mb-6">Contact</h4>
            <ul className="space-y-2.5 text-[13.5px] text-white/55">
              <li className="leading-relaxed">📍 {store.settings.addressShort}</li>
              <li>
                <a href={telHref(store.settings.phone)} className="hover:text-gold-200">📞 {store.settings.phone}</a>
              </li>
              {store.settings.phoneAlt && (
                <li>
                  <a href={telHref(store.settings.phoneAlt)} className="hover:text-gold-200">☎️ {store.settings.phoneAlt}</a>
                </li>
              )}
              <li>
                <a href={whatsappChat()} target="_blank" rel="noopener noreferrer" className="hover:text-gold-200">💬 WhatsApp</a>
              </li>
              <li>
                <a href={`mailto:${store.settings.email}`} className="hover:text-gold-200 break-all">✉️ {store.settings.email}</a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif text-white text-lg mb-6">Stay Updated</h4>
            <p className="text-[13.5px] text-white/55 mb-5 font-light">Offers and updates from the resort.</p>
            <form className="flex" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 min-w-0 bg-white/8 border border-white/20 rounded-l-full px-4 py-3 text-[13px] outline-none focus:border-gold-400 placeholder:text-white/35"
              />
              <button className="btn-gold text-emerald-950 font-semibold px-6 rounded-r-full text-[13px] relative">
                <span className="relative z-10">Join</span>
              </button>
            </form>
            <div className="flex gap-3 mt-6">
              {[
                { i: "📷", href: instaUrl(store.settings.instagram), t: "Instagram" },
                { i: "💬", href: whatsappChat(), t: "WhatsApp" },
                { i: "📞", href: telHref(store.settings.phone), t: "Call" },
                { i: "✉️", href: `mailto:${store.settings.email}`, t: "Email" },
                ...(store.settings.facebook ? [{ i: "📘", href: store.settings.facebook, t: "Facebook" }] : []),
                ...(store.settings.youtube ? [{ i: "▶️", href: store.settings.youtube, t: "YouTube" }] : []),
              ].map((s) => (
                <a
                  key={s.t}
                  href={s.href}
                  title={s.t}
                  target={s.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-gold-400 hover:text-emerald-950 hover:border-gold-400 flex items-center justify-center transition-all duration-400"
                >
                  {s.i}
                </a>
              ))}
            </div>
            <a
              href={instaUrl(store.settings.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-[12.5px] text-gold-200 hover:text-gold-400 transition-colors"
            >
              @{store.settings.instagram}
            </a>
          </div>
        </div>

        {/* centred admin access */}
        <div className="pt-10 pb-2 flex justify-center">
          <button
            onClick={onAdmin}
            title="Admin login (Ctrl+Shift+A)"
            className="group inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full border border-white/15 bg-white/5 hover:bg-gold-400 hover:border-gold-400 hover:text-emerald-950 text-white/70 text-[12.5px] tracking-wide transition-all duration-400"
          >
            <span className="text-sm">🔐</span>
            Admin Login
          </button>
        </div>

        <div className="pt-5 flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 text-[11.5px] text-white/45 text-center sm:text-left">
          <div>© {new Date().getFullYear()} {store.settings.resortName}, Jaipur. All rights reserved.</div>
          <div className="flex gap-6 items-center">
            <a href="#" className="hover:text-gold-200">Privacy</a>
            <a href="#" className="hover:text-gold-200">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- app ---------------- */

export default function App() {
  const [booking, setBooking] = useState(false);
  const [admin, setAdmin] = useState(false);
  const store = useContentStore();
  const open = () => setBooking(true);

  /* keep document head + structured data in sync */
  useEffect(() => {
    applySeo(store.seo, store.reviews, store.stories);
  }, [store.seo, store.reviews, store.stories]);

  /* admin access: #admin hash or Ctrl+Shift+A */
  useEffect(() => {
    const check = () => {
      if (window.location.hash === "#admin") setAdmin(true);
    };
    check();
    const keys = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setAdmin(true);
      }
    };
    window.addEventListener("hashchange", check);
    window.addEventListener("keydown", keys);
    return () => {
      window.removeEventListener("hashchange", check);
      window.removeEventListener("keydown", keys);
    };
  }, []);

  const closeAdmin = () => {
    setAdmin(false);
    if (window.location.hash === "#admin") history.replaceState(null, "", window.location.pathname);
  };

  return (
    <div className="font-sans text-stone-800 bg-white overflow-x-hidden antialiased">
      <Nav onBook={open} store={store} />
      <Hero onBook={open} store={store} />
      <QuickBook onBook={open} />
      <About store={store} />
      <Accommodations onBook={open} store={store} />
      <Features store={store} />
      <Events store={store} />
      <Gallery store={store} />
      <Reviews store={store} />
      <Stories stories={store.stories} />
      <MapSection store={store} />
      <CTA onBook={open} store={store} />
      <Contact store={store} />
      <Footer onAdmin={() => setAdmin(true)} store={store} />

      <BookingModal open={booking} onClose={() => setBooking(false)} store={store} />
      <AdminPanel store={store} open={admin} onClose={closeAdmin} />
      <AiConcierge
        onOpenBooking={open}
        custom={store.faqs}
        onLead={(l) =>
          store.addBooking({
            name: l.name ?? "—",
            contact: l.contact ?? "—",
            purpose: l.purpose ?? "—",
            dates: l.dates ?? "—",
            guests: l.guests ?? "—",
            source: l.source ?? "AI Concierge",
          })
        }
      />

      {/* Floating WhatsApp — desktop/tablet only */}
      <a
        href={whatsappChat()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="group hidden md:flex fixed bottom-6 left-6 z-[85] items-center gap-3 bg-[#25D366] hover:bg-[#1fb757] text-white pl-4 pr-5 py-3.5 rounded-full shadow-[0_8px_30px_rgba(37,211,102,.45)] transition-all hover:scale-105 active:scale-95"
      >
        <WaIcon className="w-6 h-6 fill-current shrink-0" />
        <span className="text-sm font-semibold whitespace-nowrap max-w-0 group-hover:max-w-[120px] overflow-hidden transition-all duration-500">
          WhatsApp
        </span>
      </a>

      {/* Mobile sticky action bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-[86] bg-emerald-950/95 backdrop-blur-xl border-t border-white/10 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] flex gap-2.5">
        <a
          href={telHref(store.settings.phone)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-white/85 active:bg-white/10"
        >
          <span className="text-lg leading-none">📞</span>
          <span className="text-[10px] tracking-wide">Call</span>
        </a>
        <a
          href={whatsappChat()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-white/85 active:bg-white/10"
        >
          <WaIcon className="w-[18px] h-[18px] fill-[#25D366]" />
          <span className="text-[10px] tracking-wide">WhatsApp</span>
        </a>
        <button
          onClick={open}
          className="flex-[1.4] btn-gold relative text-emerald-950 font-bold text-[13px] rounded-xl"
        >
          <span className="relative z-10">Book Now</span>
        </button>
      </div>
    </div>
  );
}
