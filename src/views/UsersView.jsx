/* Users & roles. Only Super Admin / Admin can reach this view. */
import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ShieldCheck, Users as UsersIcon, Mail } from "lucide-react";
import { C, ROLE_VIEWS, ROLES, DIVISIONS } from "../lib/constants";
import { relativeTime } from "../lib/format";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, SectionTitle, Badge, Button, Avatar } from "../components/ui.jsx";
import DataTable from "../components/DataTable.jsx";
import FilterBar, { selectFilter } from "../components/FilterBar.jsx";
import { PageHeader, Page } from "../components/Page.jsx";
import { statusTone } from "../lib/constants";

const ACCESS_SUMMARY = {
  "Super Admin": "Everything, including users & settings",
  Admin: "Everything, including users & settings",
  "Transport Manager": "Transport, Expenses, Reports, Messages",
  "Food Manager": "Food, Expenses, Reports, Messages",
  "Hospitality Manager": "Hospitality, Expenses, Reports, Messages",
  Accountant: "All divisions read-only, Expenses & Reports",
  Staff: "Overview, Messages & Settings only",
};

export default function UsersView() {
  const { data } = useStore();
  const { openForm, editRecord, deleteRecord, caps } = useActions();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [division, setDivision] = useState("All");

  const ql = q.trim().toLowerCase();
  const shown = data.users
    .filter((u) => role === "All" || u.role === role)
    .filter((u) => status === "All" || u.status === status)
    .filter((u) => division === "All" || u.division === division)
    .filter((u) => !ql || `${u.name} ${u.email}`.toLowerCase().includes(ql));
  const dirty = ql || role !== "All" || status !== "All" || division !== "All";

  const active = data.users.filter((u) => u.status === "Active").length;
  const invited = data.users.filter((u) => u.status === "Invited").length;

  const roleCounts = useMemo(() => {
    const map = {};
    data.users.forEach((u) => { map[u.role] = (map[u.role] || 0) + 1; });
    return map;
  }, [data.users]);

  const columns = [
    { key: "name", header: "Name", render: (r) => (
      <span className="flex items-center gap-2.5">
        <Avatar name={r.name} size={30} />
        <span className="font-semibold">{r.name}</span>
      </span>
    ) },
    { key: "email", header: "Email", muted: true, render: (r) => (
      <span className="flex items-center gap-1.5"><Mail size={12} style={{ color: C.faint }} />{r.email}</span>
    ) },
    { key: "role", header: "Role", sortValue: (r) => r.role, render: (r) => <Badge tone="blue" size="sm">{r.role}</Badge> },
    { key: "division", header: "Division", sortValue: (r) => r.division },
    { key: "lastActive", header: "Last active", sortValue: (r) => r.lastActive || "", render: (r) => r.lastActive ? relativeTime(r.lastActive) : "-", muted: true },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <Badge tone={statusTone(r.status)} size="sm">{r.status}</Badge> },
  ];

  const actions = caps.manageUsers ? [
    { label: "Edit", icon: Pencil, onClick: (r) => editRecord("users", r.id) },
    { label: "Remove", icon: Trash2, tone: "danger", onClick: (r) => deleteRecord("users", r.id) },
  ] : [];

  return (
    <Page>
      <PageHeader
        title="Users & roles"
        subtitle="Manage who can access each part of the workspace."
        actions={caps.manageUsers && <Button size="sm" onClick={() => openForm("user")}><Plus size={14} /> Invite user</Button>}
      />

      <div className="grid grid-cols-1 min-[430px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={UsersIcon} label="Total users" value={data.users.length} tint={C.blue} />
        <StatCard icon={ShieldCheck} label="Active" value={active} tint={C.emerald} />
        <StatCard icon={Mail} label="Pending invites" value={invited} tint={C.amber} />
        <StatCard icon={ShieldCheck} label="Roles in use" value={Object.keys(roleCounts).length} tint={C.violet} />
      </div>

      <Card padded={false}>
        <div className="p-4 sm:p-5 pb-3"><SectionTitle title={`Team · ${data.users.length}`} /></div>
        <div className="px-3 sm:px-5 pb-5">
          <FilterBar
            search={{ value: q, onChange: setQ, placeholder: "Name or email..." }}
            selects={[
              selectFilter("role", "Role", ROLES, role, setRole),
              selectFilter("st", "Status", ["Active", "Invited", "Suspended"], status, setStatus),
              selectFilter("div", "Division", ["All", ...DIVISIONS.filter((d) => d !== "General")], division, setDivision),
            ]}
            dirty={!!dirty}
            onClear={() => { setQ(""); setRole("All"); setStatus("All"); setDivision("All"); }}
          />
          <DataTable
            columns={columns}
            rows={shown}
            actions={actions}
            exportName="kash-users"
            initialSort={{ key: "name", dir: "asc" }}
            emptyIcon={UsersIcon}
            emptyText="No users match these filters."
          />
        </div>
      </Card>

      <Card>
        <SectionTitle title="Role permissions" subtitle="What each role can open" />
        <div className="space-y-2.5">
          {Object.entries(ACCESS_SUMMARY).map(([rname, access]) => (
            <div key={rname} className="flex items-start gap-2.5 text-sm">
              <ShieldCheck size={16} style={{ color: C.blue, marginTop: 2 }} />
              <div>
                <span className="font-semibold" style={{ color: C.ink }}>{rname}</span>
                {roleCounts[rname] ? <span className="text-xs ml-2" style={{ color: C.faint }}>({roleCounts[rname]})</span> : null}
                <span className="block text-xs mt-0.5" style={{ color: C.muted }}>{access}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Page>
  );
}
