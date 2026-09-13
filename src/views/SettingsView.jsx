/* Settings: company profile (used across the app), notification
   preferences (gate the notification feed), appearance, and account
   info. Data lives on the server now, shared across the team. */
import React, { useState } from "react";
import { Building2, Bell, Palette, Database, Download, Sun, Moon, Check } from "lucide-react";
import { C } from "../lib/constants";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, SectionTitle, Button, Toggle, Avatar, Badge, Segmented } from "../components/ui.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

function Labelled({ label, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: C.muted }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: C.faint }}>{hint}</p>}
    </div>
  );
}

const input = "w-full rounded-lg border px-3 py-2 text-sm outline-none";

export default function SettingsView() {
  const { data, updateCompany, prefs, setPrefs, theme, setTheme, toast, exportBackup, session } = useStore();
  const { caps, navigate } = useActions();
  const [company, setCompany] = useState(data.company);

  const saveCompany = async (e) => {
    e.preventDefault();
    try {
      await updateCompany(company);
      toast("Company profile saved");
    } catch (err) {
      toast(err.message || "Could not save that.", { tone: "error" });
    }
  };

  const notifRows = [
    { key: "bookings", label: "New bookings" },
    { key: "orders", label: "New food orders" },
    { key: "trips", label: "New trips" },
    { key: "expenses", label: "Logged expenses" },
    { key: "alerts", label: "Operational alerts" },
  ];

  return (
    <Page>
      <PageHeader title="Settings" subtitle="Manage your workspace, preferences and data." />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* company */}
        <Card>
          <SectionTitle title="Company profile" action={<Building2 size={16} style={{ color: C.muted }} />} />
          <form onSubmit={saveCompany} className="space-y-3.5">
            <Labelled label="Company name">
              <input value={company.name} onChange={(e) => setCompany((c) => ({ ...c, name: e.target.value }))} className={input} style={{ borderColor: C.line }} />
            </Labelled>
            <Labelled label="Tagline" hint="Shown under the logo in the sidebar and sign-in screen.">
              <input value={company.tagline} onChange={(e) => setCompany((c) => ({ ...c, tagline: e.target.value }))} className={input} style={{ borderColor: C.line }} />
            </Labelled>
            <div className="grid grid-cols-2 gap-3">
              <Labelled label="Email">
                <input value={company.email} onChange={(e) => setCompany((c) => ({ ...c, email: e.target.value }))} className={input} style={{ borderColor: C.line }} />
              </Labelled>
              <Labelled label="Phone">
                <input value={company.phone} onChange={(e) => setCompany((c) => ({ ...c, phone: e.target.value }))} className={input} style={{ borderColor: C.line }} />
              </Labelled>
            </div>
            <Labelled label="Address">
              <input value={company.address} onChange={(e) => setCompany((c) => ({ ...c, address: e.target.value }))} className={input} style={{ borderColor: C.line }} />
            </Labelled>
            <Labelled label="KRA PIN">
              <input value={company.taxId} onChange={(e) => setCompany((c) => ({ ...c, taxId: e.target.value }))} className={input} style={{ borderColor: C.line }} />
            </Labelled>
            <Button type="submit" disabled={!caps.settings && session?.role !== "Super Admin"}>Save changes</Button>
            {!caps.settings && <p className="text-xs" style={{ color: C.faint }}>Your role can view but not change company settings.</p>}
          </form>
        </Card>

        {/* appearance + notifications */}
        <div className="space-y-4">
          <Card>
            <SectionTitle title="Appearance" action={<Palette size={16} style={{ color: C.muted }} />} />
            <Labelled label="Theme">
              <div className="flex gap-2">
                {[
                  { key: "light", label: "Light", icon: Sun },
                  { key: "dark", label: "Dark", icon: Moon },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setTheme(opt.key)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors"
                    style={{
                      borderColor: theme === opt.key ? C.blue : C.line,
                      background: theme === opt.key ? C.blueSoft : C.surface,
                      color: theme === opt.key ? C.blue : C.ink,
                    }}
                  >
                    <opt.icon size={15} /> {opt.label}
                    {theme === opt.key && <Check size={14} />}
                  </button>
                ))}
              </div>
            </Labelled>
            <div className="mt-4">
              <Labelled label="Table density" hint="Applies to record tables across the app.">
                <Segmented
                  options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]}
                  value={prefs.density}
                  onChange={(v) => setPrefs((p) => ({ ...p, density: v }))}
                />
              </Labelled>
            </div>
          </Card>

          <Card>
            <SectionTitle title="Notifications" action={<Bell size={16} style={{ color: C.muted }} />} />
            <p className="text-xs mb-3" style={{ color: C.faint }}>
              Turn a channel off to stop those events reaching your notification feed.
            </p>
            <div className="space-y-3">
              {notifRows.map((row) => (
                <Toggle
                  key={row.key}
                  label={row.label}
                  checked={prefs.notify[row.key] !== false}
                  onChange={(v) => setPrefs((p) => ({ ...p, notify: { ...p.notify, [row.key]: v } }))}
                />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* data management */}
      <Card>
        <SectionTitle title="Data management" action={<Database size={16} style={{ color: C.muted }} />} />
        <p className="text-sm" style={{ color: C.muted }}>
          Everything you enter is stored securely on the server and shared across your whole team, on any device.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={exportBackup}><Download size={14} /> Export what I can see (JSON)</Button>
        </div>
      </Card>

      {/* account */}
      <Card>
        <SectionTitle title="Account" />
        <div className="flex items-center gap-3">
          <Avatar name={session?.name} size={44} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: C.ink }}>{session?.name}</p>
            <p className="text-xs" style={{ color: C.muted }}>{session?.email}</p>
          </div>
          <Badge tone="blue" size="sm">{session?.role}</Badge>
        </div>
      </Card>
    </Page>
  );
}
