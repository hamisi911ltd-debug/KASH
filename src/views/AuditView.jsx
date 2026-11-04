/* Audit log: which user did what, and when. For the top managers and the IT Officer.
   The server keeps the latest 500 events (sign-ins, account changes, records
   added/edited/removed, website activity), each stamped with the person who did it.
   Passwords and IP addresses are never in it. */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ScrollText, ShieldAlert, LogIn, UserCog } from "lucide-react";
import { C } from "../lib/constants";
import { SINGULAR } from "../lib/schema";
import { api } from "../lib/api";
import { useStore } from "../lib/store.jsx";
import { Card, StatCard, Badge, Button, Segmented, Avatar } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterBar from "../components/FilterBar.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const what = (e) => (SINGULAR[e.collection] || e.collection || "record").toLowerCase();
const named = (e) => (e.label ? `: ${e.label}` : "");
/* event -> [group, tone, the action in plain words] */
const EVENTS = {
  "auth.login": ["Sign-ins", "emerald", () => "Signed in"],
  "auth.failed": ["Security", "coral", (e) => `Failed sign-in attempt${e.email ? ` for ${e.email}` : ""}`],
  "auth.throttled": ["Security", "coral", (e) => `Sign-in blocked after too many tries${e.email ? ` (${e.email})` : ""}`],
  "auth.suspended_login": ["Security", "coral", () => "Tried to sign in while suspended"],
  "auth.bot_check_failed": ["Security", "amber", () => "Failed the human check"],
  "auth.signup_refused": ["Security", "amber", (e) => `Sign-up refused${e.email ? ` for ${e.email}` : ""}`],
  "auth.registered": ["Accounts", "blue", (e) => (e.first ? "Created the first account" : "Activated their account")],
  "user.created": ["Accounts", "blue", (e) => `Created an account${e.email ? ` for ${e.email}` : ""}${e.role ? ` (${e.role})` : ""}`],
  "user.invited": ["Accounts", "blue", (e) => `Invited ${e.email || "someone"}${e.role ? ` as ${e.role}` : ""}`],
  "user.updated": ["Accounts", "blue", (e) => `Changed the account of ${e.targetName || "a user"}${e.role ? ` (${e.role}${e.status ? `, ${e.status}` : ""})` : ""}`],
  "user.deleted": ["Accounts", "coral", (e) => `Removed the account of ${e.targetName || "a user"}`],
  "record.created": ["Records", "slate", (e) => `Added a ${what(e)}${named(e)}`],
  "record.updated": ["Records", "slate", (e) => `Edited a ${what(e)}${named(e)}`],
  "record.deleted": ["Records", "coral", (e) => `Deleted a ${what(e)}${named(e)}`],
  "record.approved": ["Records", "emerald", (e) => `${e.decision ? e.decision[0].toUpperCase() + e.decision.slice(1) : "Decided on"} a ${what(e)}`],
  "rates.loaded_standard": ["Records", "slate", () => "Loaded the standard rate card"],
  "image.uploaded": ["Website", "slate", (e) => `Uploaded a website photo${e.division ? ` (${e.division})` : ""}`],
  "image.deleted": ["Website", "slate", () => "Deleted a website photo"],
  "review.received": ["Website", "amber", (e) => `Sent a customer review${e.rating ? ` (${e.rating} stars)` : ""}`],
  "review.decided": ["Website", "emerald", (e) => `${e.status === "Approved" ? "Approved" : e.status === "Rejected" ? "Rejected" : "Moved to pending"} a review${named(e)}`],
  "webrequest.received": ["Website", "slate", (e) => `Sent a website request${e.kind ? ` (${e.kind})` : ""}`],
};
const GROUPS = ["All", "Sign-ins", "Security", "Accounts", "Records", "Website"];

