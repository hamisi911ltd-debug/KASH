import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, LayoutGrid, Truck, UtensilsCrossed, BedDouble, Users,
  BarChart3, Wallet, Bell, Settings, LogOut, Search, Plus, ChevronDown,
  X, Menu, MapPin, Calendar, CreditCard, CheckCircle2, Clock,
  AlertTriangle, TrendingUp, TrendingDown, Download, ClipboardList,
  ShieldCheck, ArrowUpRight, Eye, EyeOff, Lock, Mail, Trash2, Sparkles,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

/* ============================== constants & helpers ============================== */

const C = {
  navy950: "#0A1120", navy900: "#101B30", navy800: "#182B48",
  blue: "#2F6FED", blueSoft: "#EAF1FE",
  emerald: "#0EA678", emeraldSoft: "#E7F7F1",
  amber: "#EF9438", amberSoft: "#FDF0E1",
  coral: "#F0685A", coralSoft: "#FCEAE8",
  ink: "#0F172A", muted: "#6B7688", line: "#E7EAF0", surface: "#F5F7FA",
};

const TODAY = "2026-09-10";

const formatKES = (n) => `KSh ${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

const formatDateShort = (d) => {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const genId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`;

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf;
    let start = null;
    const step = (ts) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

function statusTone(status) {
  const map = {
    Completed: "emerald", Delivered: "emerald", "Checked In": "emerald", Active: "emerald", Paid: "emerald", Available: "emerald",
    "In Transit": "blue", Preparing: "blue", Confirmed: "blue", Scheduled: "blue",
    Pending: "amber", Cleaning: "amber", Invited: "amber", Maintenance: "amber",
    "Checked Out": "slate", Cancelled: "coral", Inactive: "coral", Occupied: "coral",
  };
  return map[status] || "slate";
}

/* ============================== seed data ============================== */

const SEED_DRIVERS = [
  { id: "d1", name: "Peter Mwangi", phone: "+254 712 345 678", status: "On Duty" },
  { id: "d2", name: "James Otieno", phone: "+254 722 456 789", status: "On Duty" },
  { id: "d3", name: "Samuel Kiptoo", phone: "+254 733 567 890", status: "Off Duty" },
  { id: "d4", name: "Grace Wanjiru", phone: "+254 700 111 222", status: "On Leave" },
];

const SEED_VEHICLES = [
  { id: "v1", reg: "KDA 245A", type: "Bus", model: "Scania K410", driverId: "d1", status: "Active", mileage: 182340 },
  { id: "v2", reg: "KCB 102X", type: "Shuttle", model: "Toyota Hiace", driverId: "d2", status: "Active", mileage: 96500 },
  { id: "v3", reg: "KDG 771B", type: "Truck", model: "Isuzu FRR", driverId: "d3", status: "Maintenance", mileage: 210800 },
  { id: "v4", reg: "KDN 330F", type: "Van", model: "Nissan NV350", driverId: "d4", status: "Active", mileage: 54200 },
];

const SEED_TRIPS = [
  { id: "t1", date: "2026-09-08", vehicleId: "v1", driverId: "d1", origin: "Nairobi", destination: "Mombasa", amount: 186000, expenses: 42000, status: "Completed" },
  { id: "t2", date: "2026-09-09", vehicleId: "v2", driverId: "d2", origin: "Nairobi CBD", destination: "Westlands", amount: 8200, expenses: 1500, status: "Completed" },
  { id: "t3", date: "2026-09-09", vehicleId: "v4", driverId: "d4", origin: "Nairobi", destination: "Nakuru", amount: 34500, expenses: 9800, status: "In Transit" },
  { id: "t4", date: "2026-09-10", vehicleId: "v1", driverId: "d1", origin: "Nairobi", destination: "Kisumu", amount: 142000, expenses: 38500, status: "Scheduled" },
  { id: "t5", date: "2026-09-07", vehicleId: "v3", driverId: "d3", origin: "Nairobi", destination: "Eldoret", amount: 96000, expenses: 31000, status: "Completed" },
];

const SEED_ORDERS = [
  { id: "o1", date: "2026-09-10", customer: "Zenith Africa Ltd", item: "Corporate lunch combo (40 pax)", qty: 40, amount: 64000, paymentStatus: "Paid", orderStatus: "Delivered" },
  { id: "o2", date: "2026-09-10", customer: "Amina Yusuf", item: "Nyama choma platter", qty: 2, amount: 3200, paymentStatus: "Paid", orderStatus: "Preparing" },
  { id: "o3", date: "2026-09-09", customer: "Rift Valley Sacco", item: "Pilau special trays", qty: 10, amount: 18500, paymentStatus: "Pending", orderStatus: "Delivered" },
  { id: "o4", date: "2026-09-09", customer: "Brian Kamau", item: "Fish fillet meal", qty: 1, amount: 950, paymentStatus: "Paid", orderStatus: "Delivered" },
  { id: "o5", date: "2026-09-08", customer: "Coastal Weddings Co.", item: "Event catering (150 pax)", qty: 150, amount: 225000, paymentStatus: "Paid", orderStatus: "Delivered" },
];

const SEED_ROOMS = [
  { id: "r1", number: "101", type: "Standard", price: 6500, status: "Occupied" },
  { id: "r2", number: "102", type: "Standard", price: 6500, status: "Available" },
  { id: "r3", number: "201", type: "Deluxe", price: 11500, status: "Occupied" },
  { id: "r4", number: "202", type: "Deluxe", price: 11500, status: "Cleaning" },
  { id: "r5", number: "301", type: "Executive Suite", price: 22000, status: "Occupied" },
  { id: "r6", number: "302", type: "Executive Suite", price: 22000, status: "Available" },
];

const SEED_BOOKINGS = [
  { id: "b1", guest: "David & Linda Achieng", roomId: "r5", checkIn: "2026-09-08", checkOut: "2026-09-12", amount: 88000, paymentStatus: "Paid", status: "Checked In" },
  { id: "b2", guest: "Tom Barasa", roomId: "r1", checkIn: "2026-09-09", checkOut: "2026-09-11", amount: 13000, paymentStatus: "Paid", status: "Checked In" },
  { id: "b3", guest: "Njeri Consulting Ltd", roomId: "r3", checkIn: "2026-09-11", checkOut: "2026-09-14", amount: 34500, paymentStatus: "Pending", status: "Confirmed" },
  { id: "b4", guest: "Faith Chebet", roomId: "r6", checkIn: "2026-09-06", checkOut: "2026-09-08", amount: 44000, paymentStatus: "Paid", status: "Checked Out" },
];

const SEED_EXPENSES = [
  { id: "e1", date: "2026-09-08", division: "Transport", category: "Fuel", amount: 42000, method: "M-Pesa", notes: "Nairobi to Mombasa trip" },
  { id: "e2", date: "2026-09-09", division: "Food", category: "Supplies", amount: 15400, method: "Bank Transfer", notes: "Weekly produce restock" },
  { id: "e3", date: "2026-09-07", division: "Transport", category: "Maintenance", amount: 31000, method: "Cash", notes: "Truck KDG 771B service" },
  { id: "e4", date: "2026-09-06", division: "Hospitality", category: "Utilities", amount: 28500, method: "Bank Transfer", notes: "Electricity - August" },
  { id: "e5", date: "2026-09-10", division: "General", category: "Salaries", amount: 186000, method: "Bank Transfer", notes: "Admin & support staff" },
  { id: "e6", date: "2026-09-09", division: "Food", category: "Supplies", amount: 9200, method: "M-Pesa", notes: "Butchery order" },
];

const SEED_USERS = [
  { id: "u1", name: "Wanjiku Kamande", email: "wanjiku@nexoraone.co.ke", role: "Super Admin", division: "All", status: "Active" },
  { id: "u2", name: "Peter Mwangi", email: "peter.m@nexoraone.co.ke", role: "Transport Manager", division: "Transport", status: "Active" },
  { id: "u3", name: "Aisha Noor", email: "aisha.n@nexoraone.co.ke", role: "Food Manager", division: "Food", status: "Active" },
  { id: "u4", name: "Daniel Kiprop", email: "daniel.k@nexoraone.co.ke", role: "Hospitality Manager", division: "Hospitality", status: "Active" },
  { id: "u5", name: "Mercy Adhiambo", email: "mercy.a@nexoraone.co.ke", role: "Staff", division: "Food", status: "Invited" },
];

const SEED_NOTIFICATIONS = [
  { id: "n1", message: "New booking confirmed - Njeri Consulting Ltd, Room 201", time: "10 min ago", read: false },
  { id: "n2", message: "Expense approval needed - truck maintenance, KSh 31,000", time: "1 hr ago", read: false },
  { id: "n3", message: "Trip scheduled - Nairobi to Kisumu, tomorrow 6:00 AM", time: "2 hr ago", read: false },
  { id: "n4", message: "Large catering order received - Coastal Weddings Co.", time: "Yesterday", read: true },
  { id: "n5", message: "Fleet insurance renewal due 30 Sept", time: "Yesterday", read: true },
];

const SEED_REMINDERS = [
  { id: "rem1", title: "Renew fleet insurance", due: "2026-09-30", done: false },
  { id: "rem2", title: "File VAT return", due: "2026-09-20", done: false },
  { id: "rem3", title: "Deep clean Room 202", due: "2026-09-12", done: false },
  { id: "rem4", title: "Review Q3 supplier contracts", due: "2026-09-25", done: false },
];

