import { useState } from "react";
import type { ContentStore } from "../../store";
import { fileToDataUrl } from "../../store";

const inp =
  "w-full border border-stone-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 bg-white transition-all";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-stone-400 mt-1.5">{hint}</span>}
    </label>
  );
}

export default function SettingsTab({ store }: { store: ContentStore }) {
  const s = store.settings;
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const up = (k: keyof typeof s) => (e: React.ChangeEvent<HTMLInputElement>) => {
    store.setSettings({ [k]: e.target.value } as never);
    flash();
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 text-[12.5px] rounded-xl px-4 py-3">
        💡 Changes save automatically and update the whole website — header, footer, contact
        section, WhatsApp links, AI concierge answers and Google data.
      </div>

      {/* Logo */}
      <section>
        <h3 className="font-serif text-xl text-stone-900 mb-4">Resort Logo</h3>
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden shrink-0">
            <img src={store.img("brand.logo")} alt="logo" className="w-full h-full object-contain p-2" />
          </div>
          <div className="space-y-2">
            <label className="inline-block text-[12.5px] px-5 py-2.5 rounded-full bg-emerald-800 text-white hover:bg-emerald-700 cursor-pointer">
              {busy ? "⏳ Processing…" : "⬆ Upload New Logo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setBusy(true);
                  try {
                    store.setMediaOverride("brand.logo", await fileToDataUrl(f, 400));
                    flash();
                  } catch { /* ignore */ }
                  setBusy(false);
                }}
              />
            </label>
            {store.media["brand.logo"] && (
              <button
                onClick={() => store.clearMediaOverride("brand.logo")}
                className="block text-[12px] text-stone-500 underline"
              >
                Restore original logo
              </button>
            )}
            <p className="text-[11px] text-stone-400">Transparent PNG, square, 400×400px recommended.</p>
          </div>
        </div>
      </section>

      {/* Identity */}
      <section className="space-y-4">
        <h3 className="font-serif text-xl text-stone-900">Resort Identity</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Resort Name"><input value={s.resortName} onChange={up("resortName")} className={inp} /></Field>
          <Field label="Tagline"><input value={s.tagline} onChange={up("tagline")} className={inp} /></Field>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h3 className="font-serif text-xl text-stone-900">Contact Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Primary Phone"><input value={s.phone} onChange={up("phone")} className={inp} /></Field>
          <Field label="Alternate Phone"><input value={s.phoneAlt} onChange={up("phoneAlt")} className={inp} /></Field>
        </div>
        <Field label="WhatsApp Number" hint="All bookings and enquiries are sent to this number.">
          <input value={s.whatsapp} onChange={up("whatsapp")} className={inp} />
        </Field>
        <Field label="Email"><input value={s.email} onChange={up("email")} className={inp} /></Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Check-in Time"><input value={s.checkIn} onChange={up("checkIn")} className={inp} /></Field>
          <Field label="Check-out Time"><input value={s.checkOut} onChange={up("checkOut")} className={inp} /></Field>
        </div>
        <Field label="Reception Hours"><input value={s.hours} onChange={up("hours")} className={inp} /></Field>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <h3 className="font-serif text-xl text-stone-900">Address & Map</h3>
        <Field label="Full Address">
          <textarea
            rows={3}
            value={s.address}
            onChange={(e) => { store.setSettings({ address: e.target.value }); flash(); }}
            className={inp}
          />
        </Field>
        <Field label="Short Address" hint="Used in the footer where space is tight.">
          <input value={s.addressShort} onChange={up("addressShort")} className={inp} />
        </Field>
        <Field label="Google Maps Search Query" hint="What the embedded map searches for.">
          <input value={s.mapQuery} onChange={up("mapQuery")} className={inp} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Latitude">
            <input
              type="number" step="0.0001" value={s.lat}
              onChange={(e) => { store.setSettings({ lat: Number(e.target.value) }); flash(); }}
              className={inp}
            />
          </Field>
          <Field label="Longitude">
            <input
              type="number" step="0.0001" value={s.lng}
              onChange={(e) => { store.setSettings({ lng: Number(e.target.value) }); flash(); }}
              className={inp}
            />
          </Field>
        </div>
      </section>

      {/* Social */}
      <section className="space-y-4">
        <h3 className="font-serif text-xl text-stone-900">Social Media</h3>
        <Field label="Instagram Handle" hint="Without the @ — e.g. vrindavalleyresort">
          <input value={s.instagram} onChange={up("instagram")} className={inp} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Facebook URL" hint="Leave empty to hide">
            <input value={s.facebook} onChange={up("facebook")} className={inp} placeholder="https://facebook.com/…" />
          </Field>
          <Field label="YouTube URL" hint="Leave empty to hide">
            <input value={s.youtube} onChange={up("youtube")} className={inp} placeholder="https://youtube.com/@…" />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-4 pt-2 border-t border-stone-200">
        {saved && <span className="text-emerald-700 text-sm">✓ Saved &amp; applied live</span>}
        <button
          onClick={() => confirm("Reset all settings to defaults?") && store.resetSettings()}
          className="ml-auto text-[12px] px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
