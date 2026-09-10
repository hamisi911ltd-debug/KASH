/* ============================================================
   Messages - message anyone on the platform. A people list on the
   left, the conversation on the right, a box to reply. A second
   tab keeps the shared reminder list.
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Send, Search, MessagesSquare, Clock, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { C, DIVISIONS } from "../lib/constants";
import { relativeTime, formatDateLong } from "../lib/format";
import { TODAY } from "../lib/seed";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { useMediaQuery } from "../lib/hooks.js";
import { Card, SectionTitle, Badge, Button, Avatar, Segmented, EmptyState, ChipRow } from "../components/ui.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const PRIORITY_TONE = { High: "coral", Normal: "blue", Low: "slate" };

/* ---------------------------------------------------------- Messages ---------- */

function Messages() {
  const { data, session, addRecord, patchRecord, notifyIfEnabled } = useStore();
  const me = session?.name;
  const [q, setQ] = useState("");
  const [activeName, setActiveName] = useState(null);
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  const contacts = useMemo(() => {
    const others = data.users.filter((u) => u.name !== me);
    return others
      .map((u) => {
        const thread = data.messages
          .filter((m) => (m.from === me && m.to === u.name) || (m.from === u.name && m.to === me))
          .sort((a, b) => new Date(a.ts) - new Date(b.ts));
        const last = thread[thread.length - 1];
        const unread = thread.filter((m) => m.to === me && !m.read).length;
        return { user: u, thread, last, unread };
      })
      .sort((a, b) => {
        const at = a.last ? new Date(a.last.ts).getTime() : 0;
        const bt = b.last ? new Date(b.last.ts).getTime() : 0;
        return bt - at;
      });
  }, [data.users, data.messages, me]);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const filtered = contacts.filter((c) => !q || c.user.name.toLowerCase().includes(q.toLowerCase()));
  const active = contacts.find((c) => c.user.name === activeName) || (isDesktop ? filtered[0] || contacts[0] : null);
  // on phones we show either the list or the open thread, not both
  const showList = isDesktop || !activeName;
  const showThread = isDesktop || !!activeName;

  // mark the open conversation's incoming messages read
  useEffect(() => {
    if (!active) return;
    active.thread.forEach((m) => {
      if (m.to === me && !m.read) patchRecord("messages", m.id, { read: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.user.name, data.messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [active?.thread.length]);

  const send = (e) => {
    e?.preventDefault?.();
    const text = draft.trim();
    if (!text || !active) return;
    addRecord("messages", { from: me, to: active.user.name, text, ts: new Date().toISOString(), read: false });
    notifyIfEnabled("alerts", `New message from ${me}`, { type: "message", division: "General" });
    setDraft("");
  };

  const totalUnread = contacts.reduce((s, c) => s + c.unread, 0);

  return (
    <Card padded={false}>
      <div className="md:grid md:grid-cols-[300px_1fr]" style={{ minHeight: 480 }}>
        {/* people */}
        <div className={`${showList ? "flex" : "hidden md:flex"} border-b md:border-b-0 md:border-r flex-col`} style={{ borderColor: C.line }}>
          <div className="p-3 sm:p-4 pb-3">
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: C.line, background: C.surface }}>
              <Search size={14} style={{ color: C.muted }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people..." className="bg-transparent text-sm flex-1 outline-none" style={{ color: C.ink }} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto n1-scroll max-h-[70vh] md:max-h-[460px]">
            {filtered.map((c) => {
              const on = active?.user.name === c.user.name;
              return (
                <button
                  key={c.user.name}
                  onClick={() => setActiveName(c.user.name)}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left transition-colors border-b"
                  style={{ borderColor: C.line, background: on ? C.blueSoft : "transparent" }}
                >
                  <Avatar name={c.user.name} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{c.user.name}</p>
                      {c.last && <span className="text-[10px] shrink-0" style={{ color: C.faint }}>{relativeTime(c.last.ts)}</span>}
                    </div>
                    <p className="text-xs truncate" style={{ color: c.unread ? C.ink : C.faint }}>
                      {c.last ? `${c.last.from === me ? "You: " : ""}${c.last.text}` : c.user.role}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="h-5 min-w-5 px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0" style={{ background: C.blue }}>
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && <EmptyState text="No one matches." />}
          </div>
        </div>

        {/* conversation */}
        <div className={`${showThread ? "flex" : "hidden md:flex"} flex-col`} style={{ minHeight: 420 }}>
          {!active ? (
            <div className="hidden md:block"><EmptyState icon={MessagesSquare} text="Pick someone to start" /></div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b" style={{ borderColor: C.line }}>
                <button onClick={() => setActiveName(null)} className="md:hidden -ml-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ color: C.ink }}>
                  <ArrowLeft size={18} />
                </button>
                <Avatar name={active.user.name} size={36} />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: C.ink }}>{active.user.name}</p>
                  <p className="text-xs truncate" style={{ color: C.muted }}>{active.user.role} · {active.user.division}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto n1-scroll px-4 sm:px-5 py-4 space-y-2.5" style={{ background: C.surface2, maxHeight: "60vh" }}>
                {active.thread.length === 0 && (
                  <p className="text-center text-xs py-8" style={{ color: C.faint }}>No messages yet. Say hello.</p>
                )}
                {active.thread.map((m, i) => {
                  const mine = m.from === me;
                  const showDay = i === 0 || new Date(m.ts).toDateString() !== new Date(active.thread[i - 1].ts).toDateString();
                  return (
                    <React.Fragment key={m.id}>
                      {showDay && (
                        <p className="text-center text-[10px] font-semibold my-2" style={{ color: C.faint }}>
                          {formatDateLong(m.ts.slice(0, 10))}
                        </p>
                      )}
                      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[78%] rounded-2xl px-3.5 py-2 text-sm"
                          style={
                            mine
                              ? { background: C.blue, color: "#fff", borderBottomRightRadius: 4 }
                              : { background: C.surface, color: C.ink, border: `1px solid ${C.line}`, borderBottomLeftRadius: 4 }
                          }
                        >
                          {m.text}
                          <span className="block text-[10px] mt-1 opacity-60">
                            {new Date(m.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={endRef} />
              </div>

              <form onSubmit={send} className="flex items-end gap-2 p-2.5 sm:p-3 border-t" style={{ borderColor: C.line }}>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  rows={1}
                  placeholder={`Message ${active.user.name.split(" ")[0]}...`}
                  className="flex-1 rounded-xl border px-3 py-2.5 text-sm outline-none resize-none n1-scroll"
                  style={{ borderColor: C.line, background: C.surface, color: C.ink, maxHeight: 120 }}
                />
                <Button type="submit" onClick={send} disabled={!draft.trim()} className="shrink-0"><Send size={14} /> <span className="hidden sm:inline">Send</span></Button>
              </form>
            </>
          )}
        </div>
      </div>

      {totalUnread > 0 && (
        <p className="px-4 sm:px-5 py-2 text-xs border-t" style={{ borderColor: C.line, color: C.muted }}>
          {totalUnread} unread message{totalUnread === 1 ? "" : "s"} across {contacts.filter((c) => c.unread).length} chat{contacts.filter((c) => c.unread).length === 1 ? "" : "s"}.
        </p>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------- Reminders --------- */

function Reminders() {
  const { data, toggleReminder } = useStore();
  const { openForm, editRecord, deleteRecord, caps } = useActions();
  const [filter, setFilter] = useState("open");
  const [div, setDiv] = useState("All");

  const rows = data.reminders
    .filter((r) => (filter === "all" ? true : filter === "done" ? r.done : !r.done))
    .filter((r) => div === "All" || r.division === div)
    .sort((a, b) => (a.due < b.due ? -1 : 1));

  return (
    <Card padded={false}>
      <div className="p-4 sm:p-5 pb-3">
        <SectionTitle
          title="Reminders"
          action={
            <Segmented
              options={[{ value: "open", label: "Open" }, { value: "done", label: "Done" }, { value: "all", label: "All" }]}
              value={filter}
              onChange={setFilter}
            />
          }
        />
      </div>
      <div className="px-3 sm:px-5 pb-3">
        <ChipRow options={["All", ...DIVISIONS]} value={div} onChange={setDiv} />
      </div>
      <div className="px-5 pb-5 space-y-1">
        {rows.length === 0 && <EmptyState icon={Clock} text="Nothing here" />}
        {rows.map((r) => {
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
                  <button onClick={() => editRecord("reminders", r.id)} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ color: C.muted }}><Pencil size={13} /></button>
                  <button onClick={() => deleteRecord("reminders", r.id)} className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ color: C.coral }}><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------- shell ------------- */

export default function MessagesView() {
  const { data, session } = useStore();
  const { openForm } = useActions();
  const [tab, setTab] = useState("messages");

  const unread = data.messages.filter((m) => m.to === session?.name && !m.read).length;
  const openReminders = data.reminders.filter((r) => !r.done).length;

  return (
    <Page>
      <PageHeader
        title="Messages"
        subtitle="Message anyone on the platform, and track shared reminders."
        actions={
          <>
            {tab === "reminders" ? (
              <Button size="sm" onClick={() => openForm("reminder")}><Plus size={14} /> Add reminder</Button>
            ) : (
              <Button size="sm" onClick={() => openForm("message")}><Plus size={14} /> New message</Button>
            )}
          </>
        }
      />

      <Segmented
        options={[
          { value: "messages", label: `Messages${unread ? ` · ${unread}` : ""}` },
          { value: "reminders", label: `Reminders${openReminders ? ` · ${openReminders}` : ""}` },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "messages" ? <Messages /> : <Reminders />}
    </Page>
  );
}
