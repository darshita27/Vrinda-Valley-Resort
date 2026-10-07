import { useState } from "react";
import type { ContentStore } from "../../store";
import { downloadPack, readPackFile, packSize } from "../../publish";

export default function PublishTab({ store }: { store: ContentStore }) {
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");

  const pack = store.buildPack();
  const size = packSize(pack);
  const heavy = new Blob([JSON.stringify(pack)]).size > 4 * 1024 * 1024;

  const customPhotos = Object.keys(store.media).length;
  const lastPublished = store.published?.publishedAt
    ? new Date(store.published.publishedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="max-w-3xl space-y-7">
      {/* why */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="font-serif text-lg text-amber-900 mb-2">
          ⚠️ Why don't my changes show on other phones?
        </h3>
        <p className="text-[13px] text-amber-900/80 leading-relaxed">
          Everything you edit is saved <strong>inside this browser only</strong> — it never leaves
          your device. That's why a new photo looks perfect here but invisible on another phone.
          To make changes visible to <strong>everyone</strong>, you have to publish them once.
        </p>
      </div>

      {/* status */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          ["Custom Photos", String(customPhotos), "bg-stone-50 border-stone-200 text-stone-900"],
          ["Pack Size", size, heavy ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"],
          ["Last Published", lastPublished ? "✓ Live" : "Never", lastPublished ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"],
        ].map(([l, v, cls]) => (
          <div key={l} className={`rounded-2xl border p-5 ${cls}`}>
            <div className="font-serif text-2xl leading-none">{v}</div>
            <div className="text-[10px] tracking-[0.25em] uppercase mt-2 opacity-70">{l}</div>
          </div>
        ))}
      </div>

      {lastPublished && (
        <p className="text-[12px] text-stone-500 -mt-3">Currently live version: {lastPublished}</p>
      )}

      {heavy && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-[12.5px] rounded-xl px-4 py-3">
          ⚠️ This pack is large ({size}). Uploaded photos are stored inside the file, so loading
          may be slow. Consider using the <strong>🔗 URL</strong> option in the Photos tab instead
          of uploading very large images.
        </div>
      )}

      {/* steps */}
      <section>
        <h3 className="font-serif text-xl text-stone-900 mb-4">Publish in 3 steps</h3>
        <ol className="space-y-4">
          {[
            {
              n: 1,
              t: "Download your content file",
              d: "This bundles your photos, settings, reviews, stories and AI answers into one file called content.json.",
              action: (
                <button
                  onClick={() => downloadPack(pack)}
                  className="bg-emerald-900 hover:bg-emerald-800 text-white font-semibold px-6 py-2.5 rounded-full text-[13px]"
                >
                  ⬇ Download content.json
                </button>
              ),
            },
            {
              n: 2,
              t: "Put it in your project's public folder",
              d: "Place the file at public/content.json in your React project — replacing the old one if it exists.",
              action: (
                <code className="block bg-stone-900 text-gold-200 text-[12px] rounded-xl px-4 py-3 font-mono overflow-x-auto">
                  your-project/public/content.json
                </code>
              ),
            },
            {
              n: 3,
              t: "Commit and push",
              d: "Once deployed, every visitor on every device sees your updated photos and content.",
              action: (
                <div className="relative">
                  <code className="block bg-stone-900 text-gold-200 text-[12px] rounded-xl px-4 py-3 font-mono whitespace-pre overflow-x-auto">
                    {`git add public/content.json\ngit commit -m "Update website content"\ngit push`}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'git add public/content.json\ngit commit -m "Update website content"\ngit push'
                      );
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="absolute top-2 right-2 text-[11px] px-3 py-1.5 rounded-full bg-white/10 text-white hover:bg-white/20"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              ),
            },
          ].map((s) => (
            <li key={s.n} className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-emerald-900 text-gold-200 font-serif flex items-center justify-center shrink-0 text-sm">
                {s.n}
              </span>
              <div className="flex-1 min-w-0 space-y-2.5 pb-2">
                <div>
                  <div className="font-medium text-stone-900 text-[14px]">{s.t}</div>
                  <p className="text-[12.5px] text-stone-500 leading-relaxed mt-0.5">{s.d}</p>
                </div>
                {s.action}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* import / revert */}
      <section className="pt-6 border-t border-stone-200 space-y-4">
        <h3 className="font-serif text-xl text-stone-900">Other devices &amp; backups</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="border border-stone-200 rounded-2xl p-5">
            <div className="font-medium text-stone-900 text-[13.5px] mb-1.5">Load a content file</div>
            <p className="text-[12px] text-stone-500 mb-4 leading-relaxed">
              Editing from a different phone or laptop? Import your content.json to continue where
              you left off.
            </p>
            <label className="inline-block text-[12.5px] px-5 py-2.5 rounded-full border border-emerald-800 text-emerald-800 hover:bg-emerald-800 hover:text-white cursor-pointer transition-all">
              ⬆ Import content.json
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    store.applyPack(await readPackFile(f));
                    setMsg("✓ Content imported successfully.");
                  } catch {
                    setMsg("✗ That file could not be read. Please pick a valid content.json.");
                  }
                  setTimeout(() => setMsg(""), 4000);
                }}
              />
            </label>
          </div>

          <div className="border border-stone-200 rounded-2xl p-5">
            <div className="font-medium text-stone-900 text-[13.5px] mb-1.5">Discard local edits</div>
            <p className="text-[12px] text-stone-500 mb-4 leading-relaxed">
              Reset this device back to whatever is currently live on the website.
            </p>
            <button
              disabled={!store.published}
              onClick={() =>
                confirm("Discard all unpublished changes on this device?") && store.revertToPublished()
              }
              className="text-[12.5px] px-5 py-2.5 rounded-full border border-stone-300 text-stone-600 hover:border-red-400 hover:text-red-600 disabled:opacity-40 transition-all"
            >
              ↺ Revert to live version
            </button>
          </div>
        </div>

        {msg && <p className="text-[13px] text-emerald-800">{msg}</p>}
      </section>

      {/* upgrade note */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
        <h4 className="font-medium text-stone-900 text-[13.5px] mb-1.5">
          Want changes to go live instantly, without Git?
        </h4>
        <p className="text-[12.5px] text-stone-500 leading-relaxed">
          That needs a database (Supabase or Firebase — both have free plans). With one connected,
          you'd upload a photo here and it would appear on every phone within seconds, no publishing
          step at all. Ask your developer to wire it up when you're ready.
        </p>
      </div>
    </div>
  );
}
