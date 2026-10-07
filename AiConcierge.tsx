import { useState, useRef, useEffect } from "react";
import { respond, renderRich, emptyBooking, SUGGESTIONS, type BookingState, type Lead } from "../agent/engine";
import { getSettings, telHref } from "../settings";
import { sendToWhatsApp, whatsappLink, whatsappChat } from "../whatsapp";

type Msg = {
  id: number;
  role: "user" | "bot";
  text: string;
  chips?: string[];
  time: string;
  /** renders a prominent WhatsApp hand-off button */
  wa?: Lead;
};

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/** Remembers that the visitor has already seen the one-time nudge. */
const NUDGE_KEY = "vvr.chat.nudged";

const WELCOME: Msg = {
  id: 0,
  role: "bot",
  time: now(),
  text:
    "Namaste! 🙏 I'm **Vrinda**, your AI concierge at Vrinda Valley Resort.\n\nAsk me anything about rooms, weddings, the banquet hall, pool parties, dining or directions — I'll answer instantly.\n\nReady to book? I'll collect your details and send them **straight to our team on WhatsApp**. 📲",
  chips: ["Room options", "Wedding venue", "Pricing", "I want to book"],
};

export default function AiConcierge({
  onOpenBooking,
  onLead,
  custom = [],
}: {
  onOpenBooking: () => void;
  onLead?: (lead: Lead) => void;
  custom?: { id: string; keywords: string; answer: string; chips: string; enabled: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [booking, setBooking] = useState<BookingState>(emptyBooking());
  // the greeting badge + nudge are one-time only, remembered across visits
  const [unread, setUnread] = useState(() => localStorage.getItem(NUDGE_KEY) !== "1");
  const [nudge, setNudge] = useState(false);
  /** Once true the nudge can never appear again for this visitor. */
  const nudgeSpent = useRef(localStorage.getItem(NUDGE_KEY) === "1");

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(1);

  const retireNudge = () => {
    nudgeSpent.current = true;
    setNudge(false);
    setUnread(false);
    try {
      localStorage.setItem(NUDGE_KEY, "1");
    } catch {
      /* private mode — in-memory ref still prevents repeats */
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing]);

  useEffect(() => {
    if (!open) return;
    retireNudge();
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [open]);

  // One gentle nudge, 9s after load. Never shown again — not after closing
  // the chat, not on the next page visit.
  useEffect(() => {
    if (nudgeSpent.current) return;

    const show = setTimeout(() => {
      if (nudgeSpent.current) return;
      setNudge(true);
      // auto-dismiss so it never lingers on screen
      setTimeout(retireNudge, 9000);
    }, 9000);

    return () => clearTimeout(show);
    // deliberately runs once — must not restart when the chat is closed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;

    const userMsg: Msg = { id: idRef.current++, role: "user", text, time: now() };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    // human-like variable delay based on answer length
    const { reply, booking: nextBooking } = respond(text, booking, custom);
    const delay = Math.min(1500, 450 + reply.text.length * 3.2);

    setTimeout(() => {
      setBooking(nextBooking);
      setMsgs((m) => [
        ...m,
        {
          id: idRef.current++,
          role: "bot",
          text: reply.text,
          chips: reply.chips,
          time: now(),
          wa: reply.action === "whatsapp" ? reply.lead : undefined,
        },
      ]);
      setTyping(false);

      // log the enquiry + auto-open WhatsApp
      if (reply.action === "whatsapp" && reply.lead) {
        onLead?.(reply.lead);
        setTimeout(() => sendToWhatsApp(reply.lead!), 700);
      }
    }, delay);
  };

  const handleChip = (chip: string) => {
    if (chip === "Open full form") {
      onOpenBooking();
      return;
    }
    if (chip.includes("WhatsApp")) {
      window.open(whatsappChat(), "_blank", "noopener,noreferrer");
      return;
    }
    if (chip.includes("Call")) {
      window.location.href = telHref(getSettings().phone);
      return;
    }
    if (chip === "Open map") {
      document.getElementById("location")?.scrollIntoView({ behavior: "smooth" });
      setOpen(false);
      return;
    }
    if (chip === "See reviews" || chip === "Share my review") {
      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
      setOpen(false);
      return;
    }
    if (chip === "See gallery") {
      document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
      setOpen(false);
      return;
    }
    send(chip);
  };

  const reset = () => {
    setMsgs([{ ...WELCOME, id: idRef.current++, time: now() }]);
    setBooking(emptyBooking());
  };

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-[5.5rem] md:bottom-6 right-4 md:right-6 z-[90] flex flex-col items-end gap-3">
        {nudge && !open && (
          <div className="relative bg-white rounded-2xl rounded-br-sm shadow-2xl pl-4 pr-8 py-3 max-w-[230px] text-sm text-stone-700 border border-stone-100 animate-[fadeUp_.4s_ease]">
            <button
              onClick={retireNudge}
              aria-label="Dismiss"
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center text-xs leading-none transition-colors"
            >
              ✕
            </button>
            <button onClick={() => setOpen(true)} className="text-left">
              <span className="font-medium text-emerald-900">Need help?</span> Ask me about rooms or
              weddings — I reply instantly ✨
            </button>
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative group w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 shadow-[0_8px_30px_rgba(217,169,59,.5)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
          aria-label="AI Concierge"
        >
          {/* attention ring stops for good once the visitor has engaged */}
          {unread && !open && (
            <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping-slow" />
          )}
          <span className="relative text-2xl">{open ? "✕" : "💬"}</span>
          {unread && !open && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-600 border-2 border-white text-[10px] text-white flex items-center justify-center font-bold">
              1
            </span>
          )}
        </button>
      </div>

      {/* Panel */}
      <div
        className={`fixed z-[95] transition-all duration-400 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-6 pointer-events-none"
        } bottom-[9.5rem] md:bottom-28 right-4 md:right-6 w-[calc(100vw-2rem)] sm:w-[400px] h-[min(70svh,560px)] md:h-[clamp(420px,70vh,620px)]`}
      >
        <div className="flex flex-col h-full bg-white rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,.45)] overflow-hidden border border-stone-200/70">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 px-5 py-4 text-white shrink-0">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_0%,#d4af37_0%,transparent_55%)]" />
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 flex items-center justify-center font-serif text-xl text-emerald-950 font-semibold">
                  V
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-emerald-900" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-serif text-lg leading-tight flex items-center gap-2">
                  Vrinda
                  <span className="text-[9px] tracking-widest uppercase bg-amber-400/90 text-emerald-950 px-1.5 py-0.5 rounded font-sans font-bold">
                    AI
                  </span>
                </div>
                <div className="text-[11px] text-emerald-200/90">
                  {typing ? "typing…" : "Online · replies instantly"}
                </div>
              </div>
              <button
                onClick={reset}
                title="Restart chat"
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-sm transition-colors"
              >
                ↻
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gradient-to-b from-stone-50 to-white chat-scroll">
            {msgs.map((m) => (
              <div key={m.id} className="animate-[fadeUp_.35s_ease]">
                <div className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 flex items-center justify-center font-serif text-sm text-emerald-950 shrink-0 mt-0.5">
                      V
                    </div>
                  )}
                  <div className={`max-w-[80%] ${m.role === "user" ? "order-1" : ""}`}>
                    <div
                      className={`px-4 py-3 text-[13.5px] leading-relaxed ${
                        m.role === "user"
                          ? "bg-emerald-800 text-white rounded-2xl rounded-br-md"
                          : "bg-white text-stone-700 rounded-2xl rounded-bl-md border border-stone-200/80 shadow-sm"
                      }`}
                      dangerouslySetInnerHTML={{ __html: renderRich(m.text) }}
                    />
                    <div
                      className={`text-[10px] text-stone-400 mt-1 ${
                        m.role === "user" ? "text-right" : "pl-1"
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>

                {m.role === "bot" && m.wa && (
                  <div className="pl-10 mt-3">
                    <a
                      href={whatsappLink(m.wa)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1fb757] text-white px-5 py-3.5 rounded-2xl shadow-lg shadow-[#25D366]/30 transition-all hover:scale-[1.02] active:scale-95"
                    >
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.99 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                      <span className="text-left leading-tight">
                        <span className="block font-semibold text-sm">Send Enquiry on WhatsApp</span>
                        <span className="block text-[11px] text-white/85">
                          Opens with your details filled in
                        </span>
                      </span>
                    </a>
                  </div>
                )}

                {m.role === "bot" && m.chips && (
                  <div className="flex flex-wrap gap-2 mt-2 pl-10">
                    {m.chips.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleChip(c)}
                        className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${
                          c.includes("WhatsApp")
                            ? "border-[#25D366]/40 text-[#128C7E] bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white hover:border-[#25D366]"
                            : "border-emerald-700/30 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-800 hover:text-white hover:border-emerald-800"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="flex gap-2.5 animate-[fadeUp_.3s_ease]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 flex items-center justify-center font-serif text-sm text-emerald-950 shrink-0">
                  V
                </div>
                <div className="bg-white border border-stone-200/80 rounded-2xl rounded-bl-md px-4 py-3.5 shadow-sm flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-emerald-700/60 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s`, animationDuration: "1s" }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions (first turn only) */}
          {msgs.length === 1 && !typing && (
            <div className="px-4 pb-2 shrink-0">
              <div className="text-[10px] tracking-widest uppercase text-stone-400 mb-2">
                Popular questions
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 chat-scroll">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="whitespace-nowrap text-[12px] px-3 py-1.5 rounded-full bg-stone-100 hover:bg-emerald-800 hover:text-white text-stone-600 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="p-3 border-t border-stone-200 bg-white shrink-0">
            <div className="flex items-center gap-2 bg-stone-100 rounded-full pl-4 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-emerald-700/30 transition-all">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about rooms, weddings, pricing…"
                className="flex-1 bg-transparent outline-none text-sm text-stone-700 placeholder:text-stone-400 min-w-0"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || typing}
                className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center disabled:opacity-30 hover:bg-emerald-700 transition-all shrink-0"
              >
                ➤
              </button>
            </div>
            <div className="text-center text-[10px] text-stone-400 mt-2">
              Bookings go straight to{" "}
              <a href={whatsappChat()} target="_blank" rel="noopener noreferrer" className="text-[#128C7E] font-medium">
                WhatsApp
              </a>{" "}
              ·{" "}
              <a href={telHref(getSettings().phone)} className="text-emerald-700 font-medium">
                {getSettings().phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
