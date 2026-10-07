import { useState } from "react";
import type { ContentStore } from "../../store";

const inp =
  "w-full border border-stone-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 bg-white transition-all";

type Mode = "login" | "otp" | "reset";

export default function Login({ store }: { store: ContentStore }) {
  const [mode, setMode] = useState<Mode>("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [code, setCode] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const masked = store.settings.whatsapp.replace(/\d(?=\d{4})/g, "•");

  return (
    <div className="p-9 sm:p-10 max-w-sm mx-auto">
      <div className="text-center mb-7">
        <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-200 mx-auto mb-4 flex items-center justify-center overflow-hidden">
          <img src={store.img("brand.logo")} alt="" className="w-full h-full object-contain p-1.5" />
        </div>
        <h2 className="font-serif text-2xl text-stone-900">
          {mode === "login" ? "Admin Login" : mode === "otp" ? "Verify OTP" : "Set New Password"}
        </h2>
        <p className="text-stone-500 text-[13px] mt-1">
          {mode === "login"
            ? "Manage bookings, photos, content & settings"
            : mode === "otp"
            ? `Code sent to WhatsApp ${masked}`
            : "Choose a strong new password"}
        </p>
      </div>

      {/* ---- login ---- */}
      {mode === "login" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (store.login(user, pass)) setErr("");
            else setErr("Incorrect number or password. Please try again.");
          }}
        >
          <label className="block">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">Contact Number</span>
            <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="9530429585" className={inp} inputMode="numeric" />
          </label>
          <label className="block">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">Password</span>
            <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" className={inp} />
          </label>
          {err && <p className="text-red-600 text-[12.5px]">{err}</p>}
          <button className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-semibold py-3.5 rounded-full text-sm transition-all">
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              store.requestOtp();
              setInfo("WhatsApp opened with your OTP. Send the message to yourself, then enter the code below.");
              setMode("otp");
              setErr("");
            }}
            className="w-full text-[12.5px] text-emerald-800 hover:underline py-1"
          >
            Forgot password? Get OTP on WhatsApp
          </button>
        </form>
      )}

      {/* ---- otp ---- */}
      {mode === "otp" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (store.verifyOtp(code)) { setErr(""); setMode("reset"); }
            else setErr("Invalid OTP. Please check the code and try again.");
          }}
        >
          {info && <p className="text-[12px] text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">{info}</p>}
          <label className="block">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">6-Digit OTP</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              className={`${inp} text-center text-xl tracking-[0.5em] font-mono`}
            />
          </label>
          {err && <p className="text-red-600 text-[12.5px]">{err}</p>}
          <button className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-semibold py-3.5 rounded-full text-sm">
            Verify OTP
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={() => store.requestOtp()} className="flex-1 text-[12.5px] text-emerald-800 hover:underline py-1">
              Resend OTP
            </button>
            <button type="button" onClick={() => { setMode("login"); setErr(""); }} className="flex-1 text-[12.5px] text-stone-500 hover:underline py-1">
              Back to login
            </button>
          </div>
        </form>
      )}

      {/* ---- reset ---- */}
      {mode === "reset" && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (p1.length < 6) return setErr("Password must be at least 6 characters.");
            if (p1 !== p2) return setErr("Passwords do not match.");
            store.resetPassword(p1);
            setErr("");
            setMode("login");
            setInfo("");
            setPass("");
            alert("Password updated successfully. Please sign in with your new password.");
          }}
        >
          <label className="block">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">New Password</span>
            <input type="password" value={p1} onChange={(e) => setP1(e.target.value)} className={inp} />
          </label>
          <label className="block">
            <span className="block text-[10px] tracking-[0.3em] uppercase text-gold-500 mb-2">Confirm Password</span>
            <input type="password" value={p2} onChange={(e) => setP2(e.target.value)} className={inp} />
          </label>
          {err && <p className="text-red-600 text-[12.5px]">{err}</p>}
          <button className="w-full bg-emerald-900 hover:bg-emerald-800 text-white font-semibold py-3.5 rounded-full text-sm">
            Update Password
          </button>
        </form>
      )}

      {mode === "login" && (
        <div className="mt-6 text-center text-[11.5px] text-stone-400 bg-stone-50 rounded-xl p-3 border border-stone-200">
          Default login — <strong>{store.cred.user}</strong> / <strong>Vrinda@1234</strong>
        </div>
      )}
    </div>
  );
}