const NAV_ITEMS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard, roles: ["Super Admin", "Admin"] },
  { key: "all", label: "All Services", icon: LayoutGrid, roles: ["Super Admin", "Admin"] },
  { key: "transport", label: "Transport", icon: Truck, roles: ["Super Admin", "Admin", "Transport Manager"] },
  { key: "food", label: "Food", icon: UtensilsCrossed, roles: ["Super Admin", "Admin", "Food Manager"] },
  { key: "hospitality", label: "Hospitality", icon: BedDouble, roles: ["Super Admin", "Admin", "Hospitality Manager"] },
  { key: "users", label: "Users", icon: Users, roles: ["Super Admin", "Admin"] },
  { key: "reports", label: "Reports", icon: BarChart3, roles: ["Super Admin", "Admin"] },
  { key: "expenses", label: "Expenses", icon: Wallet, roles: ["Super Admin", "Admin", "Transport Manager", "Food Manager", "Hospitality Manager"] },
  { key: "updates", label: "Updates & Reminders", icon: Bell, roles: ["Super Admin", "Admin", "Transport Manager", "Food Manager", "Hospitality Manager", "Staff"] },
  { key: "settings", label: "Settings", icon: Settings, roles: ["Super Admin", "Admin", "Transport Manager", "Food Manager", "Hospitality Manager", "Staff"] },
];

const ROLES = ["Super Admin", "Admin", "Transport Manager", "Food Manager", "Hospitality Manager", "Staff"];

/* ============================== shared UI ============================== */

