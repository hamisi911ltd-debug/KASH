/* ============================================================
   Sign-in flow: first pick which part of the business you're
   entering (Admin / Transport / Food / Hospitality), then sign in -
   demo auth, so any of the listed accounts + any non-empty password
   gets in. Picking a tile lands you straight in that division.
   ============================================================ */
import React, { useState } from "react";
import {
  Mail, Lock, Eye, EyeOff, Truck, Drumstick, BedDouble, ArrowRight,
  LayoutDashboard, ChevronLeft, ChevronRight,
} from "lucide-react";
import { C } from "../lib/constants";
import { DEMO_ACCOUNTS, findAccount, accountForRole } from "../lib/auth";
import { Button, Spinner } from "../components/ui.jsx";
import { KashLogo } from "../components/Logo.jsx";
import { useStore } from "../lib/store.jsx";

const BUSINESSES = [
  { key: "overview", label: "Admin", sub: "Whole business overview", icon: LayoutDashboard, color: C.blue, soft: C.blueSoft, role: "Super Admin" },
  { key: "transport", label: "Transport", sub: "Fleet, trips & drivers", icon: Truck, color: C.emerald, soft: C.emeraldSoft, role: "Transport Manager" },
  { key: "food", label: "Chicken", sub: "Orders & stock", icon: Drumstick, color: C.amber, soft: C.amberSoft, role: "Food Manager" },
  { key: "hospitality", label: "Hospitality", sub: "Rooms & bookings", icon: BedDouble, color: C.coral, soft: C.coralSoft, role: "Hospitality Manager" },
];

function Panel({ accent }) {
  const { data } = useStore();
  const stats = [
    { icon: Truck, label: "Transport", value: `${data.vehicles.filter((v) => v.status === "Active").length} vehicles active` },
    { icon: Drumstick, label: "Chicken", value: `${data.menu.filter((m) => m.active).length} products in stock` },
    { icon: BedDouble, label: "Hospitality", value: `${data.rooms.length} rooms managed` },
  ];
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-[44%] p-12 relative overflow-hidden border-r"
      style={{ background: `linear-gradient(160deg, ${C.surface}, ${C.surface2})`, borderColor: C.line }}
    >
      <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full transition-colors duration-500" style={{ background: `${accent}1f` }} />
      <div className="absolute -left-20 bottom-10 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(21,149,138,0.10), transparent 70%)" }} />
      <div className="relative">
        <KashLogo size={30} />
        <p className="mt-3 text-sm" style={{ color: C.muted }}>One Platform. Many Solutions.</p>
      </div>

      <div className="relative space-y-7">
        <div>
          <p className="text-[2rem] leading-tight font-bold font-display" style={{ color: C.ink }}>
            Track transport, food and hospitality from one platform.
          </p>
          <p className="mt-3 text-sm font-bold tracking-wide" style={{ color: C.blue }}>Manage &nbsp;·&nbsp; Track &nbsp;·&nbsp; Grow</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl p-4 border" style={{ background: C.surface, borderColor: C.line, boxShadow: C.shadowSm }}>
              <s.icon size={18} className="mb-2" style={{ color: C.blue }} />
              <p className="text-[11px]" style={{ color: C.muted }}>{s.label}</p>
              <p className="text-sm font-bold mt-0.5 leading-snug" style={{ color: C.ink }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs" style={{ color: C.faint }}>© {new Date().getFullYear()} {data.company.name}</p>
    </div>
  );
}

/* -------------------------------------------------------- choose a business */

function BusinessPicker({ onPick, onSkip }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold font-display" style={{ color: C.ink }}>Which part of the business?</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Pick one to sign in straight into it. You can switch anytime after.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {BUSINESSES.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => onPick(b)}
            className="group text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5"
            style={{ borderColor: C.line, background: C.surface, boxShadow: C.shadowSm }}
          >
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-colors" style={{ background: b.soft }}>
              <b.icon size={19} style={{ color: b.color }} />
            </div>
            <p className="font-bold text-sm" style={{ color: C.ink }}>{b.label}</p>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>{b.sub}</p>
            <span
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: b.color }}
            >
              Enter <ArrowRight size={12} />
            </span>
          </button>
        ))}
      </div>

      <button type="button" onClick={onSkip} className="text-xs font-semibold" style={{ color: C.muted }}>
        Just sign in manually instead
      </button>
    </div>
  );
}

/* -------------------------------------------------------- main view */

