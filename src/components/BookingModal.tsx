import { useState } from "react";
import { CONTACT } from "../data";
import { sendToWhatsApp, whatsappLink, type Lead } from "../whatsapp";

export default function BookingModal({
  open,
  onClose,
  store,
}: {
  open: boolean;
  onClose: () => void;
  store: { addBooking: (b: Required<Pick<Lead, "name" | "contact" | "purpose" | "dates" | "guests" | "source">> & { message?: string }) => unknown };
}) {
  const [sent, setSent] = useState<Lead | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    checkIn: "",
    checkOut: "",
    guests: "2 Guests",
    purpose: "Leisure Stay",
    message: "",
  });

  if (!open) return null;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead: Lead = {
      name: form.name,
      contact: [form.phone, form.email].filter(Boolean).join(" · "),
      purpose: form.purpose,
      dates: form.checkIn && form.checkOut ? `${form.checkIn} → ${form.checkOut}` : form.checkIn || "Not specified",
      guests: form.guests,
      message: form.message,
      source: "Website booking form",
    };
    store.addBooking({
      name: lead.name!,
      contact: lead.contact!,
      purpose: lead.purpose!,
      dates: lead.dates!,
      guests: lead.guests!,
      message: lead.message,
      source: lead.source!,
    });
    setSent(lead);
    sendToWhatsApp(lead);
  };

  const close = () => {
    setSent(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-y-auto chat-scroll"
      onClick={close}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-950 text-white px-7 py-5 flex items-center justify-between relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(212,175,55,.2),transparent_60%)]" />
          <div className="relative">
            <h3 className="font-serif text-2xl">Book Your Stay</h3>
            <p className="text-gold-200/80 text-[10px] tracking-[0.25em] uppercase mt-1">
              Vrinda Valley Resort · Jaipur
            </p>
          </div>
          <button onClick={close} className="relative text-white/70 hover:text-white text-2xl leading-none">
            ✕
          </button>
        </div>

        {sent ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-[#25D366] mx-auto mb-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-9 h-9 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.99 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <h4 className="font-serif text-2xl text-stone-900 mb-2">Opening WhatsApp…</h4>
            <p className="text-stone-600 text-sm mb-7 leading-relaxed">
              Your enquiry is ready in WhatsApp — just tap <strong>Send</strong> and our team will
              reply with availability and the best offer.
            </p>
            <a
              href={whatsappLink(sent)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#25D366] hover:bg-[#1fb757] text-white font-semibold py-3.5 rounded-full transition-all mb-3"
            >
              Didn't open? Tap here
            </a>
            <div className="flex gap-3">
              <a
                href={`tel:${CONTACT.phoneRaw}`}
                className="flex-1 border border-stone-300 text-stone-700 py-3 rounded-full text-sm hover:bg-stone-50"
              >
                📞 Call Instead
              </a>
              <button onClick={close} className="flex-1 border border-stone-300 text-stone-700 py-3 rounded-full text-sm hover:bg-stone-50">
                Close
              </button>
            </div>
          </div>
        ) : (
          <form className="p-7 space-y-4" onSubmit={submit}>
            <div className="flex items-center gap-2.5 bg-[#25D366]/10 border border-[#25D366]/25 rounded-xl px-4 py-3 text-[12.5px] text-[#0f6b52]">
              <span className="text-base">📲</span>
              Your enquiry goes directly to our team on WhatsApp for the fastest reply.
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name">
                <input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Your name" />
              </Field>
              <Field label="Phone">
                <input required type="tel" value={form.phone} onChange={set("phone")} className={inputCls} placeholder="+91 ..." />
              </Field>
            </div>
            <Field label="Email (optional)">
              <input type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="you@email.com" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Check In">
                <input required type="date" value={form.checkIn} onChange={set("checkIn")} className={inputCls} />
              </Field>
              <Field label="Check Out">
                <input type="date" value={form.checkOut} onChange={set("checkOut")} className={inputCls} />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Guests">
                <select value={form.guests} onChange={set("guests")} className={inputCls}>
                  <option>1 Guest</option>
                  <option>2 Guests</option>
                  <option>3–4 Guests</option>
                  <option>5–20 Guests</option>
                  <option>50+ Guests</option>
                  <option>200+ Guests</option>
                  <option>500+ Guests</option>
                </select>
              </Field>
              <Field label="Purpose">
                <select value={form.purpose} onChange={set("purpose")} className={inputCls}>
                  <option>Leisure Stay</option>
                  <option>Wedding / Reception</option>
                  <option>Engagement</option>
                  <option>Corporate Event</option>
                  <option>Pool Party</option>
                  <option>Birthday / Anniversary</option>
                  <option>Pre-Wedding Shoot</option>
                </select>
              </Field>
            </div>
            <Field label="Message (optional)">
              <textarea rows={2} value={form.message} onChange={set("message")} className={inputCls} placeholder="Any special requirements..." />
            </Field>

            <button className="w-full bg-[#25D366] hover:bg-[#1fb757] text-white font-semibold py-4 rounded-full transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/25">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.99 2.898 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Send Enquiry on WhatsApp
            </button>
            <p className="text-center text-[11px] text-stone-400">
              Or call {CONTACT.phone}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-stone-300 rounded-xl px-3.5 py-3 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 bg-white transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