function Badge({ children, tone = "slate" }) {
  const tones = {
    emerald: { bg: C.emeraldSoft, fg: C.emerald },
    amber: { bg: C.amberSoft, fg: "#B4650F" },
    coral: { bg: C.coralSoft, fg: C.coral },
    blue: { bg: C.blueSoft, fg: C.blue },
    slate: { bg: "#EEF1F5", fg: "#5B6472" },
  };
  const t = tones[tone] || tones.slate;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: t.bg, color: t.fg }}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-2xl bg-white border p-5 ${className}`} style={{ borderColor: C.line }}>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: C.muted }}>{label}</p>
          <p className="mt-2 text-xl font-bold truncate" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>{value}</p>
        </div>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint + "20" }}>
          <Icon size={18} style={{ color: tint }} />
        </div>
      </div>
    </Card>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-4 gap-3">
      <h2 className="text-base font-semibold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>{title}</h2>
      {action}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", type = "button", size = "md" }) {
  const styles = {
    primary: { background: C.blue, color: "#fff" },
    outline: { background: "#fff", color: C.ink, border: `1px solid ${C.line}` },
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-lg font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-85 ${sizes[size]}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }) {
  return <div className="py-10 text-center text-sm" style={{ color: C.muted }}>{text}</div>;
}

function MiniBarChart({ data, xKey, dataKey, color, height = 210 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F6" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip formatter={(v, n) => [formatKES(v), n]} contentStyle={{ borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 12 }} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ============================== form modal ============================== */

function FieldInput({ field, value, onChange }) {
  const base = "w-full rounded-lg border px-3 py-2 text-sm bg-white";
  if (field.type === "select") {
    return (
      <select value={value} onChange={(e) => onChange(field.key, e.target.value)} className={base} style={{ borderColor: C.line, color: C.ink }}>
        {field.options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    );
  }
  if (field.type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(field.key, e.target.value)}
        rows={3}
        className={base}
        style={{ borderColor: C.line, color: C.ink }}
        placeholder={field.placeholder || ""}
      />
    );
  }
  return (
    <input
      type={field.type || "text"}
      value={value}
      onChange={(e) => onChange(field.key, e.target.value)}
      className={base}
      style={{ borderColor: C.line, color: C.ink }}
      placeholder={field.placeholder || ""}
    />
  );
}

function FormModal({ config, onClose, onSubmit }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      config.fields.map((f) => [f.key, f.default !== undefined ? f.default : f.type === "select" ? (f.options[0] ? f.options[0].value : "") : ""])
    )
  );
  const handleChange = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(values); };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4"
      style={{ zIndex: 90, background: "rgba(10,17,32,0.55)" }}
      onClick={onClose}
    >
      <div
        className="n1-modal w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto n1-scroll"
        style={{ maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif", color: C.ink }}>{config.title}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {config.fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>{f.label}</label>
              <FieldInput field={f} value={values[f.key]} onChange={handleChange} />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ color: C.muted }}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: C.blue }}>{config.submitLabel || "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ToastStack({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 flex flex-col gap-2 items-end" style={{ zIndex: 100 }}>
      {toasts.map((t) => (
        <div key={t.id} className="n1-toast flex items-center gap-2 rounded-xl bg-white border px-4 py-3 shadow-lg" style={{ borderColor: C.line, minWidth: 240 }}>
          <CheckCircle2 size={17} style={{ color: C.emerald }} />
          <span className="text-sm font-medium" style={{ color: C.ink }}>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================== login ============================== */

function RegisterForm() {
  const [sent, setSent] = useState(false);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "Sora, sans-serif", color: C.ink }}>Create your account</h1>
      {sent ? (
        <div className="rounded-lg p-4 text-sm" style={{ background: C.blueSoft, color: C.blue }}>
          Request sent. A Super Admin will review and approve your access shortly.
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Full name</label>
            <input required className="w-full rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: C.line }} placeholder="Jane Doe" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Work email</label>
            <input required type="email" className="w-full rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: C.line }} placeholder="you@company.com" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Company name</label>
            <input required className="w-full rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: C.line }} placeholder="Nexora Holdings Ltd" />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: C.blue }}>Request access</button>
        </form>
      )}
    </div>
  );
}

function LoginScreen({ role, setRole, onLogin }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("wanjiku@nexoraone.co.ke");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(); }, 650);
  };

  return (
    <div className="min-h-screen w-full flex n1-font-body" style={{ background: C.surface }}>
      <div className="hidden lg:flex flex-col justify-between w-[42%] p-12 text-white relative overflow-hidden" style={{ background: `linear-gradient(150deg, ${C.navy950}, ${C.navy800})` }}>
        <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(47,111,237,0.35), transparent 70%)" }} />
        <div className="absolute -left-10 bottom-10 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(14,166,120,0.25), transparent 70%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: C.blue }}><Sparkles size={18} color="#fff" /></div>
            <span className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif" }}>NEXORA ONE</span>
          </div>
          <p className="mt-1 text-sm text-white/50">One business. Total control.</p>
        </div>
        <div className="relative space-y-6">
          <p className="text-3xl leading-snug font-bold" style={{ fontFamily: "Sora, sans-serif" }}>Run transport, food and hospitality from a single screen.</p>
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl bg-white/10 p-4">
              <Truck size={18} className="mb-2" />
              <p className="text-xs text-white/60">Transport</p>
              <p className="text-sm font-semibold">4 vehicles active</p>
            </div>
            <div className="flex-1 rounded-xl bg-white/10 p-4">
              <UtensilsCrossed size={18} className="mb-2" />
              <p className="text-xs text-white/60">Food</p>
              <p className="text-sm font-semibold">5 orders today</p>
            </div>
            <div className="flex-1 rounded-xl bg-white/10 p-4">
              <BedDouble size={18} className="mb-2" />
              <p className="text-xs text-white/60">Hospitality</p>
              <p className="text-sm font-semibold">67% occupancy</p>
            </div>
          </div>
        </div>
        <p className="relative text-xs text-white/40">(c) 2026 Nexora Holdings Ltd.</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: C.blue }}><Sparkles size={18} color="#fff" /></div>
            <span className="text-lg font-bold" style={{ fontFamily: "Sora, sans-serif", color: C.ink }}>NEXORA ONE</span>
          </div>

          <div className="flex rounded-xl p-1 mb-7" style={{ background: "#EEF1F5" }}>
            <button onClick={() => setMode("signin")} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={mode === "signin" ? { background: "#fff", color: C.ink, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: C.muted }}>Sign in</button>
            <button onClick={() => setMode("register")} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={mode === "register" ? { background: "#fff", color: C.ink, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: C.muted }}>Create account</button>
          </div>

          {mode === "signin" ? (
            !forgot ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h1 className="text-2xl font-bold" style={{ fontFamily: "Sora, sans-serif", color: C.ink }}>Welcome back</h1>
                <p className="text-sm" style={{ color: C.muted }}>Sign in to manage your business.</p>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full rounded-lg border pl-9 pr-3 py-2.5 text-sm" style={{ borderColor: C.line }} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? "text" : "password"} required placeholder="********" className="w-full rounded-lg border pl-9 pr-9 py-2.5 text-sm" style={{ borderColor: C.line }} />
                    <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Sign in as</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: C.line }}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <p className="mt-1.5 text-xs" style={{ color: C.muted }}>Preview tip: choose a role to see how the workspace adapts.</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2" style={{ color: C.muted }}>
                    <input type="checkbox" defaultChecked className="rounded" /> Remember me
                  </label>
                  <button type="button" onClick={() => setForgot(true)} className="font-semibold" style={{ color: C.blue }}>Forgot password?</button>
                </div>

                <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2" style={{ background: C.blue }}>
                  {loading ? <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : null}
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <h1 className="text-2xl font-bold" style={{ fontFamily: "Sora, sans-serif", color: C.ink }}>Reset password</h1>
                {!resetSent ? (
                  <>
                    <p className="text-sm" style={{ color: C.muted }}>Enter your email and we'll send reset instructions.</p>
                    <input type="email" placeholder="you@company.com" className="w-full rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: C.line }} />
                    <button onClick={() => setResetSent(true)} className="w-full py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: C.blue }}>Send reset link</button>
                  </>
                ) : (
                  <div className="rounded-lg p-4 text-sm" style={{ background: C.emeraldSoft, color: C.emerald }}>
                    If an account exists for that email, reset instructions are on the way.
                  </div>
                )}
                <button onClick={() => { setForgot(false); setResetSent(false); }} className="text-sm font-semibold" style={{ color: C.blue }}>Back to sign in</button>
              </div>
            )
          ) : (
            <RegisterForm />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== navigation shell ============================== */

function NavList({ items, activeView, setActiveView, onNavigate }) {
  return (
    <nav className="flex-1 px-3 space-y-1 overflow-y-auto n1-scroll">
      {items.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.key;
        return (
          <button
            key={item.key}
            onClick={() => { setActiveView(item.key); if (onNavigate) onNavigate(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={active ? { background: "rgba(47,111,237,0.18)", color: "#fff" } : { color: "rgba(255,255,255,0.6)" }}
          >
            <Icon size={17} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Sidebar({ items, activeView, setActiveView, role, setRole, onLogout }) {
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0" style={{ background: C.navy950 }}>
      <div className="px-5 py-6 flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: C.blue }}><Sparkles size={18} color="#fff" /></div>
        <div>
          <p className="text-white font-bold text-sm leading-none" style={{ fontFamily: "Sora, sans-serif" }}>NEXORA ONE</p>
          <p className="mt-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>One business. Total control.</p>
        </div>
      </div>
      <NavList items={items} activeView={activeView} setActiveView={setActiveView} />
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <label className="block uppercase tracking-wide mb-1.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Viewing as</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg text-xs font-medium px-2.5 py-2 mb-3" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "none" }}>
          {ROLES.map((r) => <option key={r} value={r} style={{ color: "#000" }}>{r}</option>)}
        </select>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
          <LogOut size={16} /> Log out
        </button>
      </div>
    </aside>
  );
}

function MobileDrawer({ open, onClose, items, activeView, setActiveView, role, setRole, onLogout }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 md:hidden" style={{ zIndex: 80 }}>
      <div className="absolute inset-0" style={{ background: "rgba(10,17,32,0.55)" }} onClick={onClose} />
      <div className="n1-modal absolute left-0 top-0 bottom-0 w-72 flex flex-col" style={{ background: C.navy950 }}>
        <div className="px-5 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: C.blue }}><Sparkles size={18} color="#fff" /></div>
            <p className="text-white font-bold text-sm" style={{ fontFamily: "Sora, sans-serif" }}>NEXORA ONE</p>
          </div>
          <button onClick={onClose} className="text-white/60"><X size={18} /></button>
        </div>
        <NavList items={items} activeView={activeView} setActiveView={setActiveView} onNavigate={onClose} />
        <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg text-xs font-medium px-2.5 py-2 mb-3" style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "none" }}>
            {ROLES.map((r) => <option key={r} value={r} style={{ color: "#000" }}>{r}</option>)}
          </select>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
            <LogOut size={16} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileBottomNav({ items, activeView, setActiveView, onMore }) {
  const primary = items.slice(0, 4);
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-stretch bg-white border-t" style={{ zIndex: 70, borderColor: C.line }}>
      {primary.map((item) => {
        const Icon = item.icon;
        const active = activeView === item.key;
        return (
          <button key={item.key} onClick={() => setActiveView(item.key)} className="flex-1 flex flex-col items-center gap-1 py-2.5">
            <Icon size={18} style={{ color: active ? C.blue : C.muted }} />
            <span className="font-medium" style={{ fontSize: 10, color: active ? C.blue : C.muted }}>{item.label.split(" ")[0]}</span>
          </button>
        );
      })}
      <button onClick={onMore} className="flex-1 flex flex-col items-center gap-1 py-2.5">
        <Menu size={18} style={{ color: C.muted }} />
        <span className="font-medium" style={{ fontSize: 10, color: C.muted }}>More</span>
      </button>
    </div>
  );
}

function Topbar({ onMenuClick, searchTerm, setSearchTerm, notifications, onMarkAllRead, onMarkRead, onOpenModal, userName, role, onLogout, setActiveView }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  const quickList = [
    { key: "newTrip", label: "New Trip" },
    { key: "newExpense", label: "New Expense" },
    { key: "newOrder", label: "New Order" },
    { key: "newBooking", label: "New Booking" },
    { key: "addVehicle", label: "Add Vehicle" },
    { key: "addRoom", label: "Add Room" },
    { key: "addUser", label: "Add User" },
    { key: "addReminder", label: "Add Reminder" },
  ];

  return (
    <header className="sticky top-0 flex items-center gap-3 px-4 md:px-8 py-4 bg-white border-b" style={{ zIndex: 40, borderColor: C.line }}>
      <button onClick={onMenuClick} className="md:hidden"><Menu size={20} style={{ color: C.ink }} /></button>

      <div className="flex-1 flex items-center gap-2 max-w-md rounded-lg px-3 py-2" style={{ background: C.surface }}>
        <Search size={16} style={{ color: C.muted }} />
        <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search trips, orders, guests..." className="bg-transparent text-sm flex-1 outline-none" style={{ color: C.ink }} />
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg" style={{ background: C.surface, color: C.muted }}>
        <Calendar size={14} /> Thu, 10 Sep 2026
      </div>

      <div className="relative">
        <button onClick={() => { setNotifOpen((s) => !s); setQuickOpen(false); setProfileOpen(false); }} className="relative h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: C.surface }}>
          <Bell size={17} style={{ color: C.ink }} />
          {unread > 0 && <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full text-white flex items-center justify-center" style={{ background: C.coral, fontSize: 10, fontWeight: 700 }}>{unread}</span>}
        </button>
        {notifOpen && (
          <div className="n1-modal absolute right-0 mt-2 w-80 rounded-2xl bg-white border shadow-xl" style={{ borderColor: C.line, zIndex: 50 }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.line }}>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>Notifications</p>
              <button onClick={onMarkAllRead} className="text-xs font-semibold" style={{ color: C.blue }}>Mark all read</button>
            </div>
            <div className="max-h-72 overflow-y-auto n1-scroll">
              {notifications.length === 0 && <EmptyState text="You're all caught up." />}
              {notifications.map((n) => (
                <button key={n.id} onClick={() => onMarkRead(n.id)} className="w-full text-left px-4 py-3 flex gap-2.5 border-b hover:bg-slate-50" style={{ borderColor: C.line }}>
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: n.read ? "transparent" : C.blue }} />
                  <div>
                    <p className="text-sm" style={{ color: C.ink }}>{n.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{n.time}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button onClick={() => { setQuickOpen((s) => !s); setNotifOpen(false); setProfileOpen(false); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: C.blue }}>
          <Plus size={16} /> <span className="hidden sm:inline">New</span> <ChevronDown size={14} />
        </button>
        {quickOpen && (
          <div className="n1-modal absolute right-0 mt-2 w-52 rounded-2xl bg-white border shadow-xl py-1.5" style={{ borderColor: C.line, zIndex: 50 }}>
            {quickList.map((q) => (
              <button key={q.key} onClick={() => { onOpenModal(q.key); setQuickOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50" style={{ color: C.ink }}>{q.label}</button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button onClick={() => { setProfileOpen((s) => !s); setNotifOpen(false); setQuickOpen(false); }} className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: C.navy800 }}>
          {userName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </button>
        {profileOpen && (
          <div className="n1-modal absolute right-0 mt-2 w-52 rounded-2xl bg-white border shadow-xl py-1.5" style={{ borderColor: C.line, zIndex: 50 }}>
            <div className="px-4 py-2 border-b" style={{ borderColor: C.line }}>
              <p className="text-sm font-semibold" style={{ color: C.ink }}>{userName}</p>
              <p className="text-xs" style={{ color: C.muted }}>{role}</p>
            </div>
            <button onClick={() => { setActiveView("settings"); setProfileOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50" style={{ color: C.ink }}>Settings</button>
            <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50" style={{ color: C.coral }}>Log out</button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ============================== views ============================== */

function OverviewView({ trips, orders, bookings, rooms, expenses, users, notifications, reminders, searchTerm, period, setPeriod, setActiveView }) {
  const periodDays = { Today: 1, "This Week": 7, "This Month": 31, "All Time": 3650 }[period];
  const cutoff = new Date(TODAY);
  cutoff.setDate(cutoff.getDate() - periodDays + 1);
  const inPeriod = (d) => new Date(d) >= cutoff;

  const tExpenses = expenses.filter((e) => e.division === "Transport").reduce((s, e) => s + e.amount, 0);
  const fExpenses = expenses.filter((e) => e.division === "Food").reduce((s, e) => s + e.amount, 0);
  const hExpenses = expenses.filter((e) => e.division === "Hospitality").reduce((s, e) => s + e.amount, 0);

  const transportRevenue = trips.filter((t) => inPeriod(t.date)).reduce((s, t) => s + t.amount, 0);
  const foodRevenue = orders.filter((o) => inPeriod(o.date)).reduce((s, o) => s + o.amount, 0);
  const hospitalityRevenue = bookings.filter((b) => inPeriod(b.checkIn)).reduce((s, b) => s + b.amount, 0);
  const totalRevenue = transportRevenue + foodRevenue + hospitalityRevenue;
  const totalExpenses = expenses.filter((e) => inPeriod(e.date)).reduce((s, e) => s + e.amount, 0);
  const netPosition = totalRevenue - totalExpenses;
  const pendingUpdates = notifications.filter((n) => !n.read).length;
  const occRate = Math.round((rooms.filter((r) => r.status === "Occupied").length / rooms.length) * 100);
  const animatedRevenue = useCountUp(totalRevenue);

  const monthly = [
    { month: "Apr", revenue: 1180000, expenses: 640000 },
    { month: "May", revenue: 1320000, expenses: 705000 },
    { month: "Jun", revenue: 1250000, expenses: 690000 },
    { month: "Jul", revenue: 1460000, expenses: 760000 },
    { month: "Aug", revenue: 1590000, expenses: 812000 },
    {
      month: "Sep",
      revenue: trips.reduce((s, t) => s + t.amount, 0) + orders.reduce((s, o) => s + o.amount, 0) + bookings.reduce((s, b) => s + b.amount, 0),
      expenses: expenses.reduce((s, e) => s + e.amount, 0),
    },
  ];

  const serviceData = [
    { name: "Transport", value: Math.max(transportRevenue, 1), color: C.emerald },
    { name: "Food", value: Math.max(foodRevenue, 1), color: C.amber },
    { name: "Hospitality", value: Math.max(hospitalityRevenue, 1), color: C.coral },
  ];
  const serviceTotal = serviceData.reduce((s, d) => s + d.value, 0);

  const activity = [
    ...trips.map((t) => ({ id: t.id, date: t.date, division: "Transport", desc: `${t.origin} to ${t.destination}`, amount: t.amount, status: t.status })),
    ...orders.map((o) => ({ id: o.id, date: o.date, division: "Food", desc: o.item, amount: o.amount, status: o.orderStatus })),
    ...bookings.map((b) => ({ id: b.id, date: b.checkIn, division: "Hospitality", desc: b.guest, amount: b.amount, status: b.status })),
  ]
    .filter((a) => inPeriod(a.date))
    .filter((a) => !searchTerm || a.desc.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7);

  const pendingActions = [];
  if (expenses.some((e) => e.category === "Maintenance")) {
    pendingActions.push({ icon: AlertTriangle, tone: C.amber, text: "Vehicle KDG 771B is due for maintenance" });
  }
  const pendingBookings = bookings.filter((b) => b.paymentStatus === "Pending").length;
  if (pendingBookings) pendingActions.push({ icon: CreditCard, tone: C.coral, text: `${pendingBookings} booking payment(s) pending confirmation` });
  const pendingOrders = orders.filter((o) => o.paymentStatus === "Pending").length;
  if (pendingOrders) pendingActions.push({ icon: CreditCard, tone: C.coral, text: `${pendingOrders} food order payment(s) pending` });
  if (pendingUpdates) pendingActions.push({ icon: Bell, tone: C.blue, text: `${pendingUpdates} unread notification(s) need review` });

  const divisions = [
    { key: "transport", label: "Transport", icon: Truck, color: C.emerald, revenue: transportRevenue, expenses: tExpenses },
    { key: "food", label: "Food", icon: UtensilsCrossed, color: C.amber, revenue: foodRevenue, expenses: fExpenses },
    { key: "hospitality", label: "Hospitality", icon: BedDouble, color: C.coral, revenue: hospitalityRevenue, expenses: hExpenses },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-7 md:p-8 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.navy950}, ${C.navy800})` }}>
        <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(47,111,237,0.30), transparent 70%)" }} />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/50">Total revenue - {period}</p>
            <p className="mt-2 text-4xl md:text-5xl font-bold" style={{ fontFamily: "Sora, sans-serif" }}>{formatKES(animatedRevenue)}</p>
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg text-xs font-semibold px-3 py-2" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none" }}>
            {["Today", "This Week", "This Month", "All Time"].map((p) => <option key={p} value={p} style={{ color: "#000" }}>{p}</option>)}
          </select>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-8">
          <div><p className="text-xs text-white/50">Total expenses</p><p className="text-lg font-semibold mt-1">{formatKES(totalExpenses)}</p></div>
          <div><p className="text-xs text-white/50">Net position</p><p className="text-lg font-semibold mt-1" style={{ color: netPosition >= 0 ? "#6EE7B7" : "#FCA5A5" }}>{formatKES(netPosition)}</p></div>
          <div><p className="text-xs text-white/50">Active divisions</p><p className="text-lg font-semibold mt-1">3 of 3</p></div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {divisions.map((d) => (
          <Card key={d.key}>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: d.color + "20" }}><d.icon size={18} style={{ color: d.color }} /></div>
              <p className="font-semibold text-sm" style={{ color: C.ink }}>{d.label}</p>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-xs" style={{ color: C.muted }}>Revenue</p>
                <p className="text-lg font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>{formatKES(d.revenue)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: C.muted }}>Expenses</p>
                <p className="text-sm font-semibold" style={{ color: C.coral }}>{formatKES(d.expenses)}</p>
              </div>
            </div>
            <button onClick={() => setActiveView(d.key)} className="mt-4 text-xs font-semibold flex items-center gap-1" style={{ color: C.blue }}>
              View division <ArrowUpRight size={13} />
            </button>
          </Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Bell} label="Pending updates" value={pendingUpdates} tint={C.blue} />
        <StatCard icon={Users} label="Total users" value={users.length} tint={C.navy800} />
        <StatCard icon={BedDouble} label="Occupancy rate" value={`${occRate}%`} tint={C.coral} />
        <StatCard icon={TrendingUp} label="Active services" value="3" tint={C.emerald} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle title="Revenue vs expenses" />
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.blue} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.coral} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.coral} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v, n) => [formatKES(v), n]} contentStyle={{ borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke={C.blue} fill="url(#revGrad)" strokeWidth={2.5} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stroke={C.coral} fill="url(#expGrad)" strokeWidth={2} name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-2">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><span className="h-2 w-2 rounded-full" style={{ background: C.blue }} /> Revenue</span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: C.muted }}><span className="h-2 w-2 rounded-full" style={{ background: C.coral }} /> Expenses</span>
          </div>
        </Card>

        <Card>
          <SectionTitle title="Service distribution" />
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={serviceData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                {serviceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [formatKES(v), n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {serviceData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5" style={{ color: C.ink }}><span className="h-2 w-2 rounded-full" style={{ background: d.color }} />{d.name}</span>
                <span style={{ color: C.muted }}>{Math.round((d.value / serviceTotal) * 100)}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.line }}>
          <div className="p-5 pb-0"><SectionTitle title="Recent activity" /></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ color: C.muted }}>
                  <th className="font-medium px-5 py-2 text-xs">Division</th>
                  <th className="font-medium px-5 py-2 text-xs">Description</th>
                  <th className="font-medium px-5 py-2 text-xs">Date</th>
                  <th className="font-medium px-5 py-2 text-xs">Amount</th>
                  <th className="font-medium px-5 py-2 text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr key={a.id} className="border-t" style={{ borderColor: C.line }}>
                    <td className="px-5 py-2.5"><Badge tone={a.division === "Transport" ? "emerald" : a.division === "Food" ? "amber" : "coral"}>{a.division}</Badge></td>
                    <td className="px-5 py-2.5" style={{ color: C.ink }}>{a.desc}</td>
                    <td className="px-5 py-2.5" style={{ color: C.muted }}>{formatDateShort(a.date)}</td>
                    <td className="px-5 py-2.5 font-semibold" style={{ color: C.ink }}>{formatKES(a.amount)}</td>
                    <td className="px-5 py-2.5"><Badge tone={statusTone(a.status)}>{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activity.length === 0 && <EmptyState text="No activity in this period." />}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle title="Pending actions" />
            <div className="space-y-3">
              {pendingActions.length === 0 && <EmptyState text="Nothing needs your attention." />}
              {pendingActions.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <Icon size={16} style={{ color: a.tone, marginTop: 2 }} />
                    <span style={{ color: C.ink }}>{a.text}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <SectionTitle title="Upcoming reminders" />
            <div className="space-y-3">
              {reminders.filter((r) => !r.done).slice(0, 3).map((r) => (
                <div key={r.id} className="flex items-center gap-2.5 text-sm">
                  <Clock size={15} style={{ color: C.blue }} />
                  <div className="flex-1">
                    <p style={{ color: C.ink }}>{r.title}</p>
                    <p className="text-xs" style={{ color: C.muted }}>Due {formatDateShort(r.due)}</p>
                  </div>
                </div>
              ))}
              {reminders.filter((r) => !r.done).length === 0 && <EmptyState text="No reminders scheduled." />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AllServicesView({ trips, orders, bookings, expenses, setActiveView }) {
  const transportRevenue = trips.reduce((s, t) => s + t.amount, 0);
  const foodRevenue = orders.reduce((s, o) => s + o.amount, 0);
  const hospitalityRevenue = bookings.reduce((s, b) => s + b.amount, 0);
  const rows = [
    { key: "transport", label: "Transport", icon: Truck, color: C.emerald, revenue: transportRevenue, expenses: expenses.filter((e) => e.division === "Transport").reduce((s, e) => s + e.amount, 0), count: trips.length, unit: "trips" },
    { key: "food", label: "Food", icon: UtensilsCrossed, color: C.amber, revenue: foodRevenue, expenses: expenses.filter((e) => e.division === "Food").reduce((s, e) => s + e.amount, 0), count: orders.length, unit: "orders" },
    { key: "hospitality", label: "Hospitality", icon: BedDouble, color: C.coral, revenue: hospitalityRevenue, expenses: expenses.filter((e) => e.division === "Hospitality").reduce((s, e) => s + e.amount, 0), count: bookings.length, unit: "bookings" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>All services</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Compare every division side by side.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {rows.map((r) => {
          const net = r.revenue - r.expenses;
          const Icon = r.icon;
          return (
            <Card key={r.key}>
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: r.color + "20" }}><Icon size={19} style={{ color: r.color }} /></div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: C.ink }}>{r.label}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{r.count} {r.unit}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span style={{ color: C.muted }}>Revenue</span><span className="font-semibold" style={{ color: C.ink }}>{formatKES(r.revenue)}</span></div>
                <div className="flex justify-between"><span style={{ color: C.muted }}>Expenses</span><span className="font-semibold" style={{ color: C.coral }}>{formatKES(r.expenses)}</span></div>
                <div className="flex justify-between border-t pt-2" style={{ borderColor: C.line }}><span style={{ color: C.muted }}>Net</span><span className="font-bold" style={{ color: net >= 0 ? C.emerald : C.coral }}>{formatKES(net)}</span></div>
              </div>
              <div className="mt-4">
                <Button onClick={() => setActiveView(r.key)} variant="outline" size="sm">Open {r.label}</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function TransportView({ vehicles, drivers, trips, expenses, searchTerm, openModal, onDelete }) {
  const revenue = trips.reduce((s, t) => s + t.amount, 0);
  const txExpenses = expenses.filter((e) => e.division === "Transport");
  const fuel = txExpenses.filter((e) => e.category === "Fuel").reduce((s, e) => s + e.amount, 0);
  const other = txExpenses.filter((e) => e.category !== "Fuel").reduce((s, e) => s + e.amount, 0);
  const driverName = (id) => { const d = drivers.find((x) => x.id === id); return d ? d.name : "-"; };
  const vehicleReg = (id) => { const v = vehicles.find((x) => x.id === id); return v ? v.reg : "-"; };

  const q = searchTerm.toLowerCase();
  const filteredTrips = trips.filter((t) => !q || `${t.origin} ${t.destination} ${vehicleReg(t.vehicleId)}`.toLowerCase().includes(q));
  const filteredVehicles = vehicles.filter((v) => !q || `${v.reg} ${v.model}`.toLowerCase().includes(q));

  const dailyMap = {};
  trips.forEach((t) => {
    if (!dailyMap[t.date]) dailyMap[t.date] = { day: t.date.slice(5), amount: 0 };
    dailyMap[t.date].amount += t.amount;
  });
  const daily = Object.values(dailyMap).sort((a, b) => a.day.localeCompare(b.day));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>Transport</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Fleet, drivers and trip performance.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openModal("addVehicle")} variant="outline" size="sm"><Plus size={14} /> Add vehicle</Button>
          <Button onClick={() => openModal("newTrip")} size="sm"><Plus size={14} /> New trip</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="Vehicles" value={`${vehicles.filter((v) => v.status === "Active").length}/${vehicles.length} active`} tint={C.emerald} />
        <StatCard icon={Users} label="Drivers" value={`${drivers.filter((d) => d.status === "On Duty").length}/${drivers.length} on duty`} tint={C.blue} />
        <StatCard icon={MapPin} label="Amount received" value={formatKES(revenue)} tint={C.emerald} />
        <StatCard icon={Wallet} label="Fuel / other expenses" value={`${formatKES(fuel)} / ${formatKES(other)}`} tint={C.coral} />
      </div>

      <Card>
        <SectionTitle title="Revenue by day" />
        <MiniBarChart data={daily} xKey="day" dataKey="amount" color={C.emerald} />
      </Card>

      <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.line }}>
        <div className="p-5 pb-0"><SectionTitle title="Trips" /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: C.muted }}>
                <th className="font-medium px-5 py-2 text-xs">Date</th>
                <th className="font-medium px-5 py-2 text-xs">Route</th>
                <th className="font-medium px-5 py-2 text-xs">Vehicle</th>
                <th className="font-medium px-5 py-2 text-xs">Driver</th>
                <th className="font-medium px-5 py-2 text-xs">Amount</th>
                <th className="font-medium px-5 py-2 text-xs">Status</th>
                <th className="font-medium px-5 py-2 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((t) => (
                <tr key={t.id} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{formatDateShort(t.date)}</td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{t.origin} to {t.destination}</td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{vehicleReg(t.vehicleId)}</td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{driverName(t.driverId)}</td>
                  <td className="px-5 py-2.5 font-semibold" style={{ color: C.ink }}>{formatKES(t.amount)}</td>
                  <td className="px-5 py-2.5"><Badge tone={statusTone(t.status)}>{t.status}</Badge></td>
                  <td className="px-5 py-2.5"><button onClick={() => onDelete("trip", t.id)} className="opacity-50 hover:opacity-100"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredTrips.length === 0 && <EmptyState text="No trips match your search." />}
        </div>
      </div>

      <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.line }}>
        <div className="p-5 pb-0"><SectionTitle title="Vehicles" /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: C.muted }}>
                <th className="font-medium px-5 py-2 text-xs">Registration</th>
                <th className="font-medium px-5 py-2 text-xs">Type / Model</th>
                <th className="font-medium px-5 py-2 text-xs">Driver</th>
                <th className="font-medium px-5 py-2 text-xs">Mileage</th>
                <th className="font-medium px-5 py-2 text-xs">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => (
                <tr key={v.id} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-5 py-2.5 font-semibold" style={{ color: C.ink }}>{v.reg}</td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{v.type} - {v.model}</td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{driverName(v.driverId)}</td>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{v.mileage.toLocaleString()} km</td>
                  <td className="px-5 py-2.5"><Badge tone={statusTone(v.status)}>{v.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVehicles.length === 0 && <EmptyState text="No vehicles match your search." />}
        </div>
      </div>
    </div>
  );
}