export default function LoginView({ onSignIn }) {
  const [step, setStep] = useState("choose"); // choose | auth
  const [chosen, setChosen] = useState(null); // the BUSINESSES entry, if any
  const [mode, setMode] = useState("signin"); // signin | register | reset
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState("kash");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const pickBusiness = (biz) => {
    setChosen(biz);
    const acct = accountForRole(biz.role);
    setEmail(acct.email);
    setPassword("kash");
    setError("");
    setMode("signin");
    setStep("auth");
  };

  const backToChoose = () => {
    setStep("choose");
    setChosen(null);
    setError("");
  };

  const submitSignIn = (e) => {
    e.preventDefault();
    setError("");
    const account = findAccount(email);
    if (!account) {
      setError("No account for that email. Try one of the demo accounts below.");
      return;
    }
    if (!password.trim()) {
      setError("Enter any password to continue.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSignIn({ email: account.email, name: account.name, role: account.role }, chosen?.key);
    }, 550);
  };

  const accent = chosen?.color || C.blue;

  return (
    <div className="min-h-screen w-full flex" style={{ background: C.bg }}>
      <Panel accent={accent} />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <KashLogo size={28} />
          </div>

          {step === "choose" ? (
            <BusinessPicker onPick={pickBusiness} onSkip={() => setStep("auth")} />
          ) : (
            <>
              <button
                type="button"
                onClick={backToChoose}
                className="mb-5 inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: C.muted }}
              >
                <ChevronLeft size={14} /> Choose a different business
              </button>

              <div className="flex rounded-xl p-1 mb-7" style={{ background: C.surface2 }}>
                {[
                  ["signin", "Sign in"],
                  ["register", "Create account"],
                ].map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => { setMode(key); setError(""); setDone(false); }}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={mode === key ? { background: C.surface, color: C.ink, boxShadow: C.shadowSm } : { color: C.muted }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === "signin" && (
                <form onSubmit={submitSignIn} className="space-y-4">
                  <div>
                    {chosen ? (
                      <div className="inline-flex items-center gap-2 mb-2 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: chosen.soft, color: chosen.color }}>
                        <chosen.icon size={13} /> {chosen.label}
                      </div>
                    ) : null}
                    <h1 className="text-2xl font-bold font-display" style={{ color: C.ink }}>Welcome back</h1>
                    <p className="text-sm mt-1" style={{ color: C.muted }}>
                      {chosen ? `Sign in to open ${chosen.label}.` : "Sign in to your operations workspace."}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Email</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm outline-none"
                        style={{ borderColor: C.line }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPw ? "text" : "password"}
                        required
                        className="w-full rounded-lg border pl-9 pr-9 py-2.5 text-sm outline-none"
                        style={{ borderColor: C.line }}
                      />
                      <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="text-xs font-medium rounded-lg px-3 py-2" style={{ background: C.coralSoft, color: C.coral }}>{error}</p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2" style={{ color: C.muted }}>
                      <input type="checkbox" defaultChecked /> Remember me
                    </label>
                    <button type="button" onClick={() => setMode("reset")} className="font-semibold" style={{ color: C.blue }}>
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading} style={chosen ? { background: chosen.color, color: "#fff" } : undefined}>
                    {loading ? <Spinner color="#fff" /> : null}
                    {loading ? "Signing in..." : chosen ? `Enter ${chosen.label}` : "Sign in"}
                    {!loading && <ArrowRight size={15} />}
                  </Button>

                  <div className="pt-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: C.faint }}>Demo accounts - click to fill</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {DEMO_ACCOUNTS.map((a) => (
                        <button
                          key={a.email}
                          type="button"
                          onClick={() => { setEmail(a.email); setPassword("kash"); setError(""); }}
                          className="text-left rounded-lg border px-2.5 py-1.5 transition-colors hover:opacity-80"
                          style={{ borderColor: email === a.email ? C.blue : C.line, background: email === a.email ? C.blueSoft : C.surface }}
                        >
                          <span className="block text-xs font-semibold truncate" style={{ color: C.ink }}>{a.role}</span>
                          <span className="block text-[10px] truncate" style={{ color: C.faint }}>{a.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {mode === "register" && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold font-display" style={{ color: C.ink }}>Create your account</h1>
                  {done ? (
                    <p className="rounded-lg p-4 text-sm" style={{ background: C.blueSoft, color: C.blue }}>
                      Request received. A Super Admin will review and approve your access shortly.
                    </p>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4">
                      {[
                        { label: "Full name", ph: "Jane Doe", type: "text" },
                        { label: "Work email", ph: "you@company.com", type: "email" },
                        { label: "Company", ph: "KASH Group Ltd", type: "text" },
                      ].map((f) => (
                        <div key={f.label}>
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>{f.label}</label>
                          <input required type={f.type} placeholder={f.ph} className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: C.line }} />
                        </div>
                      ))}
                      <Button type="submit" size="lg" className="w-full">Request access <ArrowRight size={15} /></Button>
                    </form>
                  )}
                </div>
              )}

              {mode === "reset" && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold font-display" style={{ color: C.ink }}>Reset password</h1>
                  {done ? (
                    <p className="rounded-lg p-4 text-sm" style={{ background: C.emeraldSoft, color: C.emerald }}>
                      If an account exists for that email, reset instructions are on the way.
                    </p>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="space-y-4">
                      <p className="text-sm" style={{ color: C.muted }}>Enter your email and we'll send reset instructions.</p>
                      <input type="email" required placeholder="you@company.com" className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none" style={{ borderColor: C.line }} />
                      <Button type="submit" size="lg" className="w-full">Send reset link</Button>
                    </form>
                  )}
                  <button type="button" onClick={() => { setMode("signin"); setDone(false); }} className="text-sm font-semibold" style={{ color: C.blue }}>
                    Back to sign in
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
