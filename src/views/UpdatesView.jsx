/* Updates & reminders: the notification feed plus a working task list
   with priority, division, overdue flagging and CSV export. */
import React, { useMemo, useState } from "react";
import { Plus, Bell, CheckCheck, Trash2, Clock, AlertTriangle, Pencil } from "lucide-react";
import { C, DIVISIONS } from "../lib/constants";
import { relativeTime, formatDateLong, formatDateShort } from "../lib/format";
import { buildAlerts } from "../lib/derive";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, SectionTitle, Badge, Button, ChipRow, EmptyState, Segmented } from "../components/ui.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const PRIORITY_TONE = { High: "coral", Normal: "blue", Low: "slate" };
const SEV_TONE = { high: "coral", warn: "amber", info: "blue" };

export default function UpdatesView() {
  const { data, markNotificationRead, markAllNotificationsRead, clearNotifications, toggleReminder } = useStore();
  const { openForm, editRecord, deleteRecord, navigate, caps } = useActions();
  const [remFilter, setRemFilter] = useState("open"); // open | done | all
  const [divFilter, setDivFilter] = useState("All");

  const alerts = useMemo(() => buildAlerts(data, TODAY), [data]);

  const reminders = data.reminders
    .filter((r) => (remFilter === "all" ? true : remFilter === "done" ? r.done : !r.done))
    .filter((r) => divFilter === "All" || r.division === divFilter)
    .sort((a, b) => (a.due < b.due ? -1 : 1));

  const unread = data.notifications.filter((n) => !n.read).length;

  return (
    <Page>
      <PageHeader
        title="Updates & reminders"
        subtitle="Stay ahead of what needs your attention."
        actions={caps.write && <Button size="sm" onClick={() => openForm("reminder")}><Plus size={14} /> Add reminder</Button>}
      />

      {alerts.length > 0 && (
        <Card>
          <SectionTitle title="Attention required" action={<Badge tone="coral" size="sm">{alerts.length}</Badge>} />
          <div className="grid sm:grid-cols-2 gap-2.5">
            {alerts.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(a.view)}
                className="text-left flex items-start gap-2.5 rounded-xl p-3 transition-colors"
                style={{ background: C.surface2 }}
              >
                <AlertTriangle size={15} style={{ color: `var(--${SEV_TONE[a.severity] === "coral" ? "coral" : SEV_TONE[a.severity] === "amber" ? "amber" : "blue"})`, marginTop: 2 }} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium" style={{ color: C.ink }}>{a.title}</span>
                  <span className="block text-xs mt-0.5" style={{ color: C.muted }}>{a.detail}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card padded={false}>
          <div className="p-5 pb-3 flex items-center justify-between">
            <SectionTitle title="Notifications" action={unread > 0 && <Badge tone="blue" size="sm">{unread} new</Badge>} />
            <div className="flex items-center gap-1">
              <button onClick={markAllNotificationsRead} title="Mark all read" className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ color: C.muted }}>
                <CheckCheck size={15} />
              </button>
              <button onClick={clearNotifications} title="Clear all" className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ color: C.muted }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="max-h-[440px] overflow-y-auto n1-scroll">
            {data.notifications.length === 0 && <EmptyState icon={Bell} text="No notifications" sub="You're all caught up." />}
            {data.notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className="w-full text-left px-5 py-3 flex gap-3 border-b transition-colors hover:opacity-80"
                style={{ borderColor: C.line, background: n.read ? "transparent" : C.blueSoft }}
              >
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: n.read ? "transparent" : C.blue }} />
                <div className="min-w-0">
                  <p className="text-sm" style={{ color: C.ink }}>{n.message}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-2" style={{ color: C.faint }}>
                    {relativeTime(n.ts)}
                    {n.division && n.division !== "General" && <Badge tone="slate" size="sm">{n.division}</Badge>}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card padded={false}>
          <div className="p-5 pb-3">
            <SectionTitle
              title="Reminders"
              action={
                <Segmented
                  options={[{ value: "open", label: "Open" }, { value: "done", label: "Done" }, { value: "all", label: "All" }]}
                  value={remFilter}
                  onChange={setRemFilter}
                />
              }
            />
          </div>
          <div className="px-5 pb-3">
            <ChipRow options={["All", ...DIVISIONS]} value={divFilter} onChange={setDivFilter} />
          </div>
          <div className="max-h-[380px] overflow-y-auto n1-scroll px-5 pb-5 space-y-1">
            {reminders.length === 0 && <EmptyState icon={Clock} text="Nothing here" />}
            {reminders.map((r) => {
              const overdue = !r.done && r.due < TODAY;
              return (
                <div key={r.id} className="flex items-center gap-3 py-2.5 border-b group" style={{ borderColor: C.line }}>
                  <input type="checkbox" checked={r.done} onChange={() => toggleReminder(r.id)} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: r.done ? C.faint : C.ink, textDecoration: r.done ? "line-through" : "none" }}>{r.title}</p>
                    <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: overdue ? C.coral : C.faint }}>
                      {overdue ? "Overdue · " : "Due "}{formatDateLong(r.due)}
                      <Badge tone="slate" size="sm">{r.division}</Badge>
                    </p>
                  </div>
                  <Badge tone={PRIORITY_TONE[r.priority]} size="sm">{r.priority}</Badge>
                  {caps.write && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => editRecord("reminders", r.id)} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ color: C.muted }}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteRecord("reminders", r.id)} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ color: C.coral }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </Page>
  );
}
