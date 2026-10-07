import { useState } from "react";
import type { ContentStore, BotFaq } from "../../store";

const inp =
  "w-full border border-stone-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 bg-white transition-all";

const blank = (): BotFaq => ({
  id: `f${Date.now()}`,
  keywords: "",
  answer: "",
  chips: "",
  enabled: true,
});

const EXAMPLES = [
  { k: "swimming costume, swim wear, costume", a: "Swimming costumes are required in the pool. A small shop near reception stocks basics if you forget yours." },
  { k: "extra bed, mattress, additional bed", a: "Extra mattresses are available at a nominal charge. Just mention it at the time of booking." },
  { k: "holi, diwali, festival booking", a: "We run special festival packages for Holi and Diwali. Dates fill up fast — enquire at least a month ahead." },
];

export default function BotTab({ store }: { store: ContentStore }) {
  const [draft, setDraft] = useState<BotFaq | null>(null);

  return (
    <div className="max-w-3xl">
      {draft ? (
        <div className="space-y-5">
          <h3 className="font-serif text-2xl text-stone-900">
            {store.faqs.some((f) => f.id === draft.id) ? "Edit Answer" : "Teach the AI Something New"}
          </h3>

          <label className="block">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">
              Trigger Words (comma separated)
            </span>
            <input
              value={draft.keywords}
              onChange={(e) => setDraft({ ...draft, keywords: e.target.value })}
              placeholder="e.g. horse, ghodi, baggi, baraat horse"
              className={inp}
            />
            <span className="block text-[11px] text-stone-400 mt-1.5">
              When a guest's question contains any of these, the AI replies with your answer.
              Multi-word phrases match more strongly.
            </span>
          </label>

          <label className="block">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">Answer</span>
            <textarea
              rows={6}
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              placeholder="Write the reply exactly as you'd like the AI to say it. Use **bold** for emphasis."
              className={inp}
            />
            <span className="block text-[11px] text-stone-400 mt-1.5">
              Tip: wrap text in **double stars** to make it bold. Press Enter for a new line.
            </span>
          </label>

          <label className="block">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">
              Quick-Reply Buttons (optional, comma separated)
            </span>
            <input
              value={draft.chips}
              onChange={(e) => setDraft({ ...draft, chips: e.target.value })}
              placeholder="Book now, 📲 WhatsApp us, See gallery"
              className={inp}
            />
          </label>

          <label className="flex items-center gap-2.5 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
              className="w-4 h-4 accent-emerald-800"
            />
            Active (AI will use this answer)
          </label>

          {draft.answer && (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
              <div className="text-[10px] tracking-[0.3em] uppercase text-stone-400 mb-3">Preview</div>
              <div className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-200 to-gold-500 flex items-center justify-center font-serif text-sm text-emerald-950 shrink-0">V</div>
                <div
                  className="bg-white border border-stone-200 rounded-2xl rounded-bl-md px-4 py-3 text-[13.5px] text-stone-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: draft.answer.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>"),
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { store.saveFaq(draft); setDraft(null); }}
              disabled={!draft.keywords.trim() || !draft.answer.trim()}
              className="bg-emerald-900 hover:bg-emerald-800 disabled:opacity-40 text-white font-semibold px-8 py-3 rounded-full text-sm"
            >
              Save Answer
            </button>
            <button onClick={() => setDraft(null)} className="px-7 py-3 rounded-full border border-stone-300 text-stone-600 text-sm">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 text-[12.5px] rounded-xl px-4 py-3 flex-1">
              💡 The AI already knows about rooms, weddings, pricing, pool, food, decor, music,
              transport, rituals and 25+ other topics. Add your own answers here for anything
              specific to your resort.
            </div>
            <button onClick={() => setDraft(blank())} className="bg-emerald-900 hover:bg-emerald-800 text-white font-semibold px-6 py-3 rounded-full text-sm shrink-0">
              + New Answer
            </button>
          </div>

          {!store.faqs.length ? (
            <div className="text-center py-14 text-stone-400 border border-dashed border-stone-300 rounded-2xl">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-sm mb-6">No custom answers yet — try one of these starters:</p>
              <div className="flex flex-col gap-2 max-w-md mx-auto">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.k}
                    onClick={() => setDraft({ ...blank(), keywords: ex.k, answer: ex.a })}
                    className="text-left text-[12.5px] px-4 py-3 rounded-xl border border-stone-200 hover:border-emerald-700 hover:bg-emerald-50/50 text-stone-600 transition-all"
                  >
                    <span className="text-emerald-800 font-medium">+ {ex.k.split(",")[0]}</span>
                    <span className="block text-[11.5px] text-stone-400 mt-0.5 truncate">{ex.a}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {store.faqs.map((f) => (
                <div key={f.id} className={`border rounded-2xl p-5 ${f.enabled ? "border-stone-200 bg-white" : "border-stone-200 bg-stone-50 opacity-60"}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {f.keywords.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 5).map((k) => (
                          <span key={k} className="text-[10px] bg-gold-50 text-gold-600 px-2 py-0.5 rounded-full">{k}</span>
                        ))}
                      </div>
                      <p className="text-[12.5px] text-stone-600 line-clamp-2">{f.answer}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => store.saveFaq({ ...f, enabled: !f.enabled })}
                        className={`text-[12px] px-4 py-1.5 rounded-full ${f.enabled ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"}`}
                      >
                        {f.enabled ? "Active" : "Paused"}
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => setDraft(f)} className="text-[12px] px-3 py-1.5 rounded-full border border-stone-300 text-stone-600 hover:border-emerald-700">Edit</button>
                        <button onClick={() => store.deleteFaq(f.id)} className="text-[12px] px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