export default function AuditView() {
  const { data, session, toast } = useStore();
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState("All");
  const [person, setPerson] = useState("All");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.auditLog(session?.token);
      setEntries(res.entries || []);
    } catch (e) {
      toast(e.message || "Couldn't load the audit log", { tone: "warn" });
      setEntries((cur) => cur || []);
    } finally {
      setLoading(false);
    }
  }, [session?.token, toast]);
  useEffect(() => { load(); }, [load]);

  const people = useMemo(() => Object.fromEntries((data.users || []).map((u) => [u.id, u])), [data.users]);
  const rows = useMemo(
    () => (entries || []).map((e, i) => {
      const meta = EVENTS[e.audit] || ["Records", "slate", () => String(e.audit).replace(/[._]/g, " ")];
      const live = people[e.by] || people[e.userId];
      const actor = e.actor || (live ? { name: live.name, email: live.email, role: live.role } : null);
      const visitor = /^(webrequest|review)\.received$/.test(e.audit);
      const who = actor?.name || e.email || (visitor ? "Website visitor" : "Unknown");
      return { id: `${e.at}-${i}`, at: e.at, group: meta[0], tone: meta[1], action: meta[2](e), who, email: actor?.email || "", role: actor?.role || (visitor ? "Customer" : ""), detail: e };
    }),
    [entries, people]
  );
  const names = useMemo(() => ["All", ...Array.from(new Set(rows.map((r) => r.who))).sort()], [rows]);
  const counts = useMemo(() => Object.fromEntries(GROUPS.map((g) => [g, g === "All" ? rows.length : rows.filter((r) => r.group === g).length])), [rows]);
  const shown = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => (group === "All" || r.group === group) && (person === "All" || r.who === person) && (!ql || `${r.action} ${r.who} ${r.email} ${r.role}`.toLowerCase().includes(ql)));
  }, [rows, group, person, q]);

  const columns = [
    { key: "at", header: "When", sortValue: (r) => r.at, render: (r) => <span className="whitespace-nowrap">{new Date(r.at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>, csv: (r) => r.at },
    {
      key: "who", header: "User", sortValue: (r) => r.who,
      render: (r) => (
        <span className="flex items-center gap-2.5 min-w-0">
          <Avatar name={r.who} size={30} />
          <span className="min-w-0">
            <span className="block font-semibold truncate">{r.who}</span>
            <span className="block text-[11px] truncate" style={{ color: C.muted }}>{[r.role, r.email].filter(Boolean).join(" \u00b7 ")}</span>
          </span>
        </span>
      ),
      csv: (r) => `${r.who}${r.email ? ` <${r.email}>` : ""}`,
    },
    { key: "role", header: "Role", sortValue: (r) => r.role, render: (r) => r.role || "-", csv: (r) => r.role },
    { key: "action", header: "Action", wrap: true, sortValue: (r) => r.action, render: (r) => r.action, csv: (r) => r.action },
    { key: "group", header: "Type", sortValue: (r) => r.group, render: (r) => <Badge tone={r.tone} size="sm">{r.group}</Badge>, csv: (r) => r.group },
  ];

  return (
    <Page>
      <PageHeader
        title="Audit log"
        subtitle="Which user did what, and when. Kept for the latest 500 events. Passwords and IP addresses are never recorded here."
        actions={<Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw size={14} /> {loading ? "Loading..." : "Refresh"}</Button>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard icon={ScrollText} label="Events kept" value={String(rows.length)} tint={C.blue} />
        <StatCard icon={LogIn} label="Sign-ins" value={String(counts["Sign-ins"] || 0)} tint={C.emerald} />
        <StatCard icon={ShieldAlert} label="Security alerts" value={String(counts.Security || 0)} tint={C.coral} />
        <StatCard icon={UserCog} label="Account changes" value={String(counts.Accounts || 0)} tint={C.amber} />
      </div>
      <Segmented size="md" value={group} onChange={setGroup} options={GROUPS.map((g) => ({ value: g, label: `${g} (${counts[g] || 0})` }))} />
      <Card padded={false}>
        <div className="px-3 sm:px-5 py-4">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "Search a user or an action..." }}
            selects={[{ key: "person", label: "User", value: person, onChange: setPerson, options: names.map((n) => ({ value: n, label: n === "All" ? "All users" : n })) }]}
            dirty={!!q || person !== "All"}
            onClear={() => { setQ(""); setPerson("All"); }}
          />
          <DataTable columns={columns} rows={shown} pageSize={25} exportName="kash-audit-log" initialSort={{ key: "at", dir: "desc" }} emptyIcon={ScrollText} emptyText={entries === null ? "Loading the audit log..." : "Nothing recorded yet."} />
        </div>
      </Card>
    </Page>
  );
}