function FoodView({ orders, expenses, searchTerm, openModal, onDelete }) {
  const revenue = orders.reduce((s, o) => s + o.amount, 0);
  const foodExpenses = expenses.filter((e) => e.division === "Food").reduce((s, e) => s + e.amount, 0);
  const pending = orders.filter((o) => o.orderStatus !== "Delivered" || o.paymentStatus === "Pending").length;
  const q = searchTerm.toLowerCase();
  const filtered = orders.filter((o) => !q || `${o.customer} ${o.item}`.toLowerCase().includes(q));

  const dailyMap = {};
  orders.forEach((o) => {
    if (!dailyMap[o.date]) dailyMap[o.date] = { day: o.date.slice(5), amount: 0 };
    dailyMap[o.date].amount += o.amount;
  });
  const daily = Object.values(dailyMap).sort((a, b) => a.day.localeCompare(b.day));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>Food</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Orders, sales and kitchen expenses.</p>
        </div>
        <Button onClick={() => openModal("newOrder")} size="sm"><Plus size={14} /> New order</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Orders" value={orders.length} tint={C.amber} />
        <StatCard icon={TrendingUp} label="Revenue" value={formatKES(revenue)} tint={C.emerald} />
        <StatCard icon={Wallet} label="Expenses" value={formatKES(foodExpenses)} tint={C.coral} />
        <StatCard icon={Clock} label="Pending orders" value={pending} tint={C.blue} />
      </div>

      <Card>
        <SectionTitle title="Sales by day" />
        <MiniBarChart data={daily} xKey="day" dataKey="amount" color={C.amber} />
      </Card>

      <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.line }}>
        <div className="p-5 pb-0"><SectionTitle title="Orders" /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: C.muted }}>
                <th className="font-medium px-5 py-2 text-xs">Date</th>
                <th className="font-medium px-5 py-2 text-xs">Customer</th>
                <th className="font-medium px-5 py-2 text-xs">Item</th>
                <th className="font-medium px-5 py-2 text-xs">Amount</th>
                <th className="font-medium px-5 py-2 text-xs">Payment</th>
                <th className="font-medium px-5 py-2 text-xs">Status</th>
                <th className="font-medium px-5 py-2 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{formatDateShort(o.date)}</td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{o.customer}</td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{o.item}</td>
                  <td className="px-5 py-2.5 font-semibold" style={{ color: C.ink }}>{formatKES(o.amount)}</td>
                  <td className="px-5 py-2.5"><Badge tone={statusTone(o.paymentStatus)}>{o.paymentStatus}</Badge></td>
                  <td className="px-5 py-2.5"><Badge tone={statusTone(o.orderStatus)}>{o.orderStatus}</Badge></td>
                  <td className="px-5 py-2.5"><button onClick={() => onDelete("order", o.id)} className="opacity-50 hover:opacity-100"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState text="No orders match your search." />}
        </div>
      </div>
    </div>
  );
}

