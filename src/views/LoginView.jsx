/* ============================================================
   Sign-in flow: first pick which part of the business you're
   entering (Admin / Transport / Agro / Hospitality), then sign in -
   real accounts now, backed by the KASH API. Picking a tile lands
   you straight in that division once you're in.
   ============================================================ */
import React, { useState } from "react";
import {
  Mail, Lock, Eye, EyeOff, Truck, Beef, BedDouble, ArrowRight,
  LayoutDashboard, ChevronLeft, User, Phone,
} from "lucide-react";
import { C } from "../lib/constants";
import { DEMO_MODE, DEMO_LOGINS, DEMO_PASSWORD, login, register } from "../lib/auth";
import { passwordProblem, MIN_AGE } from "../lib/policy";
import { Button, Spinner } from "../components/ui.jsx";
import { KashLogo } from "../components/Logo.jsx";
import { Turnstile, TURNSTILE_SITEKEY } from "../components/Turnstile.jsx";

const BUSINESSES = [
  { key: "overview", label: "Admin", sub: "Whole business overview", icon: LayoutDashboard, color: C.blue, soft: C.blueSoft, role: "Super Admin" },
  { key: "transport", label: "Transport", sub: "Fleet, trips & drivers", icon: Truck, color: C.emerald, soft: C.emeraldSoft, role: "Transport Manager" },
  { key: "food", label: "Agro", sub: "Chicken, eggs, goat & meat", icon: Beef, color: C.amber, soft: C.amberSoft, role: "Agro Manager" },
  { key: "hospitality", label: "Hospitality", sub: "Rooms & bookings", icon: BedDouble, color: C.coral, soft: C.coralSoft, role: "Hospitality Manager" },
];

const VALUE_PROPS = [
  { icon: Truck, label: "Transport", value: "Fleet, drivers & trips" },
  { icon: Beef, label: "Agro", value: "Chicken, eggs, goat & meat" },
  { icon: BedDouble, label: "Hospitality", value: "Rooms & bookings" },
];

