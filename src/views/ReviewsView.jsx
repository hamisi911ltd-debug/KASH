/* Customer reviews. Visitors write them on the website; every one arrives as
   "Pending" and only appears there after an admin approves it here. The
   reviewer's email is shown to admins only and is never published. */
import React, { useMemo, useState } from "react";
import { Star, Check, X, Trash2, Mail, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { C, canModerateReviews } from "../lib/constants";
import { formatDateLong } from "../lib/format";
import { useStore } from "../lib/store.jsx";
import { useActions } from "../lib/actions.jsx";
import { Card, StatCard, Badge, Button, Segmented, EmptyState } from "../components/ui.jsx";
import { PageHeader, Page } from "../components/Page.jsx";

const TONE = { Pending: "amber", Approved: "emerald", Rejected: "slate" };

function Stars({ n }) {
  return (
    <span className="inline-flex" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={15} fill={i <= n ? C.amber : "none"} style={{ color: i <= n ? C.amber : C.line }} />
      ))}
    </span>
  );
}

export default function ReviewsView() {
  const { data, session, patchRecord, toast } = useStore();
  const { deleteRecord } = useActions();
  const mod = canModerateReviews(session?.role);
  const [tab, setTab] = useState("Pending");
  const [busy, setBusy] = useState("");

  const all = useMemo(() => [...(data.reviews || [])].sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt))), [data.reviews]);
  const count = (s) => all.filter((r) => r.status === s).length;
  const shown = all.filter((r) => r.status === tab);
  const approved = all.filter((r) => r.status === "Approved");
  const avg = approved.length ? (approved.reduce((t, r) => t + r.rating, 0) / approved.length).toFixed(1) : "-";

  const decide = async (r, status) => {
    setBusy(r.id);
    try {
      await patchRecord("reviews", r.id, { status });
      toast(status === "Approved" ? "Review approved. It is now on the website." : status === "Rejected" ? "Review rejected. It will not be shown." : "Moved back to pending.");
    } catch (e) {
      toast(e.message || "Couldn't save that decision", { tone: "warn" });
    } finally {
      setBusy("");
    }
  };

  return (
    <Page>
      <PageHeader title="Reviews" subtitle="Customers write reviews on the website. Nothing is published until you approve it here." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard icon={Clock} label="Waiting for approval" value={String(count("Pending"))} tint={C.amber} />
        <StatCard icon={ThumbsUp} label="Published" value={String(count("Approved"))} tint={C.emerald} />
        <StatCard icon={ThumbsDown} label="Rejected" value={String(count("Rejected"))} tint={C.muted} />
        <StatCard icon={Star} label="Average rating" value={avg} tint={C.blue} />
      </div>

      <Segmented
        size="md"
        value={tab}
        onChange={setTab}
        options={["Pending", "Approved", "Rejected"].map((s) => ({ value: s, label: `${s === "Approved" ? "Published" : s} (${count(s)})` }))}
      />

      {shown.length === 0 ? (
        <Card>
          <EmptyState
            icon={Star}
            text={tab === "Pending" ? "No reviews waiting for approval" : `No ${tab === "Approved" ? "published" : "rejected"} reviews`}
            sub={tab === "Pending" ? "New reviews from the website appear here." : ""}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{r.name}</span>
                    <Stars n={r.rating} />
                    <Badge tone={TONE[r.status] || "slate"} size="sm">{r.status === "Approved" ? "Published" : r.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs flex flex-wrap items-center gap-x-3 gap-y-0.5" style={{ color: C.muted }}>
                    <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 underline"><Mail size={12} /> {r.email}</a>
                    <span>{r.service}</span>
                    <span>{formatDateLong(r.submittedAt)}</span>
                    {r.decidedBy && <span>Decided by {r.decidedBy}</span>}
                  </p>
                </div>
                {mod && (
                  <div className="flex flex-wrap gap-2">
                    {r.status !== "Approved" && (
                      <Button size="sm" disabled={busy === r.id} onClick={() => decide(r, "Approved")}><Check size={14} /> Approve</Button>
                    )}
                    {r.status !== "Rejected" && (
                      <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => decide(r, "Rejected")}><X size={14} /> Reject</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => deleteRecord("reviews", r.id)}><Trash2 size={14} /> Delete</Button>
                  </div>
                )}
              </div>
              {r.title && <p className="mt-3 font-semibold">{r.title}</p>}
              <p className="mt-1 text-sm whitespace-pre-line" style={{ color: C.ink2 }}>{r.body}</p>
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}