function HospitalityView({ rooms, bookings, expenses, searchTerm, openModal, onDelete }) {
  const revenue = bookings.reduce((s, b) => s + b.amount, 0);
  const hExpenses = expenses.filter((e) => e.division === "Hospitality").reduce((s, e) => s + e.amount, 0);
  const occRate = Math.round((rooms.filter((r) => r.status === "Occupied").length / rooms.length) * 100);
  const roomNumber = (id) => { const r = rooms.find((x) => x.id === id); return r ? r.number : "-"; };
  const q = searchTerm.toLowerCase();
  const filteredBookings = bookings.filter((b) => !q || b.guest.toLowerCase().includes(q));

  const roomTypes = [...new Set(rooms.map((r) => r.type))];
  const byType = roomTypes.map((type) => ({
    type,
    amount: bookings.filter((b) => { const r = rooms.find((x) => x.id === b.roomId); return r && r.type === type; }).reduce((s, b) => s + b.amount, 0),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>Hospitality</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Rooms, bookings and guest revenue.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openModal("addRoom")} variant="outline" size="sm"><Plus size={14} /> Add room</Button>
          <Button onClick={() => openModal("newBooking")} size="sm"><Plus size={14} /> New booking</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BedDouble} label="Rooms" value={rooms.length} tint={C.coral} />
        <StatCard icon={TrendingUp} label="Occupancy" value={`${occRate}%`} tint={C.emerald} />
        <StatCard icon={Calendar} label="Bookings" value={bookings.length} tint={C.blue} />
        <StatCard icon={Wallet} label="Revenue / Expenses" value={`${formatKES(revenue)} / ${formatKES(hExpenses)}`} tint={C.amber} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <SectionTitle title="Room status" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {rooms.map((r) => (
              <div key={r.id} className="rounded-xl border p-3 text-center" style={{ borderColor: C.line }}>
                <p className="text-sm font-bold" style={{ color: C.ink }}>{r.number}</p>
                <p className="text-xs mb-2" style={{ color: C.muted }}>{r.type}</p>
                <Badge tone={statusTone(r.status)}>{r.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle title="Revenue by room type" />
          <MiniBarChart data={byType} xKey="type" dataKey="amount" color={C.coral} height={190} />
        </Card>
      </div>

      <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.line }}>
        <div className="p-5 pb-0"><SectionTitle title="Bookings" /></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: C.muted }}>
                <th className="font-medium px-5 py-2 text-xs">Guest</th>
                <th className="font-medium px-5 py-2 text-xs">Room</th>
                <th className="font-medium px-5 py-2 text-xs">Check-in</th>
                <th className="font-medium px-5 py-2 text-xs">Check-out</th>
                <th className="font-medium px-5 py-2 text-xs">Amount</th>
                <th className="font-medium px-5 py-2 text-xs">Status</th>
                <th className="font-medium px-5 py-2 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{b.guest}</td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{roomNumber(b.roomId)}</td>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{formatDateShort(b.checkIn)}</td>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{formatDateShort(b.checkOut)}</td>
                  <td className="px-5 py-2.5 font-semibold" style={{ color: C.ink }}>{formatKES(b.amount)}</td>
                  <td className="px-5 py-2.5"><Badge tone={statusTone(b.status)}>{b.status}</Badge></td>
                  <td className="px-5 py-2.5"><button onClick={() => onDelete("booking", b.id)} className="opacity-50 hover:opacity-100"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBookings.length === 0 && <EmptyState text="No bookings match your search." />}
        </div>
      </div>
    </div>
  );
}