function Panel({ accent }) {
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
          {VALUE_PROPS.map((s) => (
            <div key={s.label} className="rounded-xl p-4 border" style={{ background: C.surface, borderColor: C.line, boxShadow: C.shadowSm }}>
              <s.icon size={18} className="mb-2" style={{ color: C.blue }} />
              <p className="text-[11px]" style={{ color: C.muted }}>{s.label}</p>
              <p className="text-sm font-bold mt-0.5 leading-snug" style={{ color: C.ink }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="relative text-xs" style={{ color: C.faint }}>© {new Date().getFullYear()} KASH Group Ltd</p>
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

/* -------------------------------------------------------- field helper */

function TextField({ label, icon: Icon, error, right, ...props }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />}
        <input
          {...props}
          className="w-full rounded-lg border py-2.5 text-sm outline-none"
          style={{ borderColor: error ? C.coral : C.line, paddingLeft: Icon ? 36 : 12, paddingRight: right ? 36 : 12 }}
        />
        {right}
      </div>
      {error && <p className="text-xs mt-1 font-medium" style={{ color: C.coral }}>{error}</p>}
    </div>
  );
}

/* -------------------------------------------------------- main view */

export default function LoginView({ onSignIn }) {
  const [step, setStep] = useState("choose"); // choose | auth
  const [chosen, setChosen] = useState(null); // the BUSINESSES entry, if any
  const [mode, setMode] = useState("signin"); // signin | register | reset
  const [email, setEmail] = useState(DEMO_MODE ? DEMO_LOGINS[0].email : "");
  const [password, setPassword] = useState(DEMO_MODE ? DEMO_PASSWORD : "");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // register mode
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regAccepted, setRegAccepted] = useState(false);
  const [regErrors, setRegErrors] = useState({});

  // Human check: a token proves it, works once, and is renewed after each submit.
  const [humanToken, setHumanToken] = useState("");
  const [humanReset, setHumanReset] = useState(0);
  const waitingForHuman = !!TURNSTILE_SITEKEY && !humanToken;

  const pickBusiness = (biz) => {
    setChosen(biz);
    if (DEMO_MODE) {
      const acct = DEMO_LOGINS.find((a) => a.role === biz.role) || DEMO_LOGINS[0];
      setEmail(acct.email);
      setPassword(DEMO_PASSWORD);
    }
    setError("");
    setMode("signin");
    setStep("auth");
  };

  const backToChoose = () => {
    setStep("choose");
    setChosen(null);
    setError("");
  };

  const submitSignIn = async (e) => {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Enter your password to continue.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(email, password, humanToken);
      onSignIn({ token: res.token, ...res.user }, chosen?.key);
    } catch (err) {
      setError(err.message || "Could not sign in. Try again.");
    } finally {
      setLoading(false);
      setHumanReset((n) => n + 1);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!regName.trim()) errs.name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errs.email = "Enter a valid email.";
    if (!regPhone.trim()) errs.phone = "Enter a contact number.";
    const weak = passwordProblem(regPassword, regEmail);
    if (weak) errs.password = weak;
    if (regConfirm !== regPassword) errs.confirm = "Passwords don't match.";
    if (!regAccepted) errs.accepted = `Please confirm you are ${MIN_AGE}+ and accept the Terms and Privacy Policy.`;
    setRegErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setError("");
    try {
      const res = await register(regName.trim(), regEmail.trim(), regPhone.trim(), regPassword, regAccepted, humanToken);
      onSignIn({ token: res.token, ...res.user }, chosen?.key);
    } catch (err) {
      setError(err.message || "Could not create your account.");
    } finally {
      setLoading(false);
      setHumanReset((n) => n + 1);
    }
  };

  const accent = chosen?.color || C.blue;

  return (
    <div className="min-h-screen w-full flex" style={{ background: C.bg }}>
      <Panel accent={accent} />

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-sm py-6">
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
                {/* Real businesses sign in with their invited company email only. Self
                   sign-up exists only on the public demo. */}
                {[
                  ["signin", "Sign in"],
                  ...(DEMO_MODE ? [["register", "Create account"]] : []),
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

                  <TextField label="Email" icon={Mail} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

                  <TextField
                    label="Password" icon={Lock} type={showPw ? "text" : "password"} required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    right={
                      <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

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

                  <Turnstile onToken={setHumanToken} resetSignal={humanReset} />

                  <Button type="submit" size="lg" className="w-full" disabled={loading || waitingForHuman} style={chosen ? { background: chosen.color, color: "#fff" } : undefined}>
                    {loading ? <Spinner color="#fff" /> : null}
                    {loading ? "Signing in..." : chosen ? `Enter ${chosen.label}` : "Sign in"}
                    {!loading && <ArrowRight size={15} />}
                  </Button>

                  {DEMO_MODE && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: C.faint }}>Demo accounts - click to fill</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {DEMO_LOGINS.map((a) => (
                          <button
                            key={a.email}
                            type="button"
                            onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); setError(""); }}
                            className="text-left rounded-lg border px-2.5 py-1.5 transition-colors hover:opacity-80"
                            style={{ borderColor: email === a.email ? C.blue : C.line, background: email === a.email ? C.blueSoft : C.surface }}
                          >
                            <span className="block text-xs font-semibold truncate" style={{ color: C.ink }}>{a.role}</span>
                            <span className="block text-[10px] truncate" style={{ color: C.faint }}>{a.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              )}

              {mode === "register" && (
                <form onSubmit={submitRegister} className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: C.ink }}>Create your account</h1>
                    <p className="text-sm mt-1" style={{ color: C.muted }}>
                      {DEMO_MODE
                        ? "Starts on Staff access - an admin can raise your role any time."
                        : "Use the email your administrator invited, then choose a password to activate your account."}
                    </p>
                  </div>

                  <TextField label="Full name" icon={User} type="text" placeholder="Jane Doe" value={regName} onChange={(e) => setRegName(e.target.value)} error={regErrors.name} />
                  <TextField label="Email" icon={Mail} type="email" placeholder="you@company.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} error={regErrors.email} />
                  <TextField label="Contact number" icon={Phone} type="tel" placeholder="+254 7.." value={regPhone} onChange={(e) => setRegPhone(e.target.value)} error={regErrors.phone} />
                  <TextField
                    label="Password" icon={Lock} type={showPw ? "text" : "password"} placeholder="8+ characters, a letter and a number"
                    value={regPassword} onChange={(e) => setRegPassword(e.target.value)} error={regErrors.password}
                    right={
                      <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <TextField
                    label="Confirm password" icon={Lock} type={showPw ? "text" : "password"} placeholder="Re-enter your password"
                    value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} error={regErrors.confirm}
                  />

                  <div>
                    <label className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: C.muted }}>
                      <input
                        type="checkbox" className="mt-0.5" checked={regAccepted}
                        onChange={(e) => setRegAccepted(e.target.checked)}
                      />
                      <span>
                        I am {MIN_AGE} or older and I agree to the{" "}
                        <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: C.blue }}>Terms of Use</a>
                        {" "}and{" "}
                        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="font-semibold underline" style={{ color: C.blue }}>Privacy Policy</a>.
                      </span>
                    </label>
                    {regErrors.accepted && <p className="text-xs mt-1 font-medium" style={{ color: C.coral }}>{regErrors.accepted}</p>}
                  </div>

                  {error && (
                    <p className="text-xs font-medium rounded-lg px-3 py-2" style={{ background: C.coralSoft, color: C.coral }}>{error}</p>
                  )}

                  <Turnstile onToken={setHumanToken} resetSignal={humanReset} />

                  <Button type="submit" size="lg" className="w-full" disabled={loading || waitingForHuman}>
                    {loading ? <Spinner color="#fff" /> : null}
                    {loading ? "Creating account..." : "Create account"}
                    {!loading && <ArrowRight size={15} />}
                  </Button>
                </form>
              )}

              {mode === "reset" && (
                <div className="space-y-4">
                  <h1 className="text-2xl font-bold font-display" style={{ color: C.ink }}>Reset password</h1>
                  <p className="rounded-lg p-4 text-sm leading-relaxed" style={{ background: C.surface2, color: C.ink2 }}>
                    Password resets are handled by your administrator. Ask them to remove and re-invite your email, then
                    use <strong>Create account</strong> to choose a new password.
                  </p>
                  <button type="button" onClick={() => { setMode("signin"); setDone(false); }} className="text-sm font-semibold" style={{ color: C.blue }}>
                    Back to sign in
                  </button>
                </div>
              )}
            </>
          )}

          <p className="mt-8 text-[11px] text-center" style={{ color: C.faint }}>
            <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="underline">Terms</a>
            {" · "}
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="underline">Privacy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
