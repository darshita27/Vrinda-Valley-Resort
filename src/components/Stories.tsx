import { useState } from "react";
import type { Story } from "../data";
import Reveal from "./Reveal";
import SmartImg from "./SmartImg";

export default function Stories({ stories }: { stories: Story[] }) {
  const [open, setOpen] = useState<Story | null>(null);
  const live = stories.filter((s) => s.published);
  if (!live.length) return null;

  return (
    <section id="stories" className="py-28 md:py-36 bg-white">
      <div className="max-w-[1340px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <div className="flex items-center gap-4 mb-6 justify-center">
            <span className="h-px w-12 bg-gold-400" />
            <span className="tracking-[0.4em] text-[10px] uppercase font-medium text-gold-500">
              Journal
            </span>
            <span className="h-px w-12 bg-gold-400" />
          </div>
          <h2 className="display text-4xl md:text-[3.4rem] text-stone-900">Stories & Guides</h2>
          <p className="text-stone-600 mt-5 max-w-2xl mx-auto font-light leading-relaxed">
            Planning tips, local guides and inspiration for your celebration in Jaipur.
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8">
          {live.slice(0, 6).map((s, i) => (
            <Reveal key={s.id} delay={(i % 3) * 110}>
              <article
                onClick={() => setOpen(s)}
                className="group h-full cursor-pointer bg-white rounded-[1.75rem] overflow-hidden border border-stone-200/70 shadow-sm lift flex flex-col"
              >
                <div className="h-52 overflow-hidden relative">
                  {s.cover ? (
                    <SmartImg src={s.cover} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.1s]" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-900 to-emerald-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/55 to-transparent" />
                </div>
                <div className="p-7 flex-1 flex flex-col">
                  <div className="text-[10px] tracking-[0.25em] uppercase text-gold-500 mb-3">
                    {new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <h3 className="font-serif text-[1.5rem] text-stone-900 leading-snug mb-3 group-hover:text-emerald-800 transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-[13.5px] text-stone-600 leading-relaxed font-light flex-1">{s.excerpt}</p>
                  <div className="flex flex-wrap gap-1.5 mt-5">
                    {s.keywords.slice(0, 2).map((k) => (
                      <span key={k} className="text-[10px] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full">
                        {k}
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-2 text-emerald-900 text-[13px] font-medium mt-5">
                    Read Story
                    <span className="w-6 h-px bg-gold-400 transition-all group-hover:w-10" />
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Reader */}
      {open && (
        <div className="fixed inset-0 z-[115] bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto chat-scroll" onClick={() => setOpen(null)}>
          <article
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full my-10 overflow-hidden shadow-2xl"
          >
            {open.cover && (
              <div className="h-64 relative">
                <SmartImg src={open.cover} alt={open.title} className="w-full h-full object-cover" />
                <button onClick={() => setOpen(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/55 text-white text-lg backdrop-blur">
                  ✕
                </button>
              </div>
            )}
            <div className="p-9 md:p-11">
              <div className="text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-4">
                {open.author} · {new Date(open.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </div>
              <h1 className="display text-3xl md:text-4xl text-stone-900 leading-tight mb-6">{open.title}</h1>
              <div className="gold-rule mb-7" />
              <div className="space-y-5">
                {open.body.split("\n").filter(Boolean).map((p, i) => (
                  <p
                    key={i}
                    className="text-stone-700 leading-[1.9] font-light"
                    dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.+?)\*\*/g, "<strong class='font-semibold text-stone-900'>$1</strong>") }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-9 pt-7 border-t border-stone-200">
                {open.keywords.map((k) => (
                  <span key={k} className="text-[11px] bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full">#{k}</span>
                ))}
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