function UsersView({ users, searchTerm, openModal, onDelete }) {
  const q = searchTerm.toLowerCase();
  const filtered = users.filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q));
  const roleAccess = [
    { role: "Super Admin / Admin", access: "Full access to every module" },
    { role: "Transport Manager", access: "Transport, Expenses, Updates, Settings" },
    { role: "Food Manager", access: "Food, Expenses, Updates, Settings" },
    { role: "Hospitality Manager", access: "Hospitality, Expenses, Updates, Settings" },
    { role: "Staff", access: "Updates & Settings only" },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>Users & roles</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Manage who can access each division.</p>
        </div>
        <Button onClick={() => openModal("addUser")} size="sm"><Plus size={14} /> Add user</Button>
      </div>

      <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.line }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: C.muted }}>
                <th className="font-medium px-5 py-3 text-xs">Name</th>
                <th className="font-medium px-5 py-3 text-xs">Email</th>
                <th className="font-medium px-5 py-3 text-xs">Role</th>
                <th className="font-medium px-5 py-3 text-xs">Division</th>
                <th className="font-medium px-5 py-3 text-xs">Status</th>
                <th className="font-medium px-5 py-3 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-5 py-2.5 font-medium" style={{ color: C.ink }}>{u.name}</td>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{u.email}</td>
                  <td className="px-5 py-2.5"><Badge tone="blue">{u.role}</Badge></td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{u.division}</td>
                  <td className="px-5 py-2.5"><Badge tone={statusTone(u.status)}>{u.status}</Badge></td>
                  <td className="px-5 py-2.5"><button onClick={() => onDelete("user", u.id)} className="opacity-50 hover:opacity-100"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState text="No users match your search." />}
        </div>
      </div>

      <Card>
        <SectionTitle title="Role permissions" />
        <div className="space-y-2.5">
          {roleAccess.map((r) => (
            <div key={r.role} className="flex items-start gap-2.5 text-sm">
              <ShieldCheck size={16} style={{ color: C.blue, marginTop: 2 }} />
              <div>
                <span className="font-semibold" style={{ color: C.ink }}>{r.role}: </span>
                <span style={{ color: C.muted }}>{r.access}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ReportsView({ trips, orders, bookings, expenses }) {
  const [division, setDivision] = useState("All");
  const [range, setRange] = useState("This Month");

  const rows = [
    ...trips.map((t) => ({ date: t.date, division: "Transport", desc: `${t.origin} to ${t.destination}`, income: t.amount, expense: t.expenses })),
    ...orders.map((o) => ({ date: o.date, division: "Food", desc: o.item, income: o.amount, expense: 0 })),
    ...bookings.map((b) => ({ date: b.checkIn, division: "Hospitality", desc: b.guest, income: b.amount, expense: 0 })),
    ...expenses.map((e) => ({ date: e.date, division: e.division, desc: e.category, income: 0, expense: e.amount })),
  ]
    .filter((r) => division === "All" || r.division === division)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const income = rows.reduce((s, r) => s + r.income, 0);
  const expense = rows.reduce((s, r) => s + r.expense, 0);
  const profit = income - expense;

  const byDivision = ["Transport", "Food", "Hospitality", "General"].map((d) => ({
    division: d,
    income: rows.filter((r) => r.division === d).reduce((s, r) => s + r.income, 0),
  }));

  const exportCSV = () => {
    const header = "Date,Division,Description,Income (KSh),Expense (KSh)\n";
    const body = rows.map((r) => `${r.date},${r.division},"${r.desc.replace(/"/g, '""')}",${r.income},${r.expense}`).join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexora-one-report-${division.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Filter, review and export financial performance.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: C.line, color: C.ink }}>
            {["Today", "This Week", "This Month", "All Time"].map((p) => <option key={p}>{p}</option>)}
          </select>
          <select value={division} onChange={(e) => setDivision(e.target.value)} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: C.line, color: C.ink }}>
            {["All", "Transport", "Food", "Hospitality", "General"].map((d) => <option key={d}>{d}</option>)}
          </select>
          <div className="flex-1" />
          <Button onClick={exportCSV} variant="outline" size="sm"><Download size={14} /> Export CSV</Button>
        </div>
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Income" value={formatKES(income)} tint={C.emerald} />
        <StatCard icon={TrendingDown} label="Expenses" value={formatKES(expense)} tint={C.coral} />
        <StatCard icon={Wallet} label="Profit" value={formatKES(profit)} tint={C.blue} />
      </div>

      <Card>
        <SectionTitle title="Income by division" />
        <MiniBarChart data={byDivision} xKey="division" dataKey="income" color={C.blue} />
      </Card>

      <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.line }}>
        <div className="p-5 pb-0"><SectionTitle title="Transactions" /></div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto n1-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: C.muted }}>
                <th className="font-medium px-5 py-2 text-xs">Date</th>
                <th className="font-medium px-5 py-2 text-xs">Division</th>
                <th className="font-medium px-5 py-2 text-xs">Description</th>
                <th className="font-medium px-5 py-2 text-xs">Income</th>
                <th className="font-medium px-5 py-2 text-xs">Expense</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{formatDateShort(r.date)}</td>
                  <td className="px-5 py-2.5"><Badge tone={r.division === "Transport" ? "emerald" : r.division === "Food" ? "amber" : r.division === "Hospitality" ? "coral" : "slate"}>{r.division}</Badge></td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{r.desc}</td>
                  <td className="px-5 py-2.5 font-semibold" style={{ color: C.emerald }}>{r.income ? formatKES(r.income) : "-"}</td>
                  <td className="px-5 py-2.5 font-semibold" style={{ color: C.coral }}>{r.expense ? formatKES(r.expense) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState text="No records for this filter." />}
        </div>
      </div>
    </div>
  );
}

