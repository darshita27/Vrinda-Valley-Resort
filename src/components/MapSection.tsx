import { useState } from "react";
import { MAP, CONTACT } from "../data";
import Reveal from "./Reveal";

export default function MapSection() {
  const [loaded, setLoaded] = useState(false);

  const routes = [
    { icon: "✈️", label: "Jaipur International Airport", note: "Direct flights from all metros" },
    { icon: "🚆", label: "Jaipur Junction Railway Station", note: "Well connected across India" },
    { icon: "🛣️", label: "NH-48 / Delhi–Jaipur Highway", note: "Easy self-drive access" },
    { icon: "🏰", label: "Amer Fort & City Palace", note: "Classic Jaipur sightseeing nearby" },
  ];

  return (
    <section id="location" className="py-28 md:py-36 bg-white">
      <div className="max-w-[1340px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <div className="flex items-center gap-4 mb-6 justify-center">
            <span className="h-px w-12 bg-gold-400" />
            <span className="tracking-[0.4em] text-[10px] uppercase font-medium text-gold-500">
              Find Us
            </span>
            <span className="h-px w-12 bg-gold-400" />
          </div>
          <h2 className="display text-4xl md:text-[3.4rem] text-stone-900">
            Location & Directions
          </h2>
          <p className="text-stone-600 mt-5 max-w-2xl mx-auto font-light leading-relaxed">
            Ideally located with convenient access to Jaipur while surrounded by natural beauty —
            close to the city, far from the noise.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-5 gap-8 items-stretch">
          {/* Map */}
          <Reveal className="lg:col-span-3">
            <div className="relative h-[460px] rounded-[1.75rem] overflow-hidden shadow-[0_30px_70px_-28px_rgba(6,42,30,.5)] border border-stone-200 bg-stone-100">
              {!loaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-stone-400 animate-pulse">
                  <span className="text-4xl">🗺️</span>
                  <span className="text-xs tracking-widest uppercase">Loading map…</span>
                </div>
              )}
              <iframe
                title="Vrinda Valley Resort Jaipur — Google Map location"
                src={MAP.embed}
                onLoad={() => setLoaded(true)}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Reveal>

          {/* Info panel */}
          <Reveal delay={140} className="lg:col-span-2">
            <div className="h-full bg-emerald-950 rounded-[1.75rem] p-9 text-white relative overflow-hidden grain flex flex-col">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(212,175,55,.16),transparent_60%)]" />
              <div className="relative flex-1">
                <h3 className="font-serif text-2xl mb-2">Vrinda Valley Resort</h3>
                <p className="text-white/60 text-sm mb-7 font-light">{CONTACT.address}</p>

                <div className="gold-rule mb-7" />

                <div className="space-y-5">
                  {routes.map((r) => (
                    <div key={r.label} className="flex items-start gap-4">
                      <span className="text-xl shrink-0 w-9 h-9 rounded-full bg-white/8 flex items-center justify-center">
                        {r.icon}
                      </span>
                      <div>
                        <div className="text-[13.5px] font-medium text-white/90">{r.label}</div>
                        <div className="text-[11.5px] text-white/50">{r.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mt-8 space-y-3">
                <a
                  href={MAP.directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold flex items-center justify-center gap-2 text-emerald-950 font-semibold text-sm py-3.5 rounded-full w-full"
                >
                  <span className="relative z-10">🧭 Get Directions</span>
                </a>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={MAP.search}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass text-white text-[13px] py-3 rounded-full text-center hover:bg-white/15 transition-all"
                  >
                    View on Maps
                  </a>
                  <a
                    href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
                    className="glass text-white text-[13px] py-3 rounded-full text-center hover:bg-white/15 transition-all"
                  >
                    📞 Call Us
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