function ExpensesView({ expenses, searchTerm, openModal, onDelete }) {
  const [filter, setFilter] = useState("All");
  const divisions = ["All", "Transport", "Food", "Hospitality", "General"];
  const q = searchTerm.toLowerCase();
  const filtered = expenses
    .filter((e) => filter === "All" || e.division === filter)
    .filter((e) => !q || `${e.category} ${e.notes}`.toLowerCase().includes(q));
  const totalsByDivision = divisions.slice(1).map((d) => ({ division: d, total: expenses.filter((e) => e.division === d).reduce((s, e) => s + e.amount, 0) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>Expenses</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Every cost, logged and categorized.</p>
        </div>
        <Button onClick={() => openModal("newExpense")} size="sm"><Plus size={14} /> New expense</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {totalsByDivision.map((d) => (
          <StatCard
            key={d.division}
            icon={Wallet}
            label={d.division}
            value={formatKES(d.total)}
            tint={d.division === "Transport" ? C.emerald : d.division === "Food" ? C.amber : d.division === "Hospitality" ? C.coral : C.navy800}
          />
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {divisions.map((d) => (
          <button key={d} onClick={() => setFilter(d)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold" style={filter === d ? { background: C.blue, color: "#fff" } : { background: "#EEF1F5", color: C.muted }}>{d}</button>
        ))}
      </div>

      <div className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.line }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ color: C.muted }}>
                <th className="font-medium px-5 py-3 text-xs">Date</th>
                <th className="font-medium px-5 py-3 text-xs">Division</th>
                <th className="font-medium px-5 py-3 text-xs">Category</th>
                <th className="font-medium px-5 py-3 text-xs">Amount</th>
                <th className="font-medium px-5 py-3 text-xs">Method</th>
                <th className="font-medium px-5 py-3 text-xs">Notes</th>
                <th className="font-medium px-5 py-3 text-xs"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-t" style={{ borderColor: C.line }}>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{formatDateShort(e.date)}</td>
                  <td className="px-5 py-2.5"><Badge tone={e.division === "Transport" ? "emerald" : e.division === "Food" ? "amber" : e.division === "Hospitality" ? "coral" : "slate"}>{e.division}</Badge></td>
                  <td className="px-5 py-2.5" style={{ color: C.ink }}>{e.category}</td>
                  <td className="px-5 py-2.5 font-semibold" style={{ color: C.ink }}>{formatKES(e.amount)}</td>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{e.method}</td>
                  <td className="px-5 py-2.5" style={{ color: C.muted }}>{e.notes}</td>
                  <td className="px-5 py-2.5"><button onClick={() => onDelete("expense", e.id)} className="opacity-50 hover:opacity-100"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState text="No expenses match this filter." />}
        </div>
      </div>
    </div>
  );
}

function UpdatesView({ notifications, reminders, onMarkRead, onMarkAllRead, onToggleReminder, openModal }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>Updates & reminders</h1>
          <p className="text-sm mt-1" style={{ color: C.muted }}>Stay ahead of what needs your attention.</p>
        </div>
        <Button onClick={() => openModal("addReminder")} size="sm"><Plus size={14} /> Add reminder</Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <SectionTitle title="Notifications" action={<button onClick={onMarkAllRead} className="text-xs font-semibold" style={{ color: C.blue }}>Mark all read</button>} />
          <div className="space-y-1">
            {notifications.map((n) => (
              <button key={n.id} onClick={() => onMarkRead(n.id)} className="w-full text-left flex gap-2.5 py-2.5 border-b hover:bg-slate-50 rounded-lg px-1" style={{ borderColor: C.line }}>
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: n.read ? "transparent" : C.blue }} />
                <div>
                  <p className="text-sm" style={{ color: C.ink }}>{n.message}</p>
                  <p className="text-xs mt-0.5" style={{ color: C.muted }}>{n.time}</p>
                </div>
              </button>
            ))}
            {notifications.length === 0 && <EmptyState text="No notifications." />}
          </div>
        </Card>

        <Card>
          <SectionTitle title="Reminders" />
          <div className="space-y-1">
            {reminders.map((r) => {
              const overdue = !r.done && new Date(r.due) < new Date(TODAY);
              return (
                <label key={r.id} className="flex items-center gap-3 py-2.5 border-b cursor-pointer" style={{ borderColor: C.line }}>
                  <input type="checkbox" checked={r.done} onChange={() => onToggleReminder(r.id)} className="rounded" />
                  <div className="flex-1">
                    <p className="text-sm" style={{ color: r.done ? C.muted : C.ink, textDecoration: r.done ? "line-through" : "none" }}>{r.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: overdue ? C.coral : C.muted }}>{overdue ? "Overdue - " : "Due "}{formatDateShort(r.due)}</p>
                  </div>
                </label>
              );
            })}
            {reminders.length === 0 && <EmptyState text="No reminders yet." />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SettingsView({ companyName, setCompanyName, companyTagline, setCompanyTagline, notifPrefs, setNotifPrefs, userName, role, pushToast }) {
  const handleSave = (e) => { e.preventDefault(); pushToast("Settings saved"); };
  const toggle = (key) => setNotifPrefs((p) => ({ ...p, [key]: !p[key] }));
  const prefsList = [
    { key: "bookings", label: "New bookings" },
    { key: "expenses", label: "Outstanding expenses" },
    { key: "trips", label: "New trips" },
    { key: "orders", label: "New orders" },
  ];
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold" style={{ color: C.ink, fontFamily: "Sora, sans-serif" }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Manage your workspace and preferences.</p>
      </div>

      <Card>
        <SectionTitle title="Company profile" />
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Company name</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: C.line }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>Tagline</label>
            <input value={companyTagline} onChange={(e) => setCompanyTagline(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: C.line }} />
          </div>
          <Button type="submit">Save changes</Button>
        </form>
      </Card>

      <Card>
        <SectionTitle title="Notification preferences" />
        <div className="space-y-3">
          {prefsList.map((p) => (
            <div key={p.key} className="flex items-center justify-between">
              <span className="text-sm" style={{ color: C.ink }}>{p.label}</span>
              <button onClick={() => toggle(p.key)} className="w-11 h-6 rounded-full relative transition-colors" style={{ background: notifPrefs[p.key] ? C.blue : "#DADFE7" }}>
                <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: notifPrefs[p.key] ? 22 : 2 }} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle title="Account" />
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: C.navy800 }}>{userName.split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
          <div>
            <p className="text-sm font-semibold" style={{ color: C.ink }}>{userName}</p>
            <p className="text-xs" style={{ color: C.muted }}>{role}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============================== app ============================== */

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState("Super Admin");
  const [userName] = useState("Wanjiku Kamande");
  const [activeView, setActiveView] = useState("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState("This Month");
  const [companyName, setCompanyName] = useState("Nexora Holdings Ltd");
  const [companyTagline, setCompanyTagline] = useState("One Business. Total Control.");
  const [notifPrefs, setNotifPrefs] = useState({ bookings: true, expenses: true, trips: true, orders: false });

  const [vehicles, setVehicles] = useState(SEED_VEHICLES);
  const [drivers] = useState(SEED_DRIVERS);
  const [trips, setTrips] = useState(SEED_TRIPS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [rooms, setRooms] = useState(SEED_ROOMS);
  const [bookings, setBookings] = useState(SEED_BOOKINGS);
  const [expenses, setExpenses] = useState(SEED_EXPENSES);
  const [users, setUsers] = useState(SEED_USERS);
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const [reminders, setReminders] = useState(SEED_REMINDERS);

  const navItems = NAV_ITEMS.filter((i) => i.roles.includes(role));

  useEffect(() => {
    if (!navItems.some((i) => i.key === activeView)) {
      setActiveView(navItems[0] ? navItems[0].key : "updates");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const pushToast = (message) => {
    const id = genId("toast");
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const addNotification = (message) => {
    setNotifications((prev) => [{ id: genId("n"), message, time: "Just now", read: false }, ...prev]);
  };

  const openModal = (key) => setActiveModal(key);
  const closeModal = () => setActiveModal(null);

  const handleDelete = (type, id) => {
    const map = { trip: setTrips, order: setOrders, booking: setBookings, expense: setExpenses, user: setUsers };
    const setter = map[type];
    if (setter) setter((prev) => prev.filter((item) => item.id !== id));
    pushToast("Removed");
  };

  const handleAddTrip = (v) => {
    setTrips((prev) => [{ id: genId("t"), date: v.date, vehicleId: v.vehicleId, driverId: v.driverId, origin: v.origin, destination: v.destination, amount: Number(v.amount) || 0, expenses: Number(v.expenses) || 0, status: v.status }, ...prev]);
    addNotification(`New trip scheduled: ${v.origin} to ${v.destination}`);
    pushToast("Trip added");
  };

  const handleAddExpense = (v) => {
    setExpenses((prev) => [{ id: genId("e"), date: v.date, division: v.division, category: v.category, amount: Number(v.amount) || 0, method: v.method, notes: v.notes }, ...prev]);
    addNotification(`New expense logged: ${v.category} - ${formatKES(v.amount)}`);
    pushToast("Expense recorded");
  };

  const handleAddOrder = (v) => {
    setOrders((prev) => [{ id: genId("o"), date: v.date, customer: v.customer, item: v.item, qty: Number(v.qty) || 1, amount: Number(v.amount) || 0, paymentStatus: v.paymentStatus, orderStatus: v.orderStatus }, ...prev]);
    addNotification(`New order from ${v.customer}`);
    pushToast("Order added");
  };

  const handleAddBooking = (v) => {
    setBookings((prev) => [{ id: genId("b"), guest: v.guest, roomId: v.roomId, checkIn: v.checkIn, checkOut: v.checkOut, amount: Number(v.amount) || 0, paymentStatus: v.paymentStatus, status: v.status }, ...prev]);
    if (v.status === "Checked In") {
      setRooms((prev) => prev.map((r) => (r.id === v.roomId ? { ...r, status: "Occupied" } : r)));
    }
    addNotification(`New booking: ${v.guest}`);
    pushToast("Booking added");
  };

  const handleAddVehicle = (v) => {
    setVehicles((prev) => [{ id: genId("v"), reg: v.reg, type: v.type, model: v.model, driverId: v.driverId, status: v.status, mileage: Number(v.mileage) || 0 }, ...prev]);
    pushToast("Vehicle added");
  };

  const handleAddRoom = (v) => {
    setRooms((prev) => [{ id: genId("r"), number: v.number, type: v.type, price: Number(v.price) || 0, status: v.status }, ...prev]);
    pushToast("Room added");
  };

  const handleAddUser = (v) => {
    setUsers((prev) => [{ id: genId("u"), name: v.name, email: v.email, role: v.role, division: v.division, status: "Invited" }, ...prev]);
    pushToast("Invitation sent");
  };

  const handleAddReminder = (v) => {
    setReminders((prev) => [{ id: genId("rem"), title: v.title, due: v.due, done: false }, ...prev]);
    pushToast("Reminder added");
  };

  const markRead = (id) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const toggleReminder = (id) => setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));

  const quickActions = {
    newTrip: {
      title: "New trip", submitLabel: "Add trip", onSubmit: handleAddTrip,
      fields: [
        { key: "date", label: "Date", type: "date", default: TODAY },
        { key: "vehicleId", label: "Vehicle", type: "select", options: vehicles.map((v) => ({ value: v.id, label: `${v.reg} - ${v.model}` })) },
        { key: "driverId", label: "Driver", type: "select", options: drivers.map((d) => ({ value: d.id, label: d.name })) },
        { key: "origin", label: "Origin", type: "text", default: "Nairobi" },
        { key: "destination", label: "Destination", type: "text", placeholder: "e.g. Kisumu" },
        { key: "amount", label: "Amount received (KSh)", type: "number", default: "0" },
        { key: "expenses", label: "Trip expenses (KSh)", type: "number", default: "0" },
        { key: "status", label: "Status", type: "select", options: [{ value: "Scheduled", label: "Scheduled" }, { value: "In Transit", label: "In Transit" }, { value: "Completed", label: "Completed" }] },
      ],
    },
    newExpense: {
      title: "New expense", submitLabel: "Add expense", onSubmit: handleAddExpense,
      fields: [
        { key: "date", label: "Date", type: "date", default: TODAY },
        { key: "division", label: "Division", type: "select", options: ["Transport", "Food", "Hospitality", "General"].map((d) => ({ value: d, label: d })) },
        { key: "category", label: "Category", type: "text", placeholder: "e.g. Fuel, Supplies" },
        { key: "amount", label: "Amount (KSh)", type: "number", default: "0" },
        { key: "method", label: "Payment method", type: "select", options: ["M-Pesa", "Bank Transfer", "Cash", "Card"].map((m) => ({ value: m, label: m })) },
        { key: "notes", label: "Notes", type: "textarea" },
      ],
    },
    newOrder: {
      title: "New order", submitLabel: "Add order", onSubmit: handleAddOrder,
      fields: [
        { key: "date", label: "Date", type: "date", default: TODAY },
        { key: "customer", label: "Customer", type: "text" },
        { key: "item", label: "Item / service", type: "text" },
        { key: "qty", label: "Quantity", type: "number", default: "1" },
        { key: "amount", label: "Amount (KSh)", type: "number", default: "0" },
        { key: "paymentStatus", label: "Payment status", type: "select", options: ["Paid", "Pending"].map((s) => ({ value: s, label: s })) },
        { key: "orderStatus", label: "Order status", type: "select", options: ["Preparing", "Delivered", "Cancelled"].map((s) => ({ value: s, label: s })) },
      ],
    },
    newBooking: {
      title: "New booking", submitLabel: "Add booking", onSubmit: handleAddBooking,
      fields: [
        { key: "guest", label: "Guest name", type: "text" },
        { key: "roomId", label: "Room", type: "select", options: rooms.map((r) => ({ value: r.id, label: `${r.number} - ${r.type}` })) },
        { key: "checkIn", label: "Check-in", type: "date", default: TODAY },
        { key: "checkOut", label: "Check-out", type: "date", default: TODAY },
        { key: "amount", label: "Amount (KSh)", type: "number", default: "0" },
        { key: "paymentStatus", label: "Payment status", type: "select", options: ["Paid", "Pending"].map((s) => ({ value: s, label: s })) },
        { key: "status", label: "Status", type: "select", options: ["Confirmed", "Checked In", "Checked Out"].map((s) => ({ value: s, label: s })) },
      ],
    },
    addVehicle: {
      title: "Add vehicle", submitLabel: "Add vehicle", onSubmit: handleAddVehicle,
      fields: [
        { key: "reg", label: "Registration number", type: "text", placeholder: "e.g. KDE 100X" },
        { key: "type", label: "Type", type: "select", options: ["Bus", "Shuttle", "Truck", "Van"].map((t) => ({ value: t, label: t })) },
        { key: "model", label: "Make / model", type: "text" },
        { key: "driverId", label: "Driver", type: "select", options: drivers.map((d) => ({ value: d.id, label: d.name })) },
        { key: "status", label: "Status", type: "select", options: ["Active", "Maintenance", "Inactive"].map((s) => ({ value: s, label: s })) },
        { key: "mileage", label: "Mileage (km)", type: "number", default: "0" },
      ],
    },
    addRoom: {
      title: "Add room", submitLabel: "Add room", onSubmit: handleAddRoom,
      fields: [
        { key: "number", label: "Room number", type: "text" },
        { key: "type", label: "Room type", type: "select", options: ["Standard", "Deluxe", "Executive Suite"].map((t) => ({ value: t, label: t })) },
        { key: "price", label: "Price per night (KSh)", type: "number", default: "0" },
        { key: "status", label: "Status", type: "select", options: ["Available", "Occupied", "Cleaning"].map((s) => ({ value: s, label: s })) },
      ],
    },
    addUser: {
      title: "Add user", submitLabel: "Send invite", onSubmit: handleAddUser,
      fields: [
        { key: "name", label: "Full name", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "role", label: "Role", type: "select", options: ROLES.map((r) => ({ value: r, label: r })) },
        { key: "division", label: "Division", type: "select", options: ["All", "Transport", "Food", "Hospitality"].map((d) => ({ value: d, label: d })) },
      ],
    },
    addReminder: {
      title: "Add reminder", submitLabel: "Add reminder", onSubmit: handleAddReminder,
      fields: [
        { key: "title", label: "Title", type: "text" },
        { key: "due", label: "Due date", type: "date", default: TODAY },
      ],
    },
  };

  if (!loggedIn) {
    return <LoginScreen role={role} setRole={setRole} onLogin={() => setLoggedIn(true)} />;
  }

  const renderView = () => {
    switch (activeView) {
      case "overview":
        return (
          <OverviewView
            trips={trips} orders={orders} bookings={bookings} rooms={rooms} expenses={expenses}
            users={users} notifications={notifications} reminders={reminders} searchTerm={searchTerm}
            period={period} setPeriod={setPeriod} setActiveView={setActiveView}
          />
        );
      case "all":
        return <AllServicesView trips={trips} orders={orders} bookings={bookings} expenses={expenses} setActiveView={setActiveView} />;
      case "transport":
        return <TransportView vehicles={vehicles} drivers={drivers} trips={trips} expenses={expenses} searchTerm={searchTerm} openModal={openModal} onDelete={handleDelete} />;
      case "food":
        return <FoodView orders={orders} expenses={expenses} searchTerm={searchTerm} openModal={openModal} onDelete={handleDelete} />;
      case "hospitality":
        return <HospitalityView rooms={rooms} bookings={bookings} expenses={expenses} searchTerm={searchTerm} openModal={openModal} onDelete={handleDelete} />;
      case "users":
        return <UsersView users={users} searchTerm={searchTerm} openModal={openModal} onDelete={handleDelete} />;
      case "reports":
        return <ReportsView trips={trips} orders={orders} bookings={bookings} expenses={expenses} />;
      case "expenses":
        return <ExpensesView expenses={expenses} searchTerm={searchTerm} openModal={openModal} onDelete={handleDelete} />;
      case "updates":
        return <UpdatesView notifications={notifications} reminders={reminders} onMarkRead={markRead} onMarkAllRead={markAllRead} onToggleReminder={toggleReminder} openModal={openModal} />;
      case "settings":
        return (
          <SettingsView
            companyName={companyName} setCompanyName={setCompanyName} companyTagline={companyTagline}
            setCompanyTagline={setCompanyTagline} notifPrefs={notifPrefs} setNotifPrefs={setNotifPrefs}
            userName={userName} role={role} pushToast={pushToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="n1-font-body h-screen w-full flex overflow-hidden" style={{ background: C.surface, color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        .n1-font-body { font-family: 'Inter', sans-serif; }
        @keyframes n1fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .n1-toast { animation: n1fade .25s ease; }
        .n1-modal { animation: n1fade .18s ease; }
        .n1-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .n1-scroll::-webkit-scrollbar-thumb { background: #CBD3E0; border-radius: 99px; }
      `}</style>

      <Sidebar items={navItems} activeView={activeView} setActiveView={setActiveView} role={role} setRole={setRole} onLogout={() => setLoggedIn(false)} />
      <MobileDrawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} items={navItems} activeView={activeView} setActiveView={setActiveView} role={role} setRole={setRole} onLogout={() => setLoggedIn(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onMenuClick={() => setMobileNavOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          notifications={notifications}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          onOpenModal={openModal}
          userName={userName}
          role={role}
          onLogout={() => setLoggedIn(false)}
          setActiveView={setActiveView}
        />
        <main className="flex-1 overflow-y-auto n1-scroll p-4 md:p-8 pb-24 md:pb-8">
          {renderView()}
        </main>
        <MobileBottomNav items={navItems} activeView={activeView} setActiveView={setActiveView} onMore={() => setMobileNavOpen(true)} />
      </div>

      <ToastStack toasts={toasts} />
      {activeModal && quickActions[activeModal] && (
        <FormModal
          config={quickActions[activeModal]}
          onClose={closeModal}
          onSubmit={(vals) => { quickActions[activeModal].onSubmit(vals); closeModal(); }}
        />
      )}
    </div>
  );
}
